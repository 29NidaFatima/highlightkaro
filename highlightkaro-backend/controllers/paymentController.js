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

// Plan names (display only). Amounts/currency are backend-driven via pricingConfig.
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

    // Prevent downgrades (only allow upgrades)
    const currentPlan = req.user.plan;
    const planOrder = ["free", "basic30", "pro99"];
    if (planOrder.indexOf(currentPlan) >= planOrder.indexOf(plan)) {
      return res.status(400).json({
        error: "You can only upgrade to a higher plan",
      });
    }

    // Decide pricing from backend using requested region (or default to global if missing/invalid)
    // We trust the region selection from UI (user choice), but the price is strictly from backend.
    const planPricing = pricingService.getPlanPricing(plan, region);

    if (!planPricing || typeof planPricing.amount !== "number") {
      return res.status(500).json({ error: "Pricing is not available for this plan" });
    }

    const amountMinor = toMinorUnits(planPricing.amount);

    // Create payment link
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
      callback_url: `${process.env.FRONTEND_URL || "https://highlightkaro-1.onrender.com"}/payment-success`,
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

    // Get raw body (Buffer from express.raw())
    const rawBody = req.body;

    // Verify webhook signature using raw body
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (generatedSignature !== webhookSignature) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // Parse JSON after signature verification
    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;
    const paymentEntity = payload.payload?.payment_link?.entity;

    // Handle payment.captured event (successful payment)
    if (event === "payment_link.paid") {
      const paymentLinkId = paymentEntity.id;
      const paymentId = paymentEntity.payments?.[0]?.id;

      if (!paymentLinkId || !paymentId) {
        return res.status(400).json({ error: "Invalid payment data" });
      }

      // Find payment record
      const payment = await Payment.findOne({
        razorpayPaymentLinkId: paymentLinkId,
        status: "pending",
      });

      if (!payment) {
        console.log("Payment record not found or already processed");
        return res.status(200).json({ message: "Payment already processed" });
      }

      // Prevent duplicate processing
      const existingPaid = await Payment.findOne({
        razorpayPaymentId: paymentId,
        status: "paid",
      });

      if (existingPaid) {
        console.log("Payment already processed");
        return res.status(200).json({ message: "Payment already processed" });
      }

      // Verify payment with Razorpay API
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

        // Update payment record
        payment.razorpayPaymentId = paymentId;
        payment.status = "paid";
        payment.processedAt = new Date();
        await payment.save();

        // Update user plan
        const user = await User.findById(payment.userId);
        if (user) {
          user.plan = payment.plan;
          await user.save();
        }

        return res.status(200).json({ message: "Payment verified successfully" });
      } catch (razorpayErr) {
        console.error("Razorpay API error:", razorpayErr);
        return res.status(500).json({ error: "Payment verification failed" });
      }
    }

    // Handle other events (optional logging)
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
