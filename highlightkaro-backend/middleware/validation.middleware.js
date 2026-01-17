/**
 * Validation Middleware for Auth Routes
 * Validates register and login requests before controllers
 */

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Rules:
 * - min 8 characters
 * - at least 1 uppercase
 * - at least 1 lowercase
 * - at least 1 number
 */
const isValidPassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  return { valid: true };
};

/**
 * Validate register request
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  // Check required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }

  // Validate name
  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({
      error: "Name must be at least 2 characters long",
    });
  }

  // Validate email
  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: "Invalid email format",
    });
  }

  // Validate password
  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      error: passwordValidation.error,
    });
  }

  // Sanitize: trim and lowercase email
  req.body.email = email.trim().toLowerCase();
  req.body.name = name.trim();

  next();
};

/**
 * Validate login request
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: "Invalid email format",
    });
  }

  // Password must be provided (but we don't validate strength on login)
  if (typeof password !== "string" || password.length === 0) {
    return res.status(400).json({
      error: "Password is required",
    });
  }

  // Sanitize: trim and lowercase email
  req.body.email = email.trim().toLowerCase();

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
