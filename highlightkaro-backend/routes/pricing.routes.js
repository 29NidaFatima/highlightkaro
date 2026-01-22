const express = require("express");
const router = express.Router();
const { getPricing } = require("../controllers/pricingController");
 
router.get("/", getPricing);
 
module.exports = router;
