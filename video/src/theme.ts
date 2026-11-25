// Brand tokens, matching the app (theme/tokens.ts in the app: primary #E94C2A).
export const BRAND = {
  primary: "#E94C2A",
  primaryDeep: "#B8371B",
  ink: "#16110F",
  inkSoft: "#5B514D",
  paper: "#FFF7F3",
  paperWarm: "#FDEDE6",
};

// The app renders in the iOS system font (SF Pro); headless Chrome on macOS
// resolves system-ui to the same face. On Linux render hosts it falls back.
export const FONT = `system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif`;

// Optional: point this at a locally extracted Apple bezel PNG (portrait,
// iPhone 17 Pro) to use it instead of the drawn frame. Kept out of the repo:
// the Apple Design Resources licence does not allow redistributing it, and it
// limits use to mock-ups of apps that run only on Apple platforms -- check
// that your use is covered before switching it on.
export const APPLE_BEZEL: string | null = null;
