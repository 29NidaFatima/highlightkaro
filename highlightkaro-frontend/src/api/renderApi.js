import { API_BASE_URL } from "../config/api";

export const renderVideo = async (token, formData) => {
  if (!token) {
    throw new Error("Authentication token is missing. Please login again.");
  }

  const res = await fetch(`${API_BASE_URL}/api/render`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
    
    throw new Error(errorMsg);
  }

  return res.blob();
};
