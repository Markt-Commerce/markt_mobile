# What YOU need to set up — Google & Apple sign-in

Everything the code needs is already written. What remains is in two consoles
you own, and nobody but you can do it: it needs your Google account and your
Apple Developer membership.

Work top to bottom. Each step says exactly where the value it produces goes.

**Before you start, two hard constraints:**

| | |
|---|---|
| **Paid Apple Developer account** | **Required** for Sign in with Apple — $99/yr. There is no free path. |
| **Physical iOS device or a simulator signed into an Apple ID** | **Required** to test Apple sign-in. It cannot be tested on Android at all. |
| **A development build** | **Required for both.** Google and Apple sign-in are native modules and **do not work in Expo Go**. `npx expo run:ios` / `run:android`, or an EAS dev build. |

Your identifiers, already in `app.json`:

- **iOS bundle identifier:** `com.marktcommerce.markt`
- **Android package name:** `com.marktcommerce.markt`

---

## Part 1 — Google Cloud Console

### 1.1 Create the project and consent screen
1. Go to <https://console.cloud.google.com/> → create a project (or pick one).
2. **APIs & Services → OAuth consent screen**.
3. User type **External** → Create.
4. Fill: app name (`Markt`), your support email, developer contact email.
5. Scopes: the defaults are enough — `email`, `profile`, `openid`. **Do not add
   more.** Extra scopes trigger Google verification and give you access you do
   not need.
6. While testing, add your own Google account under **Test users**.

### 1.2 Create THREE OAuth client IDs
**APIs & Services → Credentials → Create credentials → OAuth client ID.** You
need all three. This is the part people get wrong.

| Type | Fill in | Produces |
|---|---|---|
| **Web application** | Name: `Markt Web`. No redirect URIs needed. | `GOOGLE_WEB_CLIENT_ID` |
| **iOS** | Bundle ID: `com.marktcommerce.markt` | `GOOGLE_IOS_CLIENT_ID` |
| **Android** | Package: `com.marktcommerce.markt` + SHA-1 (below) | `GOOGLE_ANDROID_CLIENT_ID` |

> **Why the Web client ID matters most.** It is what makes Google return an
> **`idToken`**. With only the platform client IDs you get an access token,
> which the backend cannot verify as an identity. The app passes it as
> `webClientId`, and the backend accepts all three as valid audiences because
> the `aud` in a token is the client ID of the platform that signed in.

### 1.3 Android SHA-1 fingerprints
Android client IDs are bound to your signing certificate. You need **two** —
debug and release — or sign-in works on your machine and fails in production.

**Debug** (works today, for local builds):
```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
```
Copy the `SHA1:` line.

**Release** — you build with EAS, so Expo holds the keystore:
```bash
eas credentials -p android
```
Choose your project → **Keystore** → it prints the SHA-1 and SHA-256.

Add **both** SHA-1 values to the *same* Android OAuth client (Credentials → your
Android client → add fingerprint). One client, two fingerprints.

### 1.4 The iOS URL scheme
Open your **iOS** client ID. It looks like:
```
123456789-abcdefg.apps.googleusercontent.com
```
The URL scheme is that **reversed**:
```
com.googleusercontent.apps.123456789-abcdefg
```
Put it in `app.json`, replacing the placeholder:
```jsonc
["@react-native-google-signin/google-signin",
 { "iosUrlScheme": "com.googleusercontent.apps.123456789-abcdefg" }]
```

---

## Part 2 — Apple Developer

All at <https://developer.apple.com/account/> → **Certificates, Identifiers &
Profiles**.

### 2.1 Your Team ID
Top right of the developer portal, or **Membership details**. Ten characters,
e.g. `A1B2C3D4E5`. → `APPLE_TEAM_ID`

### 2.2 App ID with the capability
1. **Identifiers → +** → **App IDs** → **App**.
2. Bundle ID: **Explicit** → `com.marktcommerce.markt`
3. Under **Capabilities**, tick **Sign in with Apple**. ← the step that is
   easy to miss; without it the native sheet fails at runtime.
4. Save.

→ `APPLE_BUNDLE_ID=com.marktcommerce.markt`

### 2.3 Services ID
Only needed if you ever add web or Android Apple sign-in. **Create it anyway** —
it costs nothing and saves a round trip later.

1. **Identifiers → +** → **Services IDs**.
2. Description `Markt Sign In`, Identifier `com.marktcommerce.markt.signin`.
3. Enable **Sign in with Apple** → **Configure** → primary App ID = the one
   above.

→ `APPLE_SERVICES_ID=com.marktcommerce.markt.signin`

### 2.4 The Sign in with Apple key (.p8)
1. **Keys → +**.
2. Name `Markt Sign In Key`, tick **Sign in with Apple**, **Configure** →
   primary App ID as above.
3. **Register** → **Download**. You get `AuthKey_XXXXXXXXXX.p8`.

> **You can only download this once.** Apple will not let you re-download it.
> Lose it and you create a new key.

- The **Key ID** is the `XXXXXXXXXX` in the filename → `APPLE_KEY_ID`
- Store the `.p8` in your password manager or secret store. **Never commit it.**

> **Note on the .p8 for *this* implementation.** Markt verifies Apple identity
> tokens against Apple's **public** JWKS, which needs no private key. The `.p8`
> is only required if you later add server-to-server calls — token revocation,
> or the "user deleted their Apple account" webhook. Create and store it now;
> `APPLE_KEY_ID` / `APPLE_TEAM_ID` are recorded for that future work.

---

## Part 3 — Environment variables

### `markt_python` (`.env`)
```bash
GOOGLE_WEB_CLIENT_ID=123456789-web.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=123456789-ios.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=123456789-android.apps.googleusercontent.com

APPLE_BUNDLE_ID=com.marktcommerce.markt
APPLE_SERVICES_ID=com.marktcommerce.markt.signin
```
All three Google IDs are accepted as audiences. **Leave one out and sign-in
from that platform fails**, because the `aud` in its token will not match.

> Blank values are safe by design: social sign-in returns **503** rather than
> silently trusting any token.

### `markt_mobile` (`.env`)
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ios.apps.googleusercontent.com
```
These are **not secrets** — an OAuth client ID ships inside every app binary
regardless. Security comes from the backend's audience check, not from hiding
them. Apple needs nothing here: the native sheet uses the bundle ID.

For EAS builds, add them under `eas.json` → the profile's `env`, or as EAS
project secrets.

---

## Part 4 — Native config (already done)

Committed for you — listed so you can verify:

| File | Change |
|---|---|
| `app.json` | `ios.usesAppleSignIn: true` — adds the Apple entitlement |
| `app.json` | plugins: `expo-apple-authentication`, `expo-secure-store`, `@react-native-google-signin/google-signin` |
| `app.json` | `iosUrlScheme` — **you must replace the placeholder** (step 1.4) |

**You only need to touch step 1.4.** Everything else is in place. There is no
manual `Info.plist` or Gradle edit: Expo's config plugins generate them at
prebuild.

---

## Part 5 — Order of operations

1. [ ] Google: project + consent screen (1.1)
2. [ ] Google: **Web** client ID (1.2)
3. [ ] Google: **iOS** client ID (1.2)
4. [ ] Get debug **and** release SHA-1 (1.3)
5. [ ] Google: **Android** client ID with both fingerprints (1.2 + 1.3)
6. [ ] Put the reversed iOS client ID into `app.json` (1.4)
7. [ ] Apple: note Team ID (2.1)
8. [ ] Apple: App ID **with Sign in with Apple ticked** (2.2)
9. [ ] Apple: Services ID (2.3)
10. [ ] Apple: `.p8` key → store safely (2.4)
11. [ ] Fill `markt_python/.env` (Part 3)
12. [ ] Fill `markt_mobile/.env` (Part 3)
13. [ ] Run the backend migration: `flask db upgrade`
14. [ ] Build a **dev build** — *not Expo Go*:
      `npx expo run:ios` / `npx expo run:android`
15. [ ] Test each flow (Part 6)

---

## Part 6 — Testing / QA checklist

### Google — Android
- [ ] Tap **Continue with Google** → account sheet appears
- [ ] Pick an account → lands in the app, signed in
- [ ] Kill and reopen → still signed in (token came from SecureStore)
- [ ] Tap Google, then **dismiss the sheet** → returns quietly, **no error**
- [ ] Airplane mode → *"You appear to be offline…"*, never a raw error
- [ ] Sign out → sign in again → same account, no duplicate

### Google — iOS
- [ ] Same as above (needs the URL scheme from 1.4 — if the sheet opens and
      immediately closes, that value is wrong)

### Apple — iOS only *(physical device or simulator signed into an Apple ID)*
- [ ] Button appears **only on iOS**; absent on Android
- [ ] Face/Touch ID sheet appears
- [ ] **First** sign-in: choose **Share My Email** → lands in the app
- [ ] Name is prefilled on the next screen *(Apple sends it once — only ever
      on the very first authorisation)*
- [ ] **Second** sign-in: no name from Apple, and the app does not ask again
- [ ] Test **Hide My Email** on a second Apple ID → a `@privaterelay.appleid.com`
      account is created and works
- [ ] Cancel the sheet → returns quietly, no error
- [ ] To re-test the *first-time* path: **Settings → your name → Sign-In &
      Security → Sign in with Apple → Markt → Stop using Apple ID**

### Account linking
- [ ] Register `you@gmail.com` with a **password**, sign out
- [ ] Sign in with **Google** on that same address → links silently, same
      account, no duplicate *(Google marks it verified)*
- [ ] Confirm one row in `social_accounts` and still one row in `users`

### Onboarding
- [ ] **Browse first** → real products load without an account
- [ ] Offline on browse → *"Can't load products"* + a working **Try again**
- [ ] New user: name → role → in the app (buyer), or → shop name (seller)
- [ ] Seller: **"I'll do this later"** still gets you in
- [ ] Swipe back from the app after finishing → **cannot** re-enter onboarding
- [ ] Step dots show 1-of-2 then 2-of-2

### Accessibility
- [ ] VoiceOver / TalkBack reads each button's purpose
- [ ] iOS **Settings → Accessibility → Larger Text** at max — nothing clipped
- [ ] Every tappable target ≥ 44pt

---

## If something breaks

| Symptom | Cause |
|---|---|
| `DEVELOPER_ERROR` on Android | SHA-1 missing or wrong. Release builds need the **EAS** fingerprint, not the debug one. |
| Google sheet opens then closes instantly (iOS) | `iosUrlScheme` in `app.json` is wrong — it must be the **reversed** iOS client ID. |
| Backend returns **503** | The client IDs are not set in `markt_python/.env`. Deliberate: it refuses rather than trusting any token. |
| Backend returns **401** `OAUTH_BAD_AUDIENCE` | The token's `aud` is not in your env. Usually the platform's client ID is missing. |
| Apple button missing on iOS | `usesAppleSignIn` not applied — you are on Expo Go, or need a rebuild. |
| Apple sign-in fails at the sheet | **Sign in with Apple** capability not ticked on the App ID (2.2). |
| **409** on social sign-in | Working as designed: that email is a password account and the provider did not verify the address. Sign in with the password once to link. |
