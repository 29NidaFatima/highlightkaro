/**
 * Centralized API Configuration
 * Single source of truth for API base URL
 */

const DEFAULT_API_URL = "https://highlightkaro-2.onrender.com";

const isLocalUrl = (url) => /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);
const runningLocally =
  typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

// VITE_API_URL is the documented name; VITE_API_BASE_URL is accepted for older .env files
const configured = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

// A localhost API only makes sense when the site itself runs locally; a deployed
// build that picked up a local .env would otherwise call the visitor's own machine
export const API_BASE_URL = (
  configured && (runningLocally || !isLocalUrl(configured)) ? configured : DEFAULT_API_URL
).replace(/\/+$/, "");
