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

export const confirmPaymentFromCallback = async (params, token) => {
  if (!token) {
    throw new Error("Authentication token is missing. Please login again.");
  }
  const url = new URL(`${API_BASE_URL}/api/payment/confirm`);
  // Pass-through known params from Razorpay callback
  const linkId =
    params.get("razorpay_payment_link_id") ||
    params.get("payment_link_id") ||
    params.get("plink");
  if (linkId) url.searchParams.set("razorpay_payment_link_id", linkId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Payment confirmation failed");
  }
  return data;
};

