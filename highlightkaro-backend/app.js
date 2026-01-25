const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4000 
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const renderRoutes = require("./routes/render.routes");
const paymentRoutes = require("./routes/payment.routes");
const pricingRoutes = require("./routes/pricing.routes");


const app = express();
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"]
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server, curl, Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api", renderRoutes); // renderRoutes handles /render
app.use("/api/payment", paymentRoutes);
app.use("/api/pricing", pricingRoutes);

app.listen(PORT, () => {
  console.log(`HighlightKaro backend listening on port ${PORT}`);
});

connectDB();
