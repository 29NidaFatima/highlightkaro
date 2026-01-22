import { API_BASE_URL } from "../config/api";

export async function fetchPricing() {
  const res = await fetch(`${API_BASE_URL}/api/pricing`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to load pricing");
  }
  return data;
}

