/**
 * Watermark Utility
 * Loads and applies image watermark for Free plan exports
 */

const { loadImage } = require("canvas");
const path = require("path");

/**
 * Load watermark image from assets/watermark.png
 * Returns loaded image object
 */
const createWatermarkImage = async () => {
  // Load watermark PNG image from assets folder
  const watermarkPath = path.join(__dirname, "../assets/watermark.png");
  const watermarkImg = await loadImage(watermarkPath);
  return watermarkImg;
};

/**
 * Apply watermark to frame canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context to draw on
 * @param {number} canvasWidth - Full canvas width
 * @param {number} canvasHeight - Full canvas height
 * @param {Image|Canvas} watermarkImg - Watermark image/canvas to apply
 */
const applyWatermark = (ctx, canvasWidth, canvasHeight, watermarkImg) => {
  // Watermark sizing: scale relative to output resolution
  // Base size: 200x50 at 1080p, scales proportionally
  const baseResolution = 1080;
  const baseWatermarkWidth = 200;
  const baseWatermarkHeight = 50;
  
  // Scale based on canvas height (matches output resolution)
  const scale = Math.min(canvasHeight / baseResolution, 1);
  const watermarkWidth = Math.round(baseWatermarkWidth * scale);
  const watermarkHeight = Math.round(baseWatermarkHeight * scale);

  // Position: bottom-right with padding
  const paddingX = Math.round(20 * scale); // 20px padding at 1080p
  const paddingY = Math.round(20 * scale);
  const x = canvasWidth - watermarkWidth - paddingX;
  const y = canvasHeight - watermarkHeight - paddingY;

  // Apply watermark with controlled opacity
  ctx.save();
  ctx.globalAlpha = 0.6; // 60% opacity (not intrusive, but visible)
  
  // Draw watermark
  ctx.drawImage(watermarkImg, x, y, watermarkWidth, watermarkHeight);
  
  ctx.restore();
};

/**
 * Load watermark image (cached for performance)
 */
let watermarkCache = null;

const getWatermarkImage = async () => {
  if (!watermarkCache) {
    watermarkCache = await createWatermarkImage();
  }
  return watermarkCache;
};

module.exports = {
  getWatermarkImage,
  applyWatermark,
  createWatermarkImage,
};
