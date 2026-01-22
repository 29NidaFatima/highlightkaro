const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation middleware has already validated inputs
    // Check user exists (email is already lowercased by middleware)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password (NEVER log password)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (password is excluded from response due to select: false)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      plan: "free", // default
    });

    // Response NEVER includes password (even hashed)
    res.json({ message: "User registered successfully" });
  } catch (err) {
    // NEVER log password in error messages
    const errorMessage = err.code === 11000 
      ? "User already exists" 
      : "Registration failed. Please try again.";
    res.status(500).json({ error: errorMessage });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation middleware has already validated email format
    // Explicitly select password (required for comparison)
    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password (NEVER log password)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is active
    if (user.isActive === false) {
      return res.status(401).json({ error: "Account is inactive" });
    }

    // JWT payload contains ONLY userId (plan fetched from DB on each request)
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Response NEVER includes password (user object doesn't have password due to select: false)
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (err) {
    // NEVER log password in error messages
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 * Protected route - requires authentication
 */
exports.getMe = async (req, res) => {
  try {
    // req.user is already populated by auth middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};
