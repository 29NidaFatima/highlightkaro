const geoip = require("geoip-lite");
const { PRICING_REGION } = require("../config/pricingConfig");
 
function getClientIp(req) {
  // Prefer proxy headers when behind a reverse proxy
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    // x-forwarded-for can be a comma-separated list; first is original client
    return xff.split(",")[0].trim();
  }
 
  // express populates req.ip; may include ::ffff: prefix
  const ip = req.ip || req.connection?.remoteAddress || "";
  return ip;
}
 
function normalizeIp(ip) {
  if (!ip) return "";
  // Strip IPv6-mapped IPv4 prefix
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
  return ip;
}
 
function detectPricingRegionFromRequest(req) {
  const rawIp = getClientIp(req);
  const ip = normalizeIp(rawIp);
 
  const geo = ip ? geoip.lookup(ip) : null;
  const country = (geo?.country || "").toUpperCase();
 
  if (country === "IN") return PRICING_REGION.IN;
  return PRICING_REGION.GLOBAL;
}
 
module.exports = {
  detectPricingRegionFromRequest,
};
