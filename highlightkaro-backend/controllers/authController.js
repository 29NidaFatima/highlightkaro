const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");

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
    const { email, password, rememberMe } = req.body;

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

    const token = generateAccessToken(user, !!rememberMe);

    if (rememberMe) {
      const refreshToken = generateRefreshToken(user);
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      res.cookie("hk_refresh", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sevenDaysMs,
        path: "/api/auth/refresh",
      });
    }

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

exports.refresh = async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("hk_refresh="));
    if (!match) {
      return res.status(401).json({ error: "No refresh token" });
    }
    const refreshToken = decodeURIComponent(match.split("=")[1]);

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    if (decoded.type !== "refresh" || !decoded.userId) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await require("../models/User")
      .findById(decoded.userId)
      .select("-password");
    if (!user || user.isActive === false) {
      return res.status(401).json({ error: "User not found" });
    }

    const accessToken = generateAccessToken(user, true);
    const newRefreshToken = generateRefreshToken(user);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    res.cookie("hk_refresh", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sevenDaysMs,
      path: "/api/auth/refresh",
    });

    return res.json({
      token: accessToken,
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (err) {
    return res.status(401).json({ error: "Refresh failed" });
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
