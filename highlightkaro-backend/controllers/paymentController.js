const razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Payment = require("../models/Payment");
const { toMinorUnits } = require("../config/pricingConfig");
const pricingService = require("../services/pricing.service");

// Initialize Razorpay
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const PLAN_NAME = {
  basic30: "Basic Plan",
  pro99: "Pro Plan",
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

 
    const currentPlan = req.user.plan;
    const planOrder = ["free", "basic30", "pro99"];
    if (planOrder.indexOf(currentPlan) >= planOrder.indexOf(plan)) {
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
    const frontendUrl = process.env.FRONTEND_URL || "https://highlightkaro-1.onrender.com";

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
      // Prefer server callback that will redirect user to the correct frontend success URL
      callback_url: backendUrl
        ? `${backendUrl.replace(/\/+$/, "")}/api/payment/callback`
        : `${frontendUrl.replace(/\/+$/, "")}/payment-success`,
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
    console.error("Payment link creation error:", err);
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

    const rawBody = req.body;

    console.log("[Webhook] Received webhook");
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (generatedSignature !== webhookSignature) {
      console.log("[Webhook] Signature mismatch");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;
    const paymentEntity = payload.payload?.payment_link?.entity;

    console.log("[Webhook] Event:", event);

    if (event === "payment_link.paid") {
      const paymentLinkId = paymentEntity.id;
      const paymentId = paymentEntity.payments?.[0]?.id;

      if (!paymentLinkId || !paymentId) {
        return res.status(400).json({ error: "Invalid payment data" });
      }

      console.log("[Webhook] payment_link_id:", paymentLinkId, "payment_id:", paymentId);
      const payment = await Payment.findOne({
        razorpayPaymentLinkId: paymentLinkId,
        status: "pending",
      });

      if (!payment) {
        console.log("Payment record not found or already processed");
        return res.status(200).json({ message: "Payment already processed" });
      }

      console.log("[Webhook] Payment record found:", payment._id.toString());
      const existingPaid = await Payment.findOne({
        razorpayPaymentId: paymentId,
        status: "paid",
      });

      if (existingPaid) {
        console.log("Payment already processed");
        return res.status(200).json({ message: "Payment already processed" });
      }

      try {
        const razorpayPayment = await razorpayInstance.payments.fetch(
          paymentId
        );

        if (
          razorpayPayment.status !== "captured" ||
          razorpayPayment.amount !== payment.amount
        ) {
          payment.status = "failed";
          await payment.save();
          return res.status(400).json({ error: "Payment verification failed" });
        }

        console.log("[Webhook] Razorpay verification passed");
        payment.razorpayPaymentId = paymentId;
        payment.status = "paid";
        payment.processedAt = new Date();
        await payment.save();

        const user = await User.findById(payment.userId);
        if (user) {
          console.log("[Webhook] Updating user plan:", user._id.toString(), "->", payment.plan);
          user.plan = payment.plan;
          await user.save();
          console.log("[Webhook] User plan updated:", user.plan);
        }

        return res.status(200).json({ message: "Payment verified successfully" });
      } catch (razorpayErr) {
        console.error("Razorpay API error:", razorpayErr);
        return res.status(500).json({ error: "Payment verification failed" });
      }
    }


    if (event === "payment_link.cancelled" || event === "payment_link.expired") {
      const paymentLinkId = paymentEntity.id;
      await Payment.findOneAndUpdate(
        { razorpayPaymentLinkId: paymentLinkId, status: "pending" },
        { status: event.includes("expired") ? "expired" : "failed" }
      );
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

    // Find pending/paid record for this link
    let payment = await Payment.findOne({
      razorpayPaymentLinkId: linkId,
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    // If already processed, ensure user plan is up to date and return success
    if (payment.status === "paid") {
      const user = await User.findById(payment.userId);
      if (user && user.plan !== payment.plan) {
        user.plan = payment.plan;
        await user.save();
      }
      return res.json({ ok: true, status: "paid" });
    }

    // Fetch latest status from Razorpay
    const link = await razorpayInstance.paymentLink.fetch(linkId);
    if (!link) {
      return res.status(400).json({ error: "Unable to verify payment link" });
    }

    // Accept paid links only
    if (link.status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // Extract payment id when available
    const rpPaymentId =
      link?.payments?.[0]?.id || link?.payment_id || null;

    // Basic amount check in minor units
    if (typeof link.amount === "number" && link.amount !== payment.amount) {
      return res.status(400).json({ error: "Amount mismatch" });
    }

    // Mark as paid and activate plan
    payment.razorpayPaymentId = rpPaymentId || payment.razorpayPaymentId;
    payment.status = "paid";
    payment.processedAt = new Date();
    await payment.save();

    const user = await User.findById(payment.userId);
    if (user) {
      user.plan = payment.plan;
      await user.save();
    }

    return res.json({ ok: true, status: "paid" });
  } catch (err) {
    console.error("Confirm payment error:", err);
    return res.status(500).json({ error: "Payment confirmation failed" });
  }
};

/**
 * Public GET callback endpoint used by Razorpay Payment Links
 * Redirects the customer to frontend /payment-success preserving query string.
 * No auth required.
 */
exports.publicCallbackRedirect = async (req, res) => {
  try {
    const frontendUrl = (process.env.FRONTEND_URL || "https://highlightkaro-1.onrender.com").replace(/\/+$/, "");
    const usp = new URLSearchParams(req.query || {});
    const redirectUrl = `${frontendUrl}/payment-success${usp.toString() ? `?${usp.toString()}` : ""}`;
    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error("Callback redirect error:", err);
    return res.status(500).send("Callback error");
  }
};
