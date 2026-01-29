const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const { createCanvas, loadImage } = require("canvas");
const {
  validateColor,
  validateAnimation,
  validateExportLimit,
  logExport,
} = require("../utils/planFeatures");
const { getPlanConfig, getMaxResolution } = require("../config/planConfig");
const { getWatermarkImage, applyWatermark } = require("../utils/watermark");

// Helper: remove temp directories/files
function safeRm(targetPath) {
  if (!targetPath) return;
  fs.rm(targetPath, { recursive: true, force: true }, () => { });
}

exports.renderVideo = async (req, res) => {
  // Multer provides: req.file (image), req.body (fields)
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  const userPlan = req.user.plan || "free";
  const planConfig = getPlanConfig(userPlan);

  // Validate export limit (for free plan: 2/day)
  const exportLimitCheck = await validateExportLimit(req.user._id, userPlan);
  if (!exportLimitCheck.allowed) {
    safeRm(req.file.path); 
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
    anim, 
  } = req.body;

  // Validate color
  if (!validateColor(userPlan, color)) {
    safeRm(req.file.path);
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
    safeRm(req.file.path);
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
    safeRm(req.file.path);
    return res.status(400).json({ error: "Invalid rectangle coordinates" });
  }

  const totalFrames = Math.max(1, Math.round(durationSec * fpsNum));

  try {
    let watermarkImg = null;
    if (planConfig.watermark) {
      watermarkImg = await getWatermarkImage();
    }

    const img = await loadImage(req.file.path);
    let imgWidth = img.width;
    let imgHeight = img.height;

    const maxResolution = getMaxResolution(userPlan);
    if (imgWidth > maxResolution || imgHeight > maxResolution) {
      const scaleImg = Math.min(maxResolution / imgWidth, maxResolution / imgHeight);
      imgWidth = Math.floor(imgWidth * scaleImg);
      imgHeight = Math.floor(imgHeight * scaleImg);
    }

    const canvasWidth = imgWidth + (imgWidth % 2);
    const canvasHeight = imgHeight + (imgHeight % 2);

    const baseCanvas = createCanvas(canvasWidth, canvasHeight);
    const baseCtx = baseCanvas.getContext("2d");
    baseCtx.drawImage(img, 0, 0, imgWidth, imgHeight);
    if (planConfig.watermark && watermarkImg) {
      applyWatermark(baseCtx, canvasWidth, canvasHeight, watermarkImg);
    }

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    const ffmpegArgs = [
      "-y",
      "-f",
      "image2pipe",
      "-vcodec",
      "png",
      "-r",
      String(fpsNum),
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-movflags",
      "+faststart",
      "-f",
      "mp4",
      "-"
    ];

    const ffmpeg = spawn("ffmpeg", ffmpegArgs);

    ffmpeg.stderr.on("data", (data) => {
      console.log("[ffmpeg]", data.toString());
    });

    ffmpeg.on("error", (err) => {
      console.error("ffmpeg spawn error", err);
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", 'attachment; filename="highlight.mp4"');
    ffmpeg.stdout.pipe(res);

    for (let i = 0; i < totalFrames; i++) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(baseCanvas, 0, 0);

      const t = totalFrames === 1 ? 1 : i / (totalFrames - 1);

      let currentWidth = rectW;
      let currentOpacity = baseOpacity;

      if (backendAnim === "ltr") {
        currentWidth = rectW * t;
      } else if (backendAnim === "pulse" || backendAnim === "glow") {
        const pulses = 4;
        const pulse = Math.sin(t * Math.PI * 2 * pulses) * 0.3 + 0.7;
        currentOpacity = baseOpacity * pulse;
      } else if (backendAnim === "du") {
        currentWidth = rectW;
      } else {
        currentWidth = rectW;
      }

      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = color || "#ffff00";
      ctx.globalAlpha = currentOpacity;
      const drawWidth = Math.max(1, currentWidth);
      ctx.fillRect(rectX, rectY, drawWidth, rectH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      const buffer = canvas.toBuffer("image/png");
      ffmpeg.stdin.write(buffer);
    }

    ffmpeg.stdin.end();

    ffmpeg.stdout.on("close", async () => {
      safeRm(req.file.path);
      if (planConfig.exportLimit !== null) {
        await logExport(req.user._id);
      }
    });
  } catch (err) {
    console.error("Render error:", err);
    safeRm(req.file.path);
    res.status(500).json({ error: "Render error: " + err.message });
  }
};
