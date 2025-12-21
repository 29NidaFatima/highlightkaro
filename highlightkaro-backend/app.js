const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const { createCanvas, loadImage } = require("canvas");
require("dotenv").config();
const connectDB = require("./config/db");


const auth = require("./middleware/auth.middleware");
const plan = require("./middleware/plan.middleware");
const authRoutes = require("./routes/auth.routes");
const renderRoutes = require("./routes/render.routes");



const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api", renderRoutes);


app.use("/api/auth", require("./routes/auth.routes"));


// Multer setup for file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), "highlightkaro_uploads"),
});

// Helper: remove temp directories/files
function safeRm(targetPath) {
  if (!targetPath) return;
  fs.rm(targetPath, { recursive: true, force: true }, () => { });
}
app.post(
  "/render",
  auth,
  plan("basic19"),
  upload.single("image"),
  async (req, res) => {

  // Multer provides: req.file (image), req.body (fields)
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  const {
    x,
    y,
    w,
    h,
    color,
    opacity,
    duration,
    fps,
    anim, // "ltr" or "pulse"
  } = req.body;

  // Parse numeric fields
  const rectX = parseFloat(x);
  const rectY = parseFloat(y);
  const rectW = parseFloat(w);
  const rectH = parseFloat(h);
  const durationSec = parseFloat(duration) || 2;
  const fpsNum = parseInt(fps || "30", 10);

  // opacity from percentage
  let opacityPercent = parseFloat(opacity);
  if (opacityPercent > 1) {
    // assume 0-100
    opacityPercent = opacityPercent / 100;
  }
  const baseOpacity = Math.max(0, Math.min(1, opacityPercent));

  if (
    !Number.isFinite(rectX) ||
    !Number.isFinite(rectY) ||
    !Number.isFinite(rectW) ||
    !Number.isFinite(rectH)
  ) {
    return res.status(400).json({ error: "Invalid rectangle coordinates" });
  }

  const totalFrames = Math.max(1, Math.round(durationSec * fpsNum));

  // Temporary directory for frames and output video
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "highlightkaro-"));
  const framesDir = path.join(tmpBase, "frames");
  const outputVideoPath = path.join(tmpBase, "output.mp4");

  fs.mkdirSync(framesDir, { recursive: true });

  try {
    // Load image using node-canvas
    const img = await loadImage(req.file.path);
    const imgWidth = img.width;
    const imgHeight = img.height;

    // Force even dimensions
    const canvasWidth = imgWidth + (imgWidth % 2);
    const canvasHeight = imgHeight + (imgHeight % 2);

    // Render frames
    for (let i = 0; i < totalFrames; i++) {
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw original image (adds 0–1px transparent padding on bottom/right)
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

      // Time progress 0 → 1
      const t = totalFrames === 1 ? 1 : i / (totalFrames - 1);

      // Compute animation-specific width/opacity
      let currentWidth = rectW;
      let currentOpacity = baseOpacity;

      if (anim === "ltr") {
        // left-to-right: width grows over time
        currentWidth = rectW * t;
        currentOpacity = baseOpacity;
      } else if (anim === "pulse") {
        // pulse: width constant, opacity oscillates
        const pulses = 4; // number of pulses over whole duration
        const pulse = Math.sin(t * Math.PI * 2 * pulses) * 0.3 + 0.7; // 0.4 → 1.0 approx
        currentOpacity = baseOpacity * pulse;
      }

      // Draw highlight (similar to frontend: multiply + alpha)
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = color || "#ffff00";
      ctx.globalAlpha = currentOpacity;

      // Avoid width 0 to ensure at least one pixel
      const drawWidth = Math.max(1, currentWidth);

      ctx.fillRect(rectX, rectY, drawWidth, rectH);

      // Reset
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // Save frame as PNG
      const frameIndexStr = String(i + 1).padStart(4, "0"); // 0001, 0002, ...
      const framePath = path.join(framesDir, `frame-${frameIndexStr}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(framePath, buffer);
    }

    // Now call ffmpeg to turn frames into MP4
    // ffmpeg -y -framerate <fps> -i frame-%04d.png -c:v libx264 -pix_fmt yuv420p output.mp4

    const ffmpegArgs = [
      "-y",
      "-framerate",
      String(fpsNum),
      "-i",
      path.join(framesDir, "frame-%04d.png"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputVideoPath,
    ];

    const ffmpeg = spawn("ffmpeg", ffmpegArgs);

    ffmpeg.stderr.on("data", (data) => {
      // ffmpeg logs progress to stderr; you can parse this if you want progress
      console.log("[ffmpeg]", data.toString());
    });

    ffmpeg.on("error", (err) => {
      console.error("ffmpeg spawn error", err);
    });

    ffmpeg.on("close", (code) => {
      // Clean uploaded input image
      safeRm(req.file.path);

      if (code !== 0) {
        console.error("ffmpeg exited with code", code);
        safeRm(tmpBase);
        return res.status(500).json({ error: "ffmpeg failed" });
      }

      // Stream video file to client
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="highlight.mp4"'
      );

      const readStream = fs.createReadStream(outputVideoPath);

      readStream.on("close", () => {
        // Clean temps after response
        safeRm(tmpBase);
      });

      readStream.pipe(res);
    });
  } catch (err) {
    console.error("Render error:", err);
    safeRm(req.file.path);
    safeRm(tmpBase);
    res.status(500).json({ error: "Render error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`HighlightKaro backend listening on port ${PORT}`);
});

connectDB();

