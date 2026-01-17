/**
 * Export State Preservation Utility
 * Saves export data before login, resumes after login
 */

const EXPORT_STATE_KEY = "highlightkaro_pending_export";

/**
 * Save export state before redirecting to login
 */
export const saveExportState = (exportData) => {
  try {
    sessionStorage.setItem(EXPORT_STATE_KEY, JSON.stringify(exportData));
    return true;
  } catch (err) {
    console.error("Failed to save export state:", err);
    return false;
  }
};

/**
 * Get pending export state
 */
export const getExportState = () => {
  try {
    const state = sessionStorage.getItem(EXPORT_STATE_KEY);
    return state ? JSON.parse(state) : null;
  } catch (err) {
    console.error("Failed to get export state:", err);
    return null;
  }
};

/**
 * Clear export state (after successful export or user cancellation)
 */
export const clearExportState = () => {
  try {
    sessionStorage.removeItem(EXPORT_STATE_KEY);
    return true;
  } catch (err) {
    console.error("Failed to clear export state:", err);
    return false;
  }
};
