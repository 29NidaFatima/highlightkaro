import { apiFetch } from "./client";

export const renderVideo = async (token, formData) => {
  if (!token) {
    throw new Error("Authentication token is missing. Please login again.");
  }

  const res = await apiFetch("/api/render", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.error || "Export failed";

    // Handle export limit error specifically
    if (res.status === 403 && errorData.limit) {
      throw new Error(
        `Daily export limit reached (${errorData.limit} exports). Upgrade to Basic plan for unlimited exports.`
      );
    }
    if (res.status === 401) {
      throw new Error("Your session has expired. Please login again.");
    }

    throw new Error(errorMsg);
  }

  return res.blob();
};
