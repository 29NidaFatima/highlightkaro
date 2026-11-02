/**
 * Serves the Vite build (dist/) with SPA fallback so routes like
 * /payment-success and /payment_success return index.html and React Router can handle them.
 * Use this when deploying as a Web Service (e.g. on Render).
 */
const express = require("express");
const path = require("path");

const app = express();
const dist = path.join(__dirname, "dist");
const port = process.env.PORT || 3000;

app.use(express.static(dist));

// SPA fallback: any path that is not a file gets index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, () => {
  console.log(`Serving static files from ${dist} on port ${port}`);
});
