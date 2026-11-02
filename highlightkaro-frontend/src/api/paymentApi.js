import { apiFetch } from "./client";

export const createPaymentLink = async (plan, region, token) => {
  if (!token) {
    throw new Error("Authentication token is missing. Please login again.");
  }

  const res = await apiFetch("/api/payment/create-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, region }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) throw new Error("Your session has expired. Please login again.");
    throw new Error(data.error || "Payment initiation failed");
  }

  return data; // { paymentLinkUrl, plan, amount }
};

/**
 * Ask the backend to verify a returning Razorpay payment.
 * Resolves to { ok, status, user } — status is "paid" once the plan is active.
 */
export const confirmPaymentFromCallback = async (params, token) => {
  if (!token) {
    throw new Error("Authentication token is missing. Please login again.");
  }
  const linkId =
    params.get("razorpay_payment_link_id") ||
    params.get("payment_link_id") ||
    params.get("plink");
  if (!linkId) {
    throw new Error("Missing payment reference");
  }

  const qs = new URLSearchParams({ razorpay_payment_link_id: linkId });
  const paymentId = params.get("razorpay_payment_id");
  if (paymentId) qs.set("razorpay_payment_id", paymentId);

  const res = await apiFetch(`/api/payment/confirm?${qs}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 402) {
    // Not paid (yet)
    return { ok: false, status: data.status || "pending" };
  }
  if (!res.ok) {
    throw new Error(data.error || "Payment confirmation failed");
  }
  return data;
};

export const fetchPaymentHistory = async () => {
  const res = await apiFetch("/api/payment/history", { headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load payment history");
  return data.payments || [];
};
