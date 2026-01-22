const pricingService = require("../services/pricing.service");

/**
 * Get pricing for current visitor.
 * GET /api/pricing
 *
 * Frontend must render pricing from this API only.
 */
exports.getPricing = async (req, res) => {
  try {
    const response = pricingService.getPricingDetails(req);
    return res.json(response);
  } catch (err) {
    console.error("Pricing error:", err);
    return res.status(500).json({ error: "Failed to load pricing" });
  }
};
