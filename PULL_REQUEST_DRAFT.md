Keep going. And as for the decisions:

1. Palette: keep orange. Reproduce the green reference's spacing/radius/restraint in orange — don't switch hue. Migrate the six hardcoded colors out of gam_tier_config into the token system.
2. PostGIS: assume not available in production — keep the bounding-box + Haversine design swappable to ST_DWithin. (Change this line if you know prod has PostGIS.)
3. Maps key: Maps key: I'll set it in env. Tell me the exact var name(s) and whether it goes in .env, app.config/app.json, or both for Expo — and give me the Cloud Console restrictions to apply (bundle ID / package + SHA-1, which APIs to enable) so I don't ship an unrestricted key.
4. Location model: Option B approved, 10km first radius.
5. Correction on assets: don't use Lottie, but do build real illustrations as animated SVG/Reanimated (Skia if needed) derived from Markt's logo — empty states, landing hero, success moments. Use the logo's mark, shapes, and orange as the visual seed. No external asset files, nothing fabricated — draw them in code. Leave Lottie hooks only if it's genuinely cheaper to swap later.