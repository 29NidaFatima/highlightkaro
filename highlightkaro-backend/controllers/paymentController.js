const razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Payment = require("../models/Payment");

// Initialize Razorpay
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan configuration (amounts in paise)
const PLAN_CONFIG = {
  basic19: {
    amount: 1900, // ₹19 in paise
    name: "Basic Plan",
  },
  pro99: {
    amount: 9900, // ₹99 in paise
    name: "Pro Plan",
  },
};

/**
 * Create Razorpay Payment Link for plan upgrade
 * POST /api/payment/create-link
 */
exports.createPaymentLink = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user._id;

    // Validate plan
    if (!plan || !PLAN_CONFIG[plan]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Prevent downgrades (only allow upgrades)
    const currentPlan = req.user.plan;
    const planOrder = ["free", "basic19", "pro99"];
    if (planOrder.indexOf(currentPlan) >= planOrder.indexOf(plan)) {
      return res.status(400).json({
        error: "You can only upgrade to a higher plan",
      });
    }

    const planConfig = PLAN_CONFIG[plan];

    // Create payment link
    const paymentLinkOptions = {
      amount: planConfig.amount,
      currency: "INR",
      description: `Upgrade to ${planConfig.name}`,
      customer: {
        name: req.user.name,
        email: req.user.email,
      },
      notify: {
        email: true,
      },
      reminder_enable: true,
      callback_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success`,
      callback_method: "get",
    };

    const paymentLink = await razorpayInstance.paymentLink.create(
      paymentLinkOptions
    );

    // Store payment record
    await Payment.create({
      userId,
      plan,
      amount: planConfig.amount,
      razorpayPaymentLinkId: paymentLink.id,
      status: "pending",
    });

    res.json({
      paymentLinkId: paymentLink.id,
      paymentLinkUrl: paymentLink.short_url,
      amount: planConfig.amount,
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
