const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract userId (support both 'id' and 'userId' for backward compatibility)
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Invalid token: missing user identifier" });
    }

    // Fetch user from database
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if user is active (graceful: if isActive field exists and is false, reject)
    if (user.isActive === false) {
      return res.status(401).json({ error: "Account is inactive" });
    }

    // Attach full user object to request (plan is always fresh from DB)
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Authentication failed" });
  }
};
