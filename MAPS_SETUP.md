# Google Maps key

## The two environment variables

```
GOOGLE_MAPS_API_KEY_ANDROID
GOOGLE_MAPS_API_KEY_IOS
```

Set both as **EAS secrets** — Expo dashboard → your project → *Secrets*, or:

```bash
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY_ANDROID --value AIza...
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY_IOS     --value AIza...
```

For a local dev build, put them in `.env` or export them before `npx expo run:android`.

**No `EXPO_PUBLIC_` prefix.** That prefix inlines a value into the JavaScript
bundle. These are read by `app.config.js` at build time and written into the
native config, which is where the Maps SDK looks for them. Prefixing them
would put the key in the JS bundle for no benefit.

**Two keys, not one.** Google's application restrictions are per-platform:
an Android key is locked to a package name plus signing certificate, an iOS
key to a bundle identifier. One key covering both would have to be
unrestricted — which is exactly the configuration that turns a leaked key
into somebody else's bill.

| | value |
|---|---|
| Android package | `com.marktcommerce.markt` |
| iOS bundle id | `com.marktcommerce.markt` |

## Creating the keys

1. **Cloud Console → APIs & Services → Credentials → Create credentials → API key.** Twice, one per platform.
2. **Library:** enable **Maps SDK for Android** and **Maps SDK for iOS**. Nothing else. Those two bill at **$0 with unlimited loads**; Geocoding, Places and Directions are the ones that cost per request and we do not use them.
3. **Restrict each key.** *Application restrictions* → Android apps (package + SHA-1) on one, iOS apps (bundle id) on the other. *API restrictions* → restrict to the single SDK that key is for.
4. **Quotas** (APIs & Services → Quotas): set a daily cap on each SDK. Past it, calls fail rather than bill.
5. **Budget alert** (Billing → Budgets & alerts): a low monthly budget with alerts at 50/90/100%.

Get the Android SHA-1 with `eas credentials`.

## What happens without a key

Everything builds and runs. `app.config.js` sets `extra.hasMapsKey: false`,
and every map surface checks it and falls back to a coordinate readout plus a
"use my location" button.

This matters more than it sounds: without a key, `react-native-maps` on
Android renders a **blank grey rectangle** rather than failing loudly, which
is indistinguishable from a crash. The fallback is there so a missing key
looks like a missing key.

## What we deliberately do not use

**Places Autocomplete.** It is what would make "Enter a new address" complete
a half-typed query properly, and it bills per request. Address search
currently runs on the phone's own geocoder via `expo-location`, which is free
and needs no key at all — it handles a real place name well and a fragment
poorly. Turning Places on is a costed decision, not a default.
