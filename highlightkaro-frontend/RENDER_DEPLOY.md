# Deploying frontend on Render (fix payment-success 404)

After payment, Razorpay redirects to `/payment_success` or `/payment-success`. The app must serve `index.html` for these paths (SPA routing). Otherwise you get **404 Not Found**.

## Option A: Use the repo’s `render.yaml` (recommended)

From the **repo root** (parent of `highlightkaro-frontend`), use the Blueprint that includes a rewrite rule:

- In Render Dashboard: **New → Blueprint** and connect the repo, or apply the existing `render.yaml`.
- The blueprint defines a static site with a rewrite so all routes serve `index.html`.

## Option B: Existing static site – add a rewrite in Dashboard

If the frontend is already a **Static Site** and you are not using the blueprint:

1. Open the frontend service on [Render Dashboard](https://dashboard.render.com).
2. Go to **Redirects/Rewrites**.
3. Add a **Rewrite** (not Redirect):
   - **Source:** `/*`
   - **Destination:** `/index.html`

Save. Redeploy if needed. Then `/payment-success` and `/payment_success` will load the app instead of 404.

## Option C: Deploy as Web Service (Node server)

This repo includes a small Node server that serves the built app with SPA fallback:

1. In Render, create a **Web Service** (not Static Site).
2. **Root Directory:** `highlightkaro-frontend`.
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm run start`
5. Deploy.

The server serves `dist/` and returns `index.html` for any path, so payment success URLs work without extra redirects/rewrites.
