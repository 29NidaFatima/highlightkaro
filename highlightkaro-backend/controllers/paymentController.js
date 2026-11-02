const razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Payment = require("../models/Payment");
const { toMinorUnits } = require("../config/pricingConfig");
const { PLAN_DURATION_DAYS, PLAN_ORDER } = require("../config/planConfig");
const pricingService = require("../services/pricing.service");

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set; payments will fail");
}

// Initialize Razorpay
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "missing",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "missing",
});

const PLAN_NAME = {
  basic30: "Basic Plan",
  pro99: "Pro Plan",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "https://highlightkaro-online.onrender.com")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");

// Constant-time compare of two hex signatures
const safeEqualHex = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

/**
 * Verify the signature Razorpay appends to the Payment Link callback URL.
 * signature = HMAC_SHA256(link_id|reference_id|status|payment_id, key_secret)
 */
const verifyCallbackSignature = (query) => {
  const {
    razorpay_payment_id: paymentId,
    razorpay_payment_link_id: linkId,
    razorpay_payment_link_reference_id: referenceId = "",
    razorpay_payment_link_status: status,
    razorpay_signature: signature,
  } = query || {};

  if (!paymentId || !linkId || !status || !signature) return false;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${linkId}|${referenceId}|${status}|${paymentId}`)
    .digest("hex");

  return safeEqualHex(expected, signature);
};

/**
 * Mark a payment as paid and give the user the plan for PLAN_DURATION_DAYS.
 * Buying the plan you already have extends it from its current expiry.
 * Safe to call more than once for the same payment.
 */
const activatePlan = async (payment, razorpayPaymentId) => {
  // Atomically claim the payment so webhook + confirm can't both apply it
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: "paid" } },
    {
      status: "paid",
      processedAt: new Date(),
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
    },
    { new: true }
  );

  const user = await User.findById(payment.userId);
  if (!user) return null;

  if (!claimed) {
    // Already applied earlier
    return user;
  }

  const now = Date.now();
  const sameActivePlan =
    user.plan === payment.plan && user.planExpiresAt && user.planExpiresAt.getTime() > now;
  const base = sameActivePlan ? user.planExpiresAt.getTime() : now;

  user.plan = payment.plan;
  user.planExpiresAt = new Date(base + PLAN_DURATION_DAYS * DAY_MS);
  await user.save();

  console.log("[Payment] Plan activated:", user._id.toString(), "->", user.plan, "until", user.planExpiresAt.toISOString());
  return user;
};

/**
 * Create Razorpay Payment Link for plan upgrade
 * POST /api/payment/create-link
 */
exports.createPaymentLink = async (req, res) => {
  try {
    const { plan, region } = req.body;
    const userId = req.user._id;

    // Validate plan
    if (!plan || !PLAN_NAME[plan]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Allow upgrading to a higher plan, or renewing the current one
    const currentPlan = req.user.plan;
    if (PLAN_ORDER.indexOf(plan) < PLAN_ORDER.indexOf(currentPlan)) {
      return res.status(400).json({
        error: "You can only upgrade to a higher plan",
      });
    }

    const planPricing = pricingService.getPlanPricing(plan, region);

    if (!planPricing || typeof planPricing.amount !== "number") {
      return res.status(500).json({ error: "Pricing is not available for this plan" });
    }

    const amountMinor = toMinorUnits(planPricing.amount);

    const backendUrl = process.env.BACKEND_URL && process.env.BACKEND_URL.trim();
    const frontendUrl = getFrontendUrl();

    const paymentLinkOptions = {
      amount: amountMinor,
      currency: planPricing.currency,
      description: `Upgrade to ${PLAN_NAME[plan]}`,
      customer: {
        name: req.user.name,
        email: req.user.email,
      },
      notify: {
        email: true,
      },
      reminder_enable: true,
      // Link is useless once the user has walked away; expire it after 1 hour
      expire_by: Math.floor(Date.now() / 1000) + 60 * 60,
      notes: {
        userId: userId.toString(),
        plan,
      },
      // Prefer server callback that will redirect user to the correct frontend URL
      callback_url: backendUrl
        ? `${backendUrl.replace(/\/+$/, "")}/api/payment/callback`
        : `${frontendUrl}/payment-success`,
      callback_method: "get",
    };

    const paymentLink = await razorpayInstance.paymentLink.create(
      paymentLinkOptions
    );

    // Store payment record
    await Payment.create({
      userId,
      plan,
      amount: amountMinor,
      currency: planPricing.currency,
      razorpayPaymentLinkId: paymentLink.id,
      status: "pending",
    });

    res.json({
      paymentLinkId: paymentLink.id,
      paymentLinkUrl: paymentLink.short_url,
      amount: amountMinor,
      currency: planPricing.currency,
      region: planPricing.region,
      plan: plan,
    });
  } catch (err) {
    console.error("Payment link creation error:", err?.error || err);
    res.status(500).json({ error: "Failed to create payment link" });
  }
};

/**
 * Verify Razorpay Webhook
 * POST /api/payment/webhook
 */
exports.verifyWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSignature || !webhookSecret) {
      return res.status(400).json({ error: "Missing webhook signature" });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");

    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!safeEqualHex(generatedSignature, webhookSignature)) {
      console.log("[Webhook] Signature mismatch");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;
    const linkEntity = payload.payload?.payment_link?.entity;
    const paymentEntity = payload.payload?.payment?.entity;

    console.log("[Webhook] Event:", event);

    if (event === "payment_link.paid") {
      const paymentLinkId = linkEntity?.id;
      // Razorpay sends the payment under payload.payment; older code read payment_link.payments
      const paymentId = paymentEntity?.id || linkEntity?.payments?.[0]?.id;

      if (!paymentLinkId || !paymentId) {
        return res.status(400).json({ error: "Invalid payment data" });
      }

      const payment = await Payment.findOne({ razorpayPaymentLinkId: paymentLinkId });

      if (!payment) {
        // Not ours (e.g. a link created by another environment); ack so Razorpay stops retrying
        console.log("[Webhook] No payment record for", paymentLinkId);
        return res.status(200).json({ message: "Ignored" });
      }

      if (payment.status === "paid") {
        return res.status(200).json({ message: "Payment already processed" });
      }

      // Confirm with Razorpay rather than trusting the payload alone
      let razorpayPayment;
      try {
        razorpayPayment = await razorpayInstance.payments.fetch(paymentId);
      } catch (razorpayErr) {
        console.error("[Webhook] Razorpay API error:", razorpayErr?.error || razorpayErr);
        if (razorpayErr?.statusCode === 400 || razorpayErr?.statusCode === 404) {
          return res.status(400).json({ error: "Payment verification failed" });
        }
        // Transient error: 5xx makes Razorpay retry later
        return res.status(500).json({ error: "Payment verification failed" });
      }

      if (
        razorpayPayment.status !== "captured" ||
        razorpayPayment.amount !== payment.amount
      ) {
        console.log("[Webhook] Verification failed:", razorpayPayment.status, razorpayPayment.amount, payment.amount);
        return res.status(400).json({ error: "Payment verification failed" });
      }

      await activatePlan(payment, paymentId);
      return res.status(200).json({ message: "Payment verified successfully" });
    }

    if (event === "payment_link.cancelled" || event === "payment_link.expired") {
      const paymentLinkId = linkEntity?.id;
      if (paymentLinkId) {
        await Payment.findOneAndUpdate(
          { razorpayPaymentLinkId: paymentLinkId, status: "pending" },
          { status: event.includes("expired") ? "expired" : "failed" }
        );
      }
    }

    res.status(200).json({ message: "Webhook received" });
  } catch (err) {
    console.error("Webhook verification error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

/**
 * Confirm payment on user return (callback fallback)
 * GET /api/payment/confirm?razorpay_payment_link_id=plink_xxx
 * Requires auth; verifies link status with Razorpay and activates plan.
 */
exports.confirmPayment = async (req, res) => {
  try {
    const linkId =
      req.query.razorpay_payment_link_id ||
      req.query.payment_link_id ||
      req.query.plink ||
      "";

    if (!linkId) {
      return res.status(400).json({ error: "Missing payment link id" });
    }

    const payment = await Payment.findOne({
      razorpayPaymentLinkId: linkId,
      userId: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    if (payment.status === "paid") {
      const user = await User.findById(payment.userId);
      return res.json({ ok: true, status: "paid", user: user?.toPublic() });
    }

    // Razorpay is the source of truth for the link status
    const link = await razorpayInstance.paymentLink.fetch(linkId);
    if (!link) {
      return res.status(400).json({ error: "Unable to verify payment link" });
    }

    if (link.status !== "paid") {
      if (link.status === "cancelled" || link.status === "expired") {
        payment.status = link.status === "expired" ? "expired" : "failed";
        await payment.save();
      }
      return res.status(402).json({ ok: false, status: link.status, error: "Payment not completed" });
    }

    if (typeof link.amount === "number" && link.amount !== payment.amount) {
      return res.status(400).json({ error: "Amount mismatch" });
    }

    const rpPaymentId =
      link?.payments?.[0]?.payment_id || link?.payments?.[0]?.id || req.query.razorpay_payment_id || null;

    const user = await activatePlan(payment, rpPaymentId);
    return res.json({ ok: true, status: "paid", user: user?.toPublic() });
  } catch (err) {
    console.error("Confirm payment error:", err?.error || err);
    return res.status(500).json({ error: "Payment confirmation failed" });
  }
};

/**
 * Public GET callback endpoint used by Razorpay Payment Links.
 * Sends the customer to /payment-success or /payment-failed, preserving the query string.
 * No auth required; the plan is only activated by the webhook or /confirm.
 */
exports.publicCallbackRedirect = async (req, res) => {
  try {
    const frontendUrl = getFrontendUrl();
    const usp = new URLSearchParams(req.query || {});
    const status = req.query.razorpay_payment_link_status;
    const isPaid = status === "paid" && verifyCallbackSignature(req.query);
    const target = isPaid ? "payment-success" : "payment-failed";
    const redirectUrl = `${frontendUrl}/${target}${usp.toString() ? `?${usp.toString()}` : ""}`;
    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error("Callback redirect error:", err);
    return res.status(500).send("Callback error");
  }
};

/**
 * Payment history for the logged-in user
 * GET /api/payment/history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id, status: "paid" })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("plan amount currency status processedAt createdAt -_id")
      .lean();
    return res.json({ payments });
  } catch (err) {
    console.error("Payment history error:", err);
    return res.status(500).json({ error: "Failed to load payment history" });
  }
};

exports._internal = { verifyCallbackSignature, activatePlan };
