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
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    const err = new Error("Only PNG, JPEG, WebP or GIF images are supported");
    err.status = 400;
    cb(err);
  },
});

router.post(
  "/render",
  auth,
  upload.single("image"),
  renderController.renderVideo
);

module.exports = router;
