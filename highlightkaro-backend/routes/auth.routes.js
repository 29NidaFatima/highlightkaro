const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../middleware/validation.middleware");
const auth = require("../middleware/auth.middleware");

// Register route with validation
router.post("/register", validateRegister, register);

// Login route with validation
router.post("/login", validateLogin, login);

// Get current user profile (protected)
router.get("/me", auth, getMe);

module.exports = router;
