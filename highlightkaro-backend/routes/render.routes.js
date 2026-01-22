const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const plan = require("../middleware/plan.middleware");

router.post(
  "/render",
  auth,
  plan("basic30"),
  (req, res) => {
    res.json({ message: "Render allowed for basic30+" });
  }
);

module.exports = router;


