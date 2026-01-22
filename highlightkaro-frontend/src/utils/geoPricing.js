/**
 * Lightweight geo detection (frontend-only) for pricing display.
 * - Caches country in localStorage to avoid repeated network calls.
 * - Has a safe fallback to GLOBAL.
 */

const CACHE_KEY = "hk_country_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.country || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.country;
  } catch {
    return null;
  }
}

function writeCache(country) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ country, ts: Date.now() }));
  } catch {
    // ignore
  }
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Returns "IN" or "GLOBAL".
 */
export async function detectPricingRegion() {
  const cached = readCache();
  if (cached) return cached === "IN" ? "IN" : "GLOBAL";

  // Try a free, no-key endpoint. If it fails, fall back safely.
  try {
    const res = await fetchWithTimeout("https://ipapi.co/json/", 1500);
    if (!res.ok) throw new Error("geo_failed");
    const data = await res.json();
    const country = (data?.country_code || "").toUpperCase();
    const region = country === "IN" ? "IN" : "GLOBAL";
    writeCache(region);
    return region;
  } catch {
    writeCache("GLOBAL");
    return "GLOBAL";
  }
}

