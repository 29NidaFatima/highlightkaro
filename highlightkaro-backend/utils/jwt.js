const jwt = require("jsonwebtoken");

const ACCESS_DEFAULT_EXP = "24h";
const ACCESS_SHORT_EXP = "15m";
const REFRESH_EXP = "7d";

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

exports.generateAccessToken = (user, short = false) => {
  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: short ? ACCESS_SHORT_EXP : ACCESS_DEFAULT_EXP }
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString(), type: "refresh" },
    getRefreshSecret(),
    { expiresIn: REFRESH_EXP }
  );
};
