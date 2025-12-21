const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const plan = require("../middleware/plan.middleware");

router.post(
  "/render",
  auth,
  plan("basic19"),
  (req, res) => {
    res.json({ message: "Render allowed for basic19+" });
  }
);

module.exports = router;


