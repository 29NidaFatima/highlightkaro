import { API_BASE_URL } from "../config/api";

export const createPaymentLink = async (plan, region, token) => {
  if (!token) {
    throw new Error("Authentication token is missing. Please login again.");
  }

  const res = await fetch(`${API_BASE_URL}/api/payment/create-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan, region }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Payment initiation failed");
  }

  return data; // { paymentLinkUrl, plan, amount }
};

