# Razorpay Testing & Verification Guide

## Overview
This guide provides step-by-step instructions for testing Razorpay payment integration in TEST MODE.

---

## 1. Environment Setup

### Required Environment Variables
Ensure these are set in `.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important:**
- Use TEST keys (keys starting with `rzp_test_`)
- NEVER commit real keys to git
- Test keys are found in Razorpay Dashboard → Settings → API Keys → Test Mode

---

## 2. Test Card Details

Razorpay provides test cards that simulate different payment scenarios.

### Success Scenarios

| Card Number | CVV | Expiry | Name | Result |
|------------|-----|--------|------|--------|
| `4111 1111 1111 1111` | Any | Any future | Any | ✅ Payment Success |
| `5104 0600 0000 0008` | Any | Any future | Any | ✅ Payment Success |

### Failure Scenarios

| Card Number | CVV | Expiry | Name | Result |
|------------|-----|--------|------|--------|
| `4000 0000 0000 0002` | Any | Any future | Any | ❌ Card Declined |
| `4000 0000 0000 0069` | Any | Any future | Any | ❌ Payment Failed |

**Note:** Any CVV, expiry, and cardholder name can be used with test cards.

---

## 3. Testing Payment Flow

### Step 1: Start Backend Server

```bash
cd highlightkaro-backend
npm start
```

Verify server is running on `http://localhost:5000`

### Step 2: Create Payment Link (API Test)

**Endpoint:** `POST /api/payment/create-link`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "plan": "basic19"
}
```

**Expected Response:**
```json
{
  "success": true,
  "paymentLink": "https://rzp.io/i/xxxxx",
  "paymentLinkId": "plink_xxxxxxxxxxxxx"
}
```

**Verification Checklist:**
- [ ] Response contains `paymentLink` URL
- [ ] Response contains `paymentLinkId`
- [ ] Check MongoDB: `Payment` collection should have a pending record
- [ ] Payment record should have `status: "pending"`

### Step 3: Open Payment Link

1. Copy `paymentLink` from response
2. Open in browser (new tab/incognito)
3. Enter test card details (see section 2)
4. Click "Pay"

**Verification Checklist:**
- [ ] Payment form loads correctly
- [ ] Card details can be entered
- [ ] Test mode badge visible (if applicable)

### Step 4: Complete Payment

**For Success Test:**
- Use card: `4111 1111 1111 1111`
- Enter any CVV, expiry, name
- Click "Pay"
- Should redirect to success page (configured in payment link)

**For Failure Test:**
- Use card: `4000 0000 0000 0002`
- Should show "Payment Failed" message

---

## 4. Webhook Testing

### Step 1: Webhook Configuration

**Razorpay Dashboard Setup:**
1. Go to: Settings → Webhooks
2. Click "Add New Webhook"
3. URL: `http://your-domain.com/api/payment/webhook`
   - For local testing, use: `ngrok http 5000` or similar
4. Events to listen: `payment_link.paid`
5. Save and copy `Webhook Secret`

### Step 2: Test Webhook Locally

**Option A: Using ngrok (Recommended)**
```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 5000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
# Update webhook URL in Razorpay Dashboard
```

**Option B: Using Razorpay Test Webhook Tool**
1. Go to: Razorpay Dashboard → Webhooks → Test Webhooks
2. Select event: `payment_link.paid`
3. Send test webhook

### Step 3: Verify Webhook Processing

**Check Backend Logs:**
```
Webhook received: payment_link.paid
Payment verified: <payment_id>
User plan updated: <user_id> → basic19
```

**Check MongoDB:**
```javascript
// Check Payment collection
db.payments.findOne({ razorpayPaymentId: "<payment_id>" })
// Should have: status: "paid", processedAt: <timestamp>

// Check User collection
db.users.findOne({ _id: ObjectId("<user_id>") })
// Should have: plan: "basic19"
```

**Verification Checklist:**
- [ ] Webhook is received (check logs)
- [ ] Webhook signature is verified
- [ ] Payment status updated to "paid"
- [ ] User plan updated in MongoDB
- [ ] `processedAt` timestamp is set

---

## 5. Security Verification

### Webhook Signature Verification

**How it works:**
1. Razorpay sends webhook with `X-Razorpay-Signature` header
2. Backend generates signature from request body + `RAZORPAY_WEBHOOK_SECRET`
3. Compare signatures (must match)

**Test Invalid Signature:**
```javascript
// Modify webhook controller to test
const invalidSignature = "fake_signature";
// Should return 401 Unauthorized
```

**Verification Checklist:**
- [ ] Invalid signature is rejected (401)
- [ ] Valid signature is accepted (200)
- [ ] Signature generation matches Razorpay algorithm (HMAC-SHA256)

### Payment Duplication Prevention

**Test:**
1. Send same payment webhook twice
2. Second webhook should be ignored (already processed)

**Verification:**
```javascript
// Check MongoDB
db.payments.find({ razorpayPaymentId: "<payment_id>" })
// Should return only ONE record with status: "paid"
```

**Verification Checklist:**
- [ ] Duplicate webhooks are ignored
- [ ] User plan not updated twice
- [ ] No duplicate payment records

### Plan Upgrade Validation

**Test Scenarios:**

1. **Upgrade from free → basic19:**
   - Create payment link for `basic19`
   - Complete payment
   - Verify: `user.plan = "basic19"`

2. **Upgrade from basic19 → pro99:**
   - Create payment link for `pro99`
   - Complete payment
   - Verify: `user.plan = "pro99"`

3. **Prevent Downgrade:**
   - User on `pro99` tries to create payment link for `basic19`
   - Should return 400: "You can only upgrade to a higher plan"

**Verification Checklist:**
- [ ] Upgrades work correctly
- [ ] Downgrades are prevented
- [ ] Same plan upgrades are prevented

---

## 6. Database Verification

### Payment Collection Check

```javascript
// MongoDB queries
use highlightkaro;

// Check all pending payments
db.payments.find({ status: "pending" })

// Check paid payments
db.payments.find({ status: "paid" })

// Check payment for specific user
db.payments.find({ userId: ObjectId("<user_id>") })
```

### User Collection Check

```javascript
// Check user plan
db.users.findOne({ _id: ObjectId("<user_id>") }, { plan: 1 })

// Check all users by plan
db.users.find({ plan: "basic19" })
db.users.find({ plan: "pro99" })
```

---

## 7. Common Issues & Solutions

### Issue: Webhook Not Received

**Possible Causes:**
- Webhook URL not accessible (localhost issue)
- Webhook secret mismatch
- Firewall blocking webhook

**Solutions:**
- Use `ngrok` for local testing
- Verify webhook secret in `.env` matches Razorpay Dashboard
- Check server logs for incoming requests

### Issue: Payment Not Updating User Plan

**Possible Causes:**
- Webhook not processed
- Database transaction failed
- User ID mismatch

**Solutions:**
- Check webhook logs
- Verify MongoDB connection
- Check `userId` in Payment record matches User `_id`

### Issue: Invalid Signature Error

**Possible Causes:**
- Webhook secret mismatch
- Raw body not captured correctly
- Signature generation algorithm mismatch

**Solutions:**
- Verify `RAZORPAY_WEBHOOK_SECRET` in `.env`
- Ensure `app.js` captures raw body for webhook route
- Use HMAC-SHA256 algorithm

---

## 8. Production Checklist

Before going live:

- [ ] Switch to LIVE keys (`rzp_live_...`)
- [ ] Update webhook URL to production domain
- [ ] Test webhook with production domain
- [ ] Verify HTTPS is enabled
- [ ] Set up webhook monitoring/alerts
- [ ] Test with real card (small amount first)
- [ ] Monitor payment success/failure rates
- [ ] Set up database backups
- [ ] Configure error logging/alerting

---

## 9. Test Summary

### End-to-End Test Flow

1. ✅ **User Registration/Login**
   - Create user account
   - Login and get JWT token

2. ✅ **Create Payment Link**
   - POST `/api/payment/create-link` with plan
   - Verify payment link returned
   - Verify payment record created

3. ✅ **Complete Payment**
   - Open payment link
   - Enter test card: `4111 1111 1111 1111`
   - Complete payment

4. ✅ **Webhook Processing**
   - Verify webhook received
   - Verify signature validated
   - Verify payment status updated

5. ✅ **User Plan Update**
   - Verify `user.plan` updated in MongoDB
   - Verify user can access plan features
   - Verify export limits updated

---

## 10. Additional Resources

- **Razorpay Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/
- **Webhook Testing:** https://razorpay.com/docs/webhooks/testing/
- **API Documentation:** https://razorpay.com/docs/api/

---

## Notes

- Test mode payments are free (no real money charged)
- Test cards only work in test mode
- Webhook secret is different for test/live mode
- Always test thoroughly before switching to live mode
