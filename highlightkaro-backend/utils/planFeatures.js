const { getPlanConfig, isColorAllowed, isAnimationAllowed, checkExportLimit } = require("../config/planConfig");
const ExportLog = require("../models/ExportLog");

/**
 * Check if user's plan allows a specific color
 */
const validateColor = (userPlan, color) => {
  return isColorAllowed(userPlan, color);
};

/**
 * Check if user's plan allows a specific animation
 */
const validateAnimation = (userPlan, animation) => {
  return isAnimationAllowed(userPlan, animation);
};

/**
 * Check export limit for user
 * Returns { allowed: boolean, remaining: number | null, limit: number | null }
 */
const validateExportLimit = async (userId, userPlan) => {
  const config = getPlanConfig(userPlan);
  
  // Unlimited plans
  if (config.exportLimit === null) {
    return { allowed: true, remaining: null, limit: null };
  }

  // Get today's exports
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayExports = await ExportLog.countDocuments({
    userId,
    exportedAt: {
      $gte: todayStart,
      $lte: todayEnd,
    },
  });

  const result = checkExportLimit(userPlan, todayExports);
  return {
    ...result,
    limit: config.exportLimit,
    used: todayExports,
  };
};

/**
 * Log an export (call after successful export)
 */
const logExport = async (userId) => {
  await ExportLog.create({
    userId,
    exportedAt: new Date(),
  });
};

/**
 * Get plan feature summary for API responses
 */
const getPlanFeatures = (userPlan) => {
  const config = getPlanConfig(userPlan);
  return {
    plan: userPlan,
    name: config.name,
    colors: config.colors,
    animations: config.animations,
    exportQuality: config.exportQuality,
    watermark: config.watermark,
    darkMode: config.darkMode,
    exportLimit: config.exportLimit,
    cloudSave: config.cloudSave,
  };
};

module.exports = {
  validateColor,
  validateAnimation,
  validateExportLimit,
  logExport,
  getPlanFeatures,
};
