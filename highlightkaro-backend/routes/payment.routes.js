const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const {
  createPaymentLink,
} = require("../controllers/paymentController");

router.post("/create-link", auth, createPaymentLink);

module.exports = router;
