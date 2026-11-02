/**
 * Centralized API Configuration
 * Single source of truth for API base URL
 */

// VITE_API_URL is the documented name; VITE_API_BASE_URL is accepted for older .env files
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://highlightkaro-1.onrender.com"
).replace(/\/+$/, "");
