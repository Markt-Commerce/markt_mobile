# Google Maps / Places — exactly what to set and how to restrict it

Answers your question directly: **the key goes in both places, and they are two
different keys.** Below is why, the exact variable names, and the Cloud Console
restrictions so you don't ship an unrestricted key.

---

## 1. Why two keys, not one

| Key | Used by | Restriction type |
|---|---|---|
| **Native SDK key(s)** | the map view rendered by `react-native-maps` | **Application** (bundle ID / package + SHA-1) |
| **Web-service key** | Geocoding + Places called over HTTPS from the app | **API** + optionally IP |

They cannot be the same key, because Google restricts them by *different
mechanisms*. An application-restricted key is rejected by the Geocoding web
service; an unrestricted key that works for both is exactly what you asked me
to help you avoid.

> **Recommended:** move Geocoding and Places **server-side** into `markt_python`
> and have the app call your backend. Then the web-service key never ships in a
> binary at all, and you can restrict it by *your server's IP*. I've written the
> mobile side so this is a one-line base-URL change if you want it later.

## 2. Variable names

### `markt_mobile` — native map SDK
These are read at **build time** by the Expo config plugin, so they belong in
`app.json`, **not** `.env`. Expo injects them into `Info.plist` and
`AndroidManifest.xml` at prebuild.

```jsonc
{
  "expo": {
    "ios":     { "config": { "googleMapsApiKey": "AIza…IOS_KEY" } },
    "android": { "config": { "googleMaps": { "apiKey": "AIza…ANDROID_KEY" } } }
  }
}
```

To keep them out of git, switch `app.json` → `app.config.js` and read
`process.env.*`. Say the word and I'll do that conversion — it is a small,
self-contained change.

### `markt_mobile` — web services (only if called from the app)
```bash
EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=
```
`EXPO_PUBLIC_*` is inlined into the bundle, so **this key is public**. That is
inherent, not a mistake — which is the reason to prefer the server-side option.

### `markt_python` — web services (recommended home)
```bash
GOOGLE_MAPS_SERVER_KEY=
```
Plain `.env`, never `EXPO_PUBLIC_`. Restricted by your server's IP.

## 3. APIs to enable

**APIs & Services → Library**, enable exactly these four:

| API | Why |
|---|---|
| **Maps SDK for Android** | the map view on Android |
| **Maps SDK for iOS** | the map view on iOS |
| **Geocoding API** | reverse-geocode the dragged pin → address + LGA |
| **Places API** | the "Search apartments, streets, places" box |

Enable nothing else. Every extra API is surface you are not using.

> Google requires a **billing account** even inside the free tier. Set a
> **budget alert** — the Places API is the one that surprises people.

## 4. Restrictions

### iOS SDK key
- **Application restrictions → iOS apps**
- Bundle ID: `com.marktcommerce.markt`
- **API restrictions → Maps SDK for iOS** only

### Android SDK key
- **Application restrictions → Android apps**
- Package: `com.marktcommerce.markt`
- SHA-1: **add both** —
  - debug: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
  - release: `eas credentials -p android`
- **API restrictions → Maps SDK for Android** only

*Same trap as the OAuth setup: one fingerprint means it works locally and fails
in production.*

### Web-service key
- **Application restrictions → IP addresses**, set to your backend's egress IP
  *(server-side — recommended)*
- or **None** if called from the app *(unavoidable; the key is in the bundle)*
- **API restrictions → Geocoding API + Places API** only

## 5. Order

1. [ ] Enable the four APIs
2. [ ] Create the iOS SDK key, restrict to the bundle ID
3. [ ] Create the Android SDK key, restrict to package + **both** SHA-1s
4. [ ] Create the web-service key, restrict to Geocoding + Places
5. [ ] Put the SDK keys in `app.json` (or `app.config.js`)
6. [ ] Put the web key in `markt_python/.env` as `GOOGLE_MAPS_SERVER_KEY`
7. [ ] Set a billing budget alert
8. [ ] Rebuild — **key changes are native config and need a rebuild**

## 6. If it breaks

| Symptom | Cause |
|---|---|
| Grey map, "For development purposes only" | Billing not enabled |
| Map blank on Android only | Wrong SHA-1, or Maps SDK for Android not enabled |
| `REQUEST_DENIED` from Geocoding | Application-restricted key used for a web service — that's the two-key split |
| Search box returns nothing | Places API not enabled |
