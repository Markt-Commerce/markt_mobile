# QA checklist

Covers the onboarding, verification, Nigeria-correctness and location work.

**Requires a development build** — `npx expo run:ios` / `run:android`. Google
and Apple sign-in are native modules and do not run in Expo Go. In Expo Go the
app still starts and everything else here is testable; the two social buttons
are simply hidden.

---

## 1. Email verification (Resend)

Needs `RESEND_API_KEY` set on the backend.

- [ ] Sign up with a real address → a 6-digit code arrives
- [ ] Correct code → verified, flow continues
- [ ] **Wrong code ×5** → locked out, message names the wait
- [ ] Attempts remaining counts **down** in the message (4, 3, 2…)
- [ ] Lockout is per address: a second account is unaffected
- [ ] **Case doesn't bypass it** — `A@B.com` after 5 failures on `a@b.com` is still locked
- [ ] Resend immediately → refused with a cooldown message
- [ ] Resend 6× in an hour → refused
- [ ] Throttle returns **429**, never 500 *(check the network log)*
- [ ] Codes with a leading zero (`012345`) are accepted

## 2. No way back into completed auth

- [ ] Finish signup → **swipe from the left edge** (iOS) → cannot re-enter
- [ ] Finish signup → **hardware back** (Android) → cannot re-enter
- [ ] Mid-onboarding: from Role, back does **not** return to Name
- [ ] Seller: after "Open my shop", back does not return to shop setup
- [ ] Kill and reopen while signed in → lands in the app, not onboarding

## 3. Nigeria-correct defaults

- [ ] Phone field shows **+234** and the 🇳🇬 flag by default
- [ ] Placeholder is `0801 234 5678`, **not** `+1 (555) 000-0000`
- [ ] Typing `08012345678` validates
- [ ] **Pasting `+2348012345678`** (from Contacts/WhatsApp) validates
- [ ] Country picker changes the dial code and re-validates
- [ ] **Postal code is not required** — signup completes with it empty
- [ ] Postal placeholder reads "Optional", not `10001`
- [ ] Prices show ₦ with thousands separators (`₦15,000`, not `15000`)

## 4. Geocoding

The original bug: Street and City both showed "Lagelu".

- [ ] Use current location in a **peri-urban** area (e.g. Lagelu, Oyo)
- [ ] **Street and City never show the same word**
- [ ] The LGA lands in **City**, not Street
- [ ] Urban area (e.g. Ikeja) → street and city both correct and different
- [ ] A field with no data is **blank** rather than repeating another

## 5. Location-aware feed

- [ ] Header top-left shows the current area with a chevron
- [ ] No location set → reads "Set your location"
- [ ] Tap → picker opens
- [ ] **"Use my current location"** → permission prompt → area updates
- [ ] **Deny permission** → falls back to the area list, no dead end
- [ ] Pick an area → header updates and the feed **re-scopes**
- [ ] Choice survives an app restart
- [ ] Picker says it does **not** change the delivery address
- [ ] Skeletons show while the feed loads *(layout must not jump)*

### As a guest *(the important half)*
- [ ] Signed out → "Browse first" → catalogue loads
- [ ] Location switcher works **without an account**
- [ ] Changing area re-scopes the guest feed
- [ ] Choice survives a restart while still signed out

### The fallback ladder
- [ ] Set an area with sellers nearby → results, no notice
- [ ] Set a remote area → notice appears ("showing results up to 50 km away")
- [ ] Set an area with nothing at all → **nationwide results, never empty**
- [ ] A distant result is never presented as though it were nearby

### Seller shop location *(what gives the feed data)*
- [ ] Sign up as a **seller** → "Set your shop location" on the shop screen
- [ ] Tap it → permission prompt → the area name appears
- [ ] Deny permission → no crash, shop still creatable without a location
- [ ] Finish → check `sellers.shop_latitude` is set for that account
- [ ] As a **buyer** near that shop → its products rank **nearby** with a distance
- [ ] Switch the browse area far away → the same products drop to a wider rung

> Before this, no seller could have a location at all — the columns existed but
> nothing wrote them — so the feed always served the nationwide rung.

## 6. Social sign-in *(dev build only)*

- [ ] Apple button on iOS only; absent on Android
- [ ] Google sheet opens, completes, lands in the app
- [ ] Cancel either sheet → returns quietly, **no error**
- [ ] Airplane mode → "You appear to be offline", never a raw error
- [ ] New social user → Name → Role → in the app
- [ ] Returning social user → straight in, no onboarding
- [ ] Social user is **not** asked to verify email (the provider did)

## 7. Theme and accessibility

- [ ] Toggle light/dark → **everything** switches, including tier badges
- [ ] **No blue** anywhere *(the old `#3A86FF` tier colour)*
- [ ] VoiceOver/TalkBack reads each control's purpose
- [ ] Larger Text at max → nothing clipped
- [ ] **Reduce Motion on** → illustrations render still and complete, skeletons
      stop pulsing, no springs
- [ ] Tap targets ≥ 44pt

## 8. Known gaps

- **Map-first picker not built** — needs a Maps key (see `SETUP_MAPS.md`).
  Current picker: use-my-location + an area list.
- **Nothing device-tested by me.** Everything above is verified by types, the
  theme checks, unit tests and HTTP-level runs against the real database.
