const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const os = require("os");

const auth = require("../middleware/auth.middleware");
const renderController = require("../controllers/renderController");

// Multer setup for file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), "highlightkaro_uploads"),
});

router.post(
  "/render",
  auth,
  upload.single("image"),
  renderController.renderVideo
);

module.exports = router;
