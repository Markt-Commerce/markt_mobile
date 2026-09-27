# Checkout & Payment — Manual QA Script

**Environment:** Staging API + Paystack test keys  
**Role:** Logged-in buyer with items in cart

---

## Prerequisites

- [ ] Buyer account logged in (Bearer token / session active)
- [ ] At least one product in cart (`GET /cart` returns items)
- [ ] Shipping address set on profile OR allow location / enter manually on cart screen

---

## Flow A — Card payment (Paystack WebView)

1. **Cart**
   - [ ] Open **Orders → My Cart**
   - [ ] Confirm items, quantities, subtotal match API
   - [ ] Confirm shipping address card shows valid address

2. **Checkout**
   - [ ] Tap **Checkout**
   - [ ] Success toast; cart empties
   - [ ] Navigates to `/checkout/payment-method/{order_id}`

3. **Payment method**
   - [ ] Order total matches `GET /orders/{id}` → `total` (not client-computed)
   - [ ] Select **Pay with card**
   - [ ] Tap **Proceed**

4. **Paystack WebView**
   - [ ] Paystack checkout loads (authorization URL)
   - [ ] Complete test payment (Paystack test card)
   - [ ] App intercepts `markt://payment/success?...` OR navigates to payment result

5. **Payment result**
   - [ ] Shows “Payment successful” after verify
   - [ ] **View order** opens order detail
   - [ ] Order status is `ready_for_delivery` (or paid state)

6. **Orders list**
   - [ ] Order appears under **Completed** (or appropriate tab)
   - [ ] Track order works from detail screen

---

## Flow B — Wallet payment

1. **Balance**
   - [ ] On payment method screen, wallet shows balance from `GET /wallet`
   - [ ] If balance < total, wallet option is disabled / shows insufficient message

2. **Pay**
   - [ ] Select **Markt wallet** (sufficient balance)
   - [ ] Tap **Proceed**
   - [ ] No WebView; lands on payment result success
   - [ ] Order status updates to `ready_for_delivery`

---

## Flow C — Retry / idempotency

1. **Double-tap checkout**
   - [ ] Rapid double-tap Checkout does not create duplicate orders (same idempotency key)

2. **Failed payment retry**
   - [ ] From order detail with `pending_payment`, tap **Pay now**
   - [ ] Retry payment with same order_id
   - [ ] New payment initializes successfully

---

## Flow D — Error cases

| Scenario | Expected UX |
|----------|-------------|
| Empty cart checkout | Error / empty cart state |
| Missing shipping address | Toast: address required |
| Order already paid | “Already paid” → order detail |
| Insufficient wallet | Error toast; suggest card |
| Paystack cancelled | Failed result screen + retry |
| 401 during checkout | Redirect to login |

---

## API spot-checks (optional)

```bash
# After checkout
GET /api/v1/orders/{order_id}     → status: pending_payment

# After card pay + verify
GET /api/v1/payments/{payment_id}/verify → verified: true
GET /api/v1/orders/{order_id}     → status: ready_for_delivery
```

---

## Deep link smoke test

With app in background after opening Paystack:

```
markt://payment/success?payment_id=PAY_xxx&reference=PAY_xxx
markt://payment/failed?payment_id=PAY_xxx&error=cancelled
```

- [ ] App opens payment result screen with correct status
