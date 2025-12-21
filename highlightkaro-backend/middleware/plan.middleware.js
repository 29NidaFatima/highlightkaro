module.exports = (requiredPlan) => {
  const order = ["free", "basic19", "pro99"];

  return (req, res, next) => {
    if (!req.user || !req.user.plan) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (order.indexOf(req.user.plan) < order.indexOf(requiredPlan)) {
      return res.status(403).json({
        error: "Upgrade plan to access this feature",
      });
    }

    next();
  };
};

