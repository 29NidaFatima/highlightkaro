/**
 * Backend-driven pricing configuration (single source of truth).
 *
 * NOTE:
 * - All amounts are in MAJOR currency units here (e.g. 30 INR, 5 USD).
 * - Razorpay expects the MINOR unit amount (paise/cents), so we convert at runtime.
 */
 
const PRICING_REGION = {
  IN: "IN",
  GLOBAL: "GLOBAL",
};
 
const PRICING_BY_REGION = {
  [PRICING_REGION.IN]: {
    region: PRICING_REGION.IN,
    currency: "INR",
    currencySymbol: "₹",
    cadenceLabel: "/ month",
    plans: {
      free: { monthly: 0 },
      basic30: { monthly: 30, perDayLabel: "₹1 per day" },
      pro99: { monthly: 99, perDayLabel: "₹3 per day" },
    },
  },
  [PRICING_REGION.GLOBAL]: {
    region: PRICING_REGION.GLOBAL,
    currency: "USD",
    currencySymbol: "$",
    cadenceLabel: "/ month",
    plans: {
      free: { monthly: 0 },
      basic30: { monthly: 5 },
      pro99: { monthly: 7 },
    },
  },
};
 
function getPricingByRegion(region) {
  return PRICING_BY_REGION[region] || PRICING_BY_REGION[PRICING_REGION.GLOBAL];
}
 
function toMinorUnits(amountMajor) {
  // INR and USD are 2-decimal currencies (paise/cents).
  return Math.round(Number(amountMajor) * 100);
}
 
module.exports = {
  PRICING_REGION,
  PRICING_BY_REGION,
  getPricingByRegion,
  toMinorUnits,
};
