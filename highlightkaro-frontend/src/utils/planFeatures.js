/**
 * Frontend Plan Feature Utilities
 * Helper functions for checking plan features
 */

import { PLAN_CONFIG, getPlanConfig, isColorAllowed, isAnimationAllowed } from "../config/planConfig";

/**
 * Get plan configuration for current user
 */
export const getUserPlanConfig = (userPlan) => {
  return getPlanConfig(userPlan || "free");
};

/**
 * Check if color is allowed for plan
 */
export const canUseColor = (userPlan, color) => {
  return isColorAllowed(userPlan || "free", color);
};

/**
 * Check if animation is allowed for plan
 */
export const canUseAnimation = (userPlan, animation) => {
  return isAnimationAllowed(userPlan || "free", animation);
};

/**
 * Check if dark mode is allowed
 */
export const canUseDarkMode = (userPlan) => {
  const config = getUserPlanConfig(userPlan);
  return config.darkMode === true;
};

/**
 * Check if watermark is required
 */
export const hasWatermark = (userPlan) => {
  const config = getUserPlanConfig(userPlan);
  return config.watermark === true;
};

/**
 * Get available colors for plan
 */
export const getAvailableColors = (userPlan) => {
  const config = getUserPlanConfig(userPlan);
  return config.colors;
};

/**
 * Get available animations for plan
 */
export const getAvailableAnimations = (userPlan) => {
  const config = getUserPlanConfig(userPlan);
  return config.animations;
};
