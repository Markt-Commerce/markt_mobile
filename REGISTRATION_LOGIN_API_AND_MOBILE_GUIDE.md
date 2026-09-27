# Registration & Login — API Contract & Mobile (React Native) Guide

This document provides:
1. **API contract** — registration, login, username check, profile picture, email verification.
2. **React Native instructions** — multi-step registration, debounced username check, password strength UI, eye toggle for password visibility, profile picture after onboarding.

**Base URL:** `{API_BASE}/api/v1`. Auth: session cookie (no Bearer token). Registration and login return the user object; server sets session cookie.

---

## Part 1: API Contract

### 1. Registration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/register` | POST | Create account (buyer or seller). User is logged in on success. |

**Body (JSON):**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "phone_number": "+2348012345678",
  "account_type": "buyer",
  "buyer_data": {
    "buyername": "John Doe",
    "shipping_address": {}
  }
}
```

**OR for seller:**

```json
{
  "email": "seller@example.com",
  "username": "shopowner",
  "password": "SecurePass123",
  "account_type": "seller",
  "seller_data": {
    "shop_name": "My Shop",
    "description": "We sell great products",
    "category_ids": [1, 2],
    "policies": {}
  }
}
```

**Field rules:**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | yes | Valid email format |
| `username` | string | yes | 3–20 chars; letters, numbers, underscores only |
| `password` | string | yes | Min 8 chars; at least 1 digit, 1 lowercase, 1 uppercase |
| `phone_number` | string | no | Nigerian format: +234... or 11 digits |
| `account_type` | string | yes | `"buyer"` or `"seller"` |
| `buyer_data` | object | if buyer | `buyername` (required), `shipping_address` (optional) |
| `seller_data` | object | if seller | `shop_name` (required), `description` (required), `category_ids` (required), `policies` (optional) |
| `address` | object | no | User address fields (optional) |

**Response (201):** User object (id, email, username, profile_picture, is_buyer, is_seller, email_verified, current_role, etc.).

**Errors:**
- **400** — Validation error.
- **409** — Email or username already exists.

---

### 2. Username availability (debounced)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/check-username` | GET | Check if username is available |

**Query:**

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `username` | string | yes | 3–20 chars; letters, numbers, underscores only |

**Response (200):**

```json
{
  "available": true,
  "message": "Username available"
}
```

**OR:**

```json
{
  "available": false,
  "message": "Username is already taken"
}
```

Reserved usernames return `"available": false, "message": "This username is reserved"`.

---

### 3. Login

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/login` | POST | Authenticate and establish session |

**Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "mypassword",
  "account_type": "buyer"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | User email |
| `password` | string | yes | User password |
| `account_type` | string | no | `"buyer"` or `"seller"` — if omitted, backend uses current_role or default |

**Response (200):** User object (id, email, username, profile_picture, is_buyer, is_seller, current_role, last_login_at, etc.). Server sets session cookie.

**Errors:**
- **401** — Invalid credentials.
- **403** — Unverified email (structured payload for frontend to handle email verification flow).

---

### 4. Profile picture upload (post-registration)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/profile/picture` | POST | Upload profile picture (auth required) |

**Body:** `multipart/form-data` with field `file` (image file).

**Response (200):** Media object (id, url, etc.). User profile is updated; `profile_picture` will reflect the new image.

**Errors:**
- **400** — No file or invalid filename.
- **401** — Not authenticated.

---

### 5. Categories (for seller registration)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/categories` | GET | List category tree for seller category selection |

**Response (200):** Array of categories (with optional children). Use `id`, `name`, `slug` for dropdown/chips. Seller must pass valid `category_ids` in `seller_data`.

---

### 6. Email verification (optional during onboarding)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users/email-verification/send` | POST | Send verification code to email |
| `/users/email-verification/verify` | POST | Verify email with code |

**Send body:** `{ "email": "user@example.com" }`  
**Verify body:** `{ "email": "user@example.com", "verification_code": "123456" }`

---

## Part 2: React Native — Registration & Login Implementation Guide

### 2.1 Registration flow: split into steps

Use a **stepper** or **wizard** (2–4 steps) instead of one long form.

#### Recommended step structure

| Step | Content | Purpose |
|------|---------|---------|
| **1. Account type** | Choose Buyer or Seller | Sets which fields appear later |
| **2. Base info** | Email, username, password | Username debounce + password strength here |
| **3. Role-specific** | Buyer: buyername, shipping (optional). Seller: shop_name, description, categories | Role-specific onboarding |
| **4. Profile picture** | Photo picker/camera | After account is created |

**API note:** The backend expects a **single** `POST /users/register` with the full payload. The frontend collects data across steps and submits once at the end of step 3. Step 4 runs **after** successful registration: call `POST /users/profile/picture` with the selected image.

---

### 2.2 Step 1: Account type

- **UI:** Two large cards or buttons — "I want to buy" (Buyer) / "I want to sell" (Seller).
- **State:** `accountType: "buyer" | "seller"`.
- **Validation:** None; user must select one.
- **Next:** Navigate to Step 2.

---

### 2.3 Step 2: Email, username, password

- **Fields:** Email (input), Username (input with live check), Password (input with strength indicator).
- **Username debouncing:**
  - Debounce `onChange` by **400–600 ms** before calling `GET /users/check-username?username={value}`.
  - Do **not** call for strings shorter than 3 chars or invalid format (regex `^[a-zA-Z0-9_]+$`).
  - While loading: show spinner or “Checking…” near the field.
  - If `available: true`: show green checkmark or “✓ Available”.
  - If `available: false`: show red state and `message` from response.
- **Password strength checks (client-side):**
  - Minimum 8 characters
  - At least one digit
  - At least one lowercase letter
  - At least one uppercase letter
  - Optional: special character (if you want to encourage it; backend does not require it)
- **Password strength UI:**
  - Progress bar or segmented indicator (e.g. Weak → Fair → Good → Strong).
  - Checkmarks or icons next to each rule as it’s met (with subtle animation: scale, fade).
  - Use `Animated` or `Reanimated` for smooth transitions when rules change.
  - Color coding: red (weak) → orange → yellow → green (strong).
- **Next:** Navigate to Step 3; pass `accountType` so correct fields show.

---

### 2.4 Step 3: Role-specific data

**Buyer:**
- `buyername` (required).
- `shipping_address` (optional; can be completed later).

**Seller:**
- `shop_name` (required).
- `description` (required).
- `category_ids` (required): multi-select from `GET /categories`; load categories once and cache.
- `policies` (optional).

- **Validation:** Ensure all required fields are filled.
- **Submit:** Build full payload and call `POST /users/register`.
  - On **201:** Navigate to Step 4 (profile picture).
  - On **409:** Show error (email/username taken); allow edit and retry.
  - On **400:** Show validation message.

---

### 2.5 Step 4: Profile picture (post-registration)

- **Placement:** After successful registration, before entering the main app.
- **UI:** Large circular placeholder with “Add photo” / camera icon; tap opens image picker or camera.
- **Flow:**
  1. User selects image (e.g. `expo-image-picker`).
  2. Call `POST /users/profile/picture` with `multipart/form-data` and `file`.
  3. On success: update local user state with new `profile_picture` and navigate to home.
  4. **Skip option:** “Skip for now” button; navigate to home without uploading.
- **UX:** Keep this step short; don’t block indefinitely if upload fails — allow skip and retry later in profile settings.

---

### 2.6 Login screen

- **Fields:** Email, Password.
- **Password visibility toggle (eye icon):**
  - Show/hide password with an eye icon (e.g. `@expo/vector-icons` — `Feather` “eye” / “eye-off”).
  - Toggle `secureTextEntry` on the password `TextInput` when icon is pressed.
  - Place icon inside or at the end of the password field (trailing icon).
- **Optional:** Account type selector (buyer/seller) if user has both.
- **Submit:** `POST /users/login` with `email`, `password`, optional `account_type`.
- **Errors:** 401 → “Invalid email or password”; 403 unverified → redirect to email verification flow.

---

### 2.7 Implementation details

#### Username debouncing (React)

```ts
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce"; // or lodash debounce

const [username, setUsername] = useState("");
const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
const [usernameMessage, setUsernameMessage] = useState("");

const checkUsername = useDebouncedCallback(async (value: string) => {
  if (value.length < 3 || !/^[a-zA-Z0-9_]+$/.test(value)) {
    setUsernameStatus("idle");
    return;
  }
  setUsernameStatus("checking");
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/check-username?username=${encodeURIComponent(value)}`);
    const data = await res.json();
    setUsernameStatus(data.available ? "available" : "taken");
    setUsernameMessage(data.message || "");
  } catch {
    setUsernameStatus("idle");
  }
}, 500);

// In TextInput onChangeText:
onChangeText={(text) => {
  setUsername(text);
  checkUsername(text);
}}
```

#### Password strength (client-side)

```ts
function getPasswordStrength(password: string): { level: number; checks: Record<string, boolean> } {
  const checks = {
    length: password.length >= 8,
    digit: /\d/.test(password),
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
  };
  const met = Object.values(checks).filter(Boolean).length;
  const level = met; // 0-4
  return { level, checks };
}
```

Use `level` for progress bar and `checks` for per-rule checkmarks.

#### Profile picture upload (Expo)

```ts
import * as ImagePicker from "expo-image-picker";

const pickAndUpload = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled) return;

  const formData = new FormData();
  formData.append("file", {
    uri: result.assets[0].uri,
    name: "profile.jpg",
    type: "image/jpeg",
  } as any);

  const res = await fetch(`${API_BASE}/api/v1/users/profile/picture`, {
    method: "POST",
    body: formData,
    headers: { "Content-Type": "multipart/form-data" },
    credentials: "include", // for session cookie
  });
  // Handle response...
};
```

---

### 2.8 Visual and UX guidelines

- **Stepper:** Progress indicator (1 of 3, 2 of 3) at top; back button on steps 2–3.
- **Animations:** Subtle transitions between steps; animate password checkmarks when rules become true.
- **Loading:** Skeleton or spinner during username check and register/login; disable submit while loading.
- **Accessibility:** Labels for inputs; ensure eye toggle is focusable and has `accessibilityLabel`.
- **Empty states:** Clear CTAs; “Skip” for profile picture.

---

### 2.9 API call order (registration flow)

1. **Step 2:** `GET /users/check-username?username={value}` (debounced).
2. **Step 3 (submit):** `POST /users/register` with full payload.
3. **Step 4:** `POST /users/profile/picture` (if user adds photo) or skip.

---

### 2.10 TypeScript types (summary)

```ts
interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  phone_number?: string;
  account_type: "buyer" | "seller";
  buyer_data?: { buyername: string; shipping_address?: Record<string, unknown> };
  seller_data?: {
    shop_name: string;
    description: string;
    category_ids: number[];
    policies?: Record<string, unknown>;
  };
}

interface UsernameCheckResponse {
  available: boolean;
  message: string;
}

interface LoginPayload {
  email: string;
  password: string;
  account_type?: "buyer" | "seller";
}
```

---

## Part 3: Quick reference

| Purpose | Method | Path |
|---------|--------|------|
| Register | POST | `/users/register` |
| Check username | GET | `/users/check-username?username=` |
| Login | POST | `/users/login` |
| Profile picture | POST | `/users/profile/picture` (multipart) |
| Categories | GET | `/categories` |
| Email verification send | POST | `/users/email-verification/send` |
| Email verification verify | POST | `/users/email-verification/verify` |
