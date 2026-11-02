const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const paymentController = require("./controllers/paymentController");

const authRoutes = require("./routes/auth.routes");
const renderRoutes = require("./routes/render.routes");
const paymentRoutes = require("./routes/payment.routes");
const pricingRoutes = require("./routes/pricing.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Behind Render's proxy: lets req.ip use X-Forwarded-For
app.set("trust proxy", 1);

// FRONTEND_URL may hold a comma-separated list of allowed origins
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || "").split(",").map((o) => o.trim().replace(/\/+$/, "")),
  "https://highlightkaro-online.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
].filter(Boolean);

// Webhook needs the raw body for signature verification, so it is registered before express.json()
app.post("/api/payment/webhook", express.raw({ type: "*/*" }), paymentController.verifyWebhook);

app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser requests (curl, Razorpay redirects) have no Origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, origin);
      // Unknown origins get no CORS headers, so browsers block them
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "content-type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check for Render and for waking the service from sleep
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    webhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", renderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/pricing", pricingRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Last-resort error handler (e.g. multer errors, bad JSON)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Image is too large (max 15 MB)" });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (err?.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`HighlightKaro backend listening on port ${PORT}`);
  });
});
