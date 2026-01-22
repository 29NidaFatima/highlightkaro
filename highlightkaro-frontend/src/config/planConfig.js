/**
 * Centralized Plan Configuration (Frontend)
 * Matches backend config/planConfig.js
 */

// All available colors
export const ALL_COLORS = ["#ffff00", "#ff0000", "#00ffff", "#00ff00", "#0000ff", "#ff00ff"];

// All available animations
export const ALL_ANIMATIONS = [
  "left-to-right",
  "down-up",
  "rise",
  "glow",
  "underline",
];

export const PLAN_CONFIG = {
  free: {
    name: "Free",
    colors: ["#ffff00"], // Yellow only
    animations: ["left-to-right"], // Left → Right only
    exportQuality: "720p", // 720p max
    watermark: true, // Watermark ON
    darkMode: false, // Light mode only
    exportLimit: 2, // 2 exports per day
    exportLimitPeriod: "day",
    cloudSave: false,
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
    cloudSave: false,
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
export const getPlanConfig = (plan) => {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.free;
};

/**
 * Check if color is allowed for plan
 */
export const isColorAllowed = (plan, color) => {
  const config = getPlanConfig(plan);
  return config.colors.includes(color);
};

/**
 * Check if animation is allowed for plan
 */
export const isAnimationAllowed = (plan, animation) => {
  const config = getPlanConfig(plan);
  return config.animations.includes(animation);
};
