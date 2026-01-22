/**
 * Centralized Plan Configuration
 * Single source of truth for all plan features and limits
 */

// All available colors
const ALL_COLORS = ["#ffff00", "#ff0000", "#00ffff", "#00ff00", "#0000ff", "#ff00ff"];

// All available animations
const ALL_ANIMATIONS = [
  "left-to-right",
  "down-up",
  "rise",
  "glow",
  "underline",
];

// Plan configuration
const PLAN_CONFIG = {
  free: {
    name: "Free",
    colors: ["#ffff00"], // Yellow only
    animations: ["left-to-right"], // Left → Right only
    exportQuality: "720p", // 720p max
    watermark: true, // Watermark ON
    darkMode: false, // Light mode only
    exportLimit: 2, // 2 exports per day
    exportLimitPeriod: "day", // Reset daily
    cloudSave: false, // Not available
  },

  basic30: {
    name: "Basic",
    colors: ["#ffff00", "#ff0000"], // Yellow + Red
    animations: ["left-to-right", "down-up", "rise", "glow"], // L→R, Down→Up, Rise, Glow Swipe
    exportQuality: "1080p", // 1080p
    watermark: false, // Watermark OFF
    darkMode: true, // Dark mode allowed
    exportLimit: null, // Unlimited (null = unlimited)
    exportLimitPeriod: null,
    cloudSave: false, // Not available
  },

  pro99: {
    name: "Pro",
    colors: ALL_COLORS, // All colors unlocked
    animations: ALL_ANIMATIONS, // All animations unlocked (including underline)
    exportQuality: "1080p", // 1080p
    watermark: false, // Watermark OFF
    darkMode: true, // Dark mode allowed
    exportLimit: null, // Unlimited
    exportLimitPeriod: null,
    cloudSave: true, // Future feature (design only)
  },
};

/**
 * Get plan configuration
 */
const getPlanConfig = (plan) => {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.free;
};

/**
 * Check if color is allowed for plan
 */
const isColorAllowed = (plan, color) => {
  const config = getPlanConfig(plan);
  return config.colors.includes(color);
};

/**
 * Check if animation is allowed for plan
 */
const isAnimationAllowed = (plan, animation) => {
  const config = getPlanConfig(plan);
  return config.animations.includes(animation);
};

/**
 * Check if export limit is exceeded
 * Returns { allowed: boolean, remaining: number | null }
 */
const checkExportLimit = (plan, currentCount) => {
  const config = getPlanConfig(plan);
  if (config.exportLimit === null) {
    return { allowed: true, remaining: null }; // Unlimited
  }
  const remaining = Math.max(0, config.exportLimit - currentCount);
  return {
    allowed: remaining > 0,
    remaining,
  };
};

/**
 * Get max resolution for plan
 */
const getMaxResolution = (plan) => {
  const config = getPlanConfig(plan);
  return config.exportQuality === "1080p" ? 1080 : 720;
};

module.exports = {
  PLAN_CONFIG,
  getPlanConfig,
  isColorAllowed,
  isAnimationAllowed,
  checkExportLimit,
  getMaxResolution,
  ALL_COLORS,
  ALL_ANIMATIONS,
};
