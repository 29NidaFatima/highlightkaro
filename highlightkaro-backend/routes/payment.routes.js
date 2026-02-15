const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  createPaymentLink,
  confirmPayment,
  publicCallbackRedirect,
} = require("../controllers/paymentController");

router.post("/create-link", auth, createPaymentLink);
router.get("/confirm", auth, confirmPayment);
router.get("/callback", publicCallbackRedirect);

module.exports = router;
