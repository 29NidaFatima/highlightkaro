const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      plan: user.plan,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
