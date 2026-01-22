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
const paymentRoutes = require("./routes/payment.routes");
const pricingRoutes = require("./routes/pricing.routes");
const {
  validateColor,
  validateAnimation,
  validateExportLimit,
  logExport,
  getPlanFeatures,
} = require("./utils/planFeatures");
const { getPlanConfig, getMaxResolution } = require("./config/planConfig");
const { getWatermarkImage, applyWatermark } = require("./utils/watermark");



const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server, curl, Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api", renderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/pricing", pricingRoutes);


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
  upload.single("image"),
  async (req, res) => {
    // Multer provides: req.file (image), req.body (fields)
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const userPlan = req.user.plan || "free";
    const planConfig = getPlanConfig(userPlan);

    // Validate export limit (for free plan: 2/day)
    const exportLimitCheck = await validateExportLimit(req.user._id, userPlan);
    if (!exportLimitCheck.allowed) {
      return res.status(403).json({
        error: `Export limit reached. ${exportLimitCheck.limit} exports per day allowed on ${planConfig.name} plan.`,
        limit: exportLimitCheck.limit,
        used: exportLimitCheck.used,
      });
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
      anim, // "left-to-right", "down-up", "rise", "glow", "underline"
    } = req.body;

    // Validate color
    if (!validateColor(userPlan, color)) {
      return res.status(403).json({
        error: `Color ${color} is not available on ${planConfig.name} plan`,
      });
    }

    // Map frontend animation names to backend codes
    const animMap = {
      "left-to-right": "ltr",
      "down-up": "du",
      "rise": "rise",
      "glow": "pulse",
      "underline": "underline",
    };
    const backendAnim = animMap[anim] || "ltr";

    // Validate animation
    if (!validateAnimation(userPlan, anim)) {
      return res.status(403).json({
        error: `Animation "${anim}" is not available on ${planConfig.name} plan`,
      });
    }

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
      // Load watermark image if needed (cached for performance)
      let watermarkImg = null;
      if (planConfig.watermark) {
        watermarkImg = await getWatermarkImage();
      }

      // Load image using node-canvas
      const img = await loadImage(req.file.path);
      let imgWidth = img.width;
      let imgHeight = img.height;

      // Enforce max resolution based on plan
      const maxResolution = getMaxResolution(userPlan);
      if (imgWidth > maxResolution || imgHeight > maxResolution) {
        // Scale down if exceeds limit
        const scale = Math.min(maxResolution / imgWidth, maxResolution / imgHeight);
        imgWidth = Math.floor(imgWidth * scale);
        imgHeight = Math.floor(imgHeight * scale);
      }

      // Force even dimensions (required for video codecs)
      const canvasWidth = imgWidth + (imgWidth % 2);
      const canvasHeight = imgHeight + (imgHeight % 2);

      // Render frames
      for (let i = 0; i < totalFrames; i++) {
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // Draw original image (scale if needed)
        if (imgWidth !== img.width || imgHeight !== img.height) {
          ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
        } else {
          ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
        }

      // Time progress 0 → 1
      const t = totalFrames === 1 ? 1 : i / (totalFrames - 1);

      // Compute animation-specific width/opacity
      let currentWidth = rectW;
      let currentOpacity = baseOpacity;

      // Animation logic (using backend anim code)
      if (backendAnim === "ltr") {
        // left-to-right: width grows over time
        currentWidth = rectW * t;
        currentOpacity = baseOpacity;
      } else if (backendAnim === "pulse" || backendAnim === "glow") {
        // pulse/glow: width constant, opacity oscillates
        const pulses = 4;
        const pulse = Math.sin(t * Math.PI * 2 * pulses) * 0.3 + 0.7;
        currentOpacity = baseOpacity * pulse;
      } else if (backendAnim === "du") {
        // down-up: height grows over time
        currentWidth = rectW;
        // Note: This would require height animation, simplified here
        currentOpacity = baseOpacity;
      } else {
        // Default: rise, underline, etc.
        currentWidth = rectW;
        currentOpacity = baseOpacity;
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

        // Apply image watermark for free plan (server-side only)
        if (planConfig.watermark && watermarkImg) {
          applyWatermark(ctx, canvasWidth, canvasHeight, watermarkImg);
        }

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

      readStream.on("close", async () => {
        // Clean temps after response
        safeRm(tmpBase);
        // Log export (only for free plan to track limits)
        if (planConfig.exportLimit !== null) {
          await logExport(req.user._id);
        }
      });

      readStream.pipe(res);
    });
    } catch (err) {
      console.error("Render error:", err);
      safeRm(req.file.path);
      if (typeof tmpBase !== "undefined") safeRm(tmpBase);
      res.status(500).json({ error: "Render error: " + err.message });
    }
  }
);

app.listen(PORT, () => {
  console.log(`HighlightKaro backend listening on port ${PORT}`);
});

connectDB();

