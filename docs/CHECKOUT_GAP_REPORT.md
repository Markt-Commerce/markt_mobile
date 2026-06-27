# Checkout & Payment — Gap Report

**Date:** 2026-05-23  
**Scope:** Cart → Checkout → Payment → Order confirmation (React Native buyer flow)

## Summary

The app already used the **canonical checkout path** (`POST /cart/checkout`) and **Paystack initialize** (`POST /payments/initialize`). The main gaps were **incomplete payment completion** (no verify, no deep links), **empty billing address**, **missing idempotency**, and **no wallet path**.

| Area | Before | After (this PR) |
|------|--------|-----------------|
| Checkout API | `POST /cart/checkout` ✅ | + billing mirror, idempotency key |
| Deprecated `POST /orders` | Defined, unused ✅ | Marked `@deprecated` |
| Payment initialize | Used but forced `method: card` | Respects card / bank_transfer / wallet |
| Paystack WebView | No-op callback handler | Deep link intercept + verify |
| Deep links | Not handled | `markt://payment/success\|failed` + routes |
| Payment verify | Imported, never called | Called on return + result screen |
| Wallet | Not implemented | `GET /wallet` + `POST /payments/create` |
| Order detail pay CTA | Missing for `pending_payment` | **Pay now** button added |

---

## Gap checklist (spec vs app)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Cart uses `GET /cart` | ✅ | `services/sections/cart.ts` |
| 2 | Checkout uses `POST /cart/checkout` | ✅ | Not `POST /orders` |
| 3 | Shipping address required fields | ✅ | `useShippingAddress` + `ShippingAddressCard` |
| 4 | Billing mirrors shipping | ✅ Fixed | `utils/checkoutPayload.ts` |
| 5 | Use server `total` for payment | ✅ | Fetched from `GET /orders/:id` |
| 6 | `POST /payments/initialize` for card | ✅ Fixed | No longer overrides method |
| 7 | Omit `amount` on payment (server uses order.total) | ✅ Fixed | Amount optional in API client |
| 8 | `metadata.platform: "mobile"` | ✅ | Payment initialize/create |
| 9 | Deep link `markt://payment/*` | ✅ Fixed | Handler + `app/payment/success\|failed.tsx` |
| 10 | Verify after Paystack return | ✅ Fixed | `payscreen` + `payment-result` |
| 11 | Wallet pay + balance check | ✅ Fixed | `services/sections/wallet.ts` |
| 12 | No `POST /orders/{id}/pay` | ✅ | Deprecated, unused |
| 13 | Idempotency keys | ✅ Fixed | `utils/idempotency.ts` |
| 14 | Buyer role + auth | ✅ | Bearer token via `services/api.ts` |

---

## Files changed

### API & utils
- `services/sections/payments.ts` — rewrite: initialize/create/verify, unwrap responses
- `services/sections/wallet.ts` — **new** wallet balance + top-up init
- `services/sections/orders.ts` — deprecate `createOrder`, `payOrder`
- `models/cart.ts` — checkout idempotency, full `CheckoutResponse`
- `models/payments.ts` — wallet method, optional amount, verify types
- `utils/idempotency.ts` — **new** session-scoped keys
- `utils/checkoutPayload.ts` — **new** billing mirror + checkout builder
- `utils/paymentDeepLink.ts` — **new** URL parser
- `utils/apiUnwrap.ts` — **new** `{ data }` unwrap helper

### Screens
- `app/(tabs)/orders.tsx` — checkout payload builder
- `app/(tabs)/cart.tsx` — same; removed dead `createOrder` import
- `app/checkout/payment-method/[id].tsx` — wallet, idempotency, pass auth URL
- `app/checkout/payscreen/[id].tsx` — WebView deep link + verify
- `app/checkout/payment-result.tsx` — **new** success/failure + order poll
- `app/orderdetail/[id].tsx` — Pay now for `pending_payment`
- `app/payment/success.tsx`, `app/payment/failed.tsx` — **new** deep link routes
- `app/_layout.tsx` — `PaymentDeepLinkHandler` when logged in

### Components
- `components/PaymentDeepLinkHandler.tsx` — **new** global Linking listener

---

## Remaining / out of scope

| Item | Severity | Notes |
|------|----------|-------|
| Save manual shipping to profile on checkout | Low | `PATCH /users/profile/buyer` exists but unwired |
| Wallet top-up UI | Low | API stub only (`initializeWalletTopUp`) |
| Coupon `POST /cart/coupon` | Low | Not in app |
| Duplicate cart UIs | Low | `orders.tsx` My Cart + hidden `cart.tsx` tab |
| `app/checkout/payment-info.tsx` | Low | Legacy stub; points to missing confirmation route |
| E2E automated tests | Medium | Manual script provided |

---

## Deprecated endpoints (do not use)

| Endpoint | Replacement |
|----------|-------------|
| `POST /orders` | `POST /cart/checkout` |
| `POST /orders/:id/pay` | `POST /payments/initialize` or `/payments/create` |

Marked with `@deprecated` in `services/sections/orders.ts`.
