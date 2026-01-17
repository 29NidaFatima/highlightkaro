const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  createPaymentLink,
  verifyWebhook,
} = require("../controllers/paymentController");

// Create payment link (authenticated)
router.post("/create-link", auth, createPaymentLink);

// Webhook endpoint (no auth, verified by signature)
// Use raw body parser for webhook signature verification
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  verifyWebhook
);

module.exports = router;
