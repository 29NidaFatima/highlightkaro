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
const { getHighlightFrame } = require("../utils/highlightAnimation");

// FFMPEG_PATH wins; otherwise use the binary bundled by ffmpeg-static, then the system one
const FFMPEG_BIN = (() => {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    return require("ffmpeg-static") || "ffmpeg";
  } catch {
    return "ffmpeg";
  }
})();

const MAX_HIGHLIGHTS = 20;
const MIN_DURATION = 0.5;
const MAX_DURATION = 15;
const ALLOWED_FPS = [24, 30, 60];

// Helper: remove temp directories/files
function safeRm(targetPath) {
  if (!targetPath) return;
  fs.rm(targetPath, { recursive: true, force: true }, () => { });
}

/**
 * Read highlights from the request.
 * New clients send `highlights` as a JSON array; older ones send a single
 * rectangle as x/y/w/h/color/opacity/anim fields.
 */
function parseHighlights(body) {
  let list;
  if (body.highlights) {
    try {
      list = JSON.parse(body.highlights);
    } catch {
      return null;
    }
    if (!Array.isArray(list)) return null;
  } else {
    list = [
      {
        x: body.x,
        y: body.y,
        width: body.w,
        height: body.h,
        color: body.color,
        opacity: body.opacity,
        animation: body.anim,
      },
    ];
  }

  return list.map((hl) => {
    // opacity may arrive as 0-1 or 0-100
    let opacity = parseFloat(hl.opacity);
    if (!Number.isFinite(opacity)) opacity = 0.5;
    if (opacity > 1) opacity = opacity / 100;

    return {
      x: parseFloat(hl.x),
      y: parseFloat(hl.y),
      width: parseFloat(hl.width),
      height: parseFloat(hl.height),
      color: hl.color || "#ffff00",
      opacity: Math.max(0, Math.min(1, opacity)),
      animation: hl.animation || "left-to-right",
    };
  });
}

exports.renderVideo = async (req, res) => {
  // Multer provides: req.file (image), req.body (fields)
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  const userPlan = req.user.plan || "free";
  const planConfig = getPlanConfig(userPlan);

  const fail = (status, error, extra = {}) => {
    safeRm(req.file.path);
    if (!res.headersSent) res.status(status).json({ error, ...extra });
  };

  // Validate export limit (for free plan: 2/day)
  const exportLimitCheck = await validateExportLimit(req.user._id, userPlan);
  if (!exportLimitCheck.allowed) {
    return fail(
      403,
      `Export limit reached. ${exportLimitCheck.limit} exports per day allowed on ${planConfig.name} plan.`,
      { limit: exportLimitCheck.limit, used: exportLimitCheck.used }
    );
  }

  const highlights = parseHighlights(req.body);
  if (!highlights || highlights.length === 0) {
    return fail(400, "At least one highlight is required");
  }
  if (highlights.length > MAX_HIGHLIGHTS) {
    return fail(400, `Up to ${MAX_HIGHLIGHTS} highlights per export`);
  }

  for (const hl of highlights) {
    if (![hl.x, hl.y, hl.width, hl.height].every(Number.isFinite) || hl.width <= 0 || hl.height <= 0) {
      return fail(400, "Invalid rectangle coordinates");
    }
    if (!validateColor(userPlan, hl.color)) {
      return fail(403, `Color ${hl.color} is not available on ${planConfig.name} plan`);
    }
    if (!validateAnimation(userPlan, hl.animation)) {
      return fail(403, `Animation "${hl.animation}" is not available on ${planConfig.name} plan`);
    }
  }

  const durationSec = Math.max(MIN_DURATION, Math.min(MAX_DURATION, parseFloat(req.body.duration) || 2));
  const requestedFps = parseInt(req.body.fps || "30", 10);
  const fpsNum = ALLOWED_FPS.includes(requestedFps) ? requestedFps : 30;
  const totalFrames = Math.max(1, Math.round(durationSec * fpsNum));

  let outputVideoPath = null;

  try {
    let watermarkImg = null;
    if (planConfig.watermark) {
      watermarkImg = await getWatermarkImage();
    }

    let img;
    try {
      img = await loadImage(req.file.path);
    } catch {
      return fail(400, "Unsupported or corrupted image");
    }

    let imgWidth = img.width;
    let imgHeight = img.height;

    // Downscale to the plan's max resolution; highlight coordinates are in
    // original-image pixels, so they are scaled by the same factor
    const maxResolution = getMaxResolution(userPlan);
    let scaleImg = 1;
    if (imgWidth > maxResolution || imgHeight > maxResolution) {
      scaleImg = Math.min(maxResolution / imgWidth, maxResolution / imgHeight);
      imgWidth = Math.floor(imgWidth * scaleImg);
      imgHeight = Math.floor(imgHeight * scaleImg);
    }

    const scaledHighlights = highlights.map((hl) => ({
      ...hl,
      x: hl.x * scaleImg,
      y: hl.y * scaleImg,
      width: hl.width * scaleImg,
      height: hl.height * scaleImg,
    }));

    // libx264 + yuv420p needs even dimensions
    const canvasWidth = imgWidth + (imgWidth % 2);
    const canvasHeight = imgHeight + (imgHeight % 2);

    const baseCanvas = createCanvas(canvasWidth, canvasHeight);
    const baseCtx = baseCanvas.getContext("2d");
    baseCtx.fillStyle = "#ffffff";
    baseCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    baseCtx.drawImage(img, 0, 0, imgWidth, imgHeight);

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    const outDir = path.join(os.tmpdir(), "highlightkaro_exports");
    fs.mkdirSync(outDir, { recursive: true });
    outputVideoPath = path.join(
      outDir,
      `export_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`
    );

    const ffmpegArgs = [
      "-y",
      "-f",
      "rawvideo",
      "-pix_fmt",
      // node-canvas "raw" buffers are native-endian ARGB32, i.e. BGRA bytes on x86/ARM
      os.endianness() === "LE" ? "bgra" : "argb",
      "-s",
      `${canvasWidth}x${canvasHeight}`,
      "-r",
      String(fpsNum),
      "-i",
      "pipe:0",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-movflags",
      "+faststart",
      outputVideoPath,
    ];

    const ffmpeg = spawn(FFMPEG_BIN, ffmpegArgs);

    let ffmpegDone = false;
    let ffmpegStderr = "";
    ffmpeg.stderr.on("data", (d) => {
      ffmpegStderr = (ffmpegStderr + d.toString()).slice(-2000);
    });

    ffmpeg.on("error", (err) => {
      ffmpegDone = true;
      console.error("FFmpeg spawn error:", err.message);
      safeRm(outputVideoPath);
      fail(500, err.code === "ENOENT" ? "Video encoder (ffmpeg) is not installed on the server" : "FFmpeg error: " + err.message);
    });

    ffmpeg.on("close", (code) => {
      ffmpegDone = true;
      if (code !== 0) {
        console.error("FFmpeg failed:", code, ffmpegStderr);
        safeRm(outputVideoPath);
        return fail(500, "FFmpeg failed");
      }
      if (res.headersSent) return;

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", 'attachment; filename="highlight.mp4"');
      const readStream = fs.createReadStream(outputVideoPath);
      readStream.on("error", (err) => {
        safeRm(outputVideoPath);
        fail(500, "File read error: " + err.message);
      });

      let finalized = false;
      const finalize = async () => {
        if (finalized) return;
        finalized = true;
        safeRm(req.file.path);
        safeRm(outputVideoPath);
      };
      // Count the export only once the file has been fully sent
      res.on("finish", async () => {
        if (planConfig.exportLimit !== null) {
          try {
            await logExport(req.user._id);
          } catch (err) {
            console.error("Failed to log export:", err.message);
          }
        }
        finalize();
      });
      res.on("close", finalize);
      readStream.pipe(res);
    });

    ffmpeg.stdin.on("error", (err) => {
      if (err && err.code === "EPIPE") {
        return;
      }
    });

    // Stop encoding if the client goes away
    req.on("close", () => {
      if (!ffmpegDone && !res.headersSent) ffmpeg.kill("SIGKILL");
    });

    for (let i = 0; i < totalFrames; i++) {
      if (ffmpegDone) break;

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(baseCanvas, 0, 0);

      const t = totalFrames === 1 ? 1 : i / (totalFrames - 1);

      ctx.globalCompositeOperation = "multiply";
      for (const hl of scaledHighlights) {
        const frame = getHighlightFrame(hl.animation, t, hl, hl.opacity);
        if (frame.width <= 0 || frame.height <= 0 || frame.opacity <= 0) continue;
        ctx.fillStyle = hl.color;
        ctx.globalAlpha = frame.opacity;
        ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // Watermark sits on top of the highlights so it can't be covered
      if (planConfig.watermark && watermarkImg) {
        applyWatermark(ctx, canvasWidth, canvasHeight, watermarkImg);
      }

      const buffer = canvas.toBuffer("raw");
      const ok = ffmpeg.stdin.write(buffer);
      if (!ok && !ffmpegDone) {
        await new Promise((r) => {
          ffmpeg.stdin.once("drain", r);
          ffmpeg.once("close", r);
        });
      }
    }

    if (!ffmpegDone) ffmpeg.stdin.end();

    // Cleanup will be handled in ffmpeg 'close' -> streaming finalize
  } catch (err) {
    console.error("Render error:", err);
    safeRm(outputVideoPath);
    fail(500, "Render error: " + err.message);
  }
};
