import { API_BASE_URL } from "../config/api";

export async function fetchPricing() {
  const url = `${API_BASE_URL}/api/pricing`;
  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        mode: "cors",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to load pricing (status ${res.status})`);
      }
      return data;
    } catch (err) {
      lastError = err;
      // Backoff for Render cold starts or transient network errors
      const delayMs = 500 * Math.pow(2, attempt); // 500ms, 1000ms, 2000ms
      await new Promise((r) => setTimeout(r, delayMs));
      attempt += 1;
    }
  }

  throw new Error(lastError?.message || "Failed to load pricing");
}

