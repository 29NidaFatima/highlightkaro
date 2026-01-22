const { PRICING_BY_REGION, PRICING_REGION, getPricingByRegion } = require("../config/pricingConfig");
const { detectPricingRegionFromRequest } = require("../utils/pricingRegion");
const geoip = require("geoip-lite");

/**
 * Get full pricing details including user's recommended region
 * @param {Object} req - Express request object
 * @returns {Object} Pricing response object
 */
exports.getPricingDetails = (req) => {
  const detectedRegion = detectPricingRegionFromRequest(req);
  
  // Get raw IP logic from detectPricingRegionFromRequest to get country code
  // We can't reuse detectPricingRegionFromRequest for country code because it returns region constant
  // So we'll duplicate the IP lookup logic or refactor utils/pricingRegion.js. 
  // Refactoring utils/pricingRegion.js is better but let's see if we can just use the service.
  // Actually detectPricingRegionFromRequest uses getClientIp and normalizeIp which are not exported.
  // I will refactor utils/pricingRegion.js to export getCountryFromRequest as well.
  
  // For now, I'll assume I can just implement the response construction.
  // Wait, I need 'country' in the response. 
  
  // Let's rely on detectPricingRegionFromRequest for the region logic.
  // And for country, I might need to duplicate the lookup or modify the util.
  
  // Construct the pricing object
  const pricing = {
    india: formatPlanData(PRICING_BY_REGION[PRICING_REGION.IN]),
    global: formatPlanData(PRICING_BY_REGION[PRICING_REGION.GLOBAL])
  };

  return {
    country: getCountryFromRequest(req),
    recommendedRegion: detectedRegion === PRICING_REGION.IN ? "india" : "global",
    pricing
  };
};

/**
 * Format plan data for frontend
 */
function formatPlanData(regionPricing) {
  return {
    currency: regionPricing.currency,
    currencySymbol: regionPricing.currencySymbol,
    cadenceLabel: regionPricing.cadenceLabel,
    basic: regionPricing.plans.basic30,
    pro: regionPricing.plans.pro99
  };
}

/**
 * Helper to get country code (duplicated from utils/pricingRegion.js for now to avoid breaking changes there yet)
 */
function getCountryFromRequest(req) {
  const getClientIp = (req) => {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.trim()) {
      return xff.split(",")[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || "";
  };

  const normalizeIp = (ip) => {
    if (!ip) return "";
    if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
    return ip;
  };

  const rawIp = getClientIp(req);
  const ip = normalizeIp(rawIp);
  const geo = ip ? geoip.lookup(ip) : null;
  return (geo?.country || "").toUpperCase();
}

/**
 * Get pricing for a specific region and plan
 */
exports.getPlanPricing = (plan, regionKey) => {
  // regionKey can be "india" or "global" from frontend, or PRICING_REGION constants
  let internalRegion = PRICING_REGION.GLOBAL;
  if (regionKey === "india" || regionKey === PRICING_REGION.IN) {
    internalRegion = PRICING_REGION.IN;
  }

  const regionPricing = getPricingByRegion(internalRegion);
  const planData = regionPricing.plans[plan];

  if (!planData) return null;

  return {
    amount: planData.monthly,
    currency: regionPricing.currency,
    region: internalRegion
  };
};
