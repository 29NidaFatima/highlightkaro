const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../middleware/validation.middleware");

// Register route with validation
router.post("/register", validateRegister, register);

// Login route with validation
router.post("/login", validateLogin, login);

module.exports = router;
