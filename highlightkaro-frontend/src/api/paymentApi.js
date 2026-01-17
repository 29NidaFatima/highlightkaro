export const createPaymentLink = async (plan, token) => {
  const res = await fetch("http://localhost:5000/api/payment/create-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Payment initiation failed");
  }

  return data; // { paymentLinkUrl, plan, amount }
};

