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


const PLAN_CONFIG = {
  free: {
    name: "Free",
    colors: ["#ffff00"], 
    animations: ["left-to-right"], 
    exportQuality: "720p", 
    watermark: true,
    darkMode: false, 
    exportLimit: 2, 
    exportLimitPeriod: "day", 
    cloudSave: false,
  },

  basic30: {
    name: "Basic",
    colors: ["#ffff00", "#ff0000"], 
    animations: ["left-to-right", "down-up", "rise", "glow"], 
    exportQuality: "1080p", 
    watermark: false,
    darkMode: true, 
    exportLimit: null, 
    exportLimitPeriod: null,
    cloudSave: false, 
  },

  pro99: {
    name: "Pro",
    colors: ALL_COLORS,
    animations: ALL_ANIMATIONS, 
    exportQuality: "1080p", 
    watermark: false,
    darkMode: true, 
    exportLimit: null, 
    exportLimitPeriod: null,
    cloudSave: true, 
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
