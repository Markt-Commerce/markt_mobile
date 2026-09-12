/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  // theme/ is scanned too: theme/tone.ts maps order statuses to chip classes,
  // and without it Tailwind never saw `text-warning-text`, so the "attention"
  // status chip rendered with no text colour at all.
  content: [
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./theme/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Kinetic Minimalist Design System Colors
        primary: "#E94C2A",
        secondary: "#000000",
        surface: "#F4F4F5",
        "surface-dim": "#D4D4D8",
        border: "#E4E4E7", // Level 1 (Card/Surface) border
        background: "#FFFFFF",
        tertiary: "#71717A",

        // Semantic/Fallback (adapted for the new theme)
        "primary-muted": "#FDF2EF",
        "text-primary": "#000000",
        "text-secondary": "#71717A",
        "text-muted": "#A1A1AA",
        "bg-muted": "#F4F4F5",
        "bg-elevated": "#FFFFFF",
        "border-light": "#F4F4F5",
        // The other vocabulary. 374 uses across the app referred to these
        // rather than to raw hex, so rather than rewrite every one they now
        // alias the semantic tokens — which converges both vocabularies on one
        // set of values and makes those uses theme-aware for free.
        //
        // They resolve correctly in *both* themes, not just dark: "dark-text"
        // means "the primary text colour", and in light mode that is #09090B.
        // The names are legacy; the behaviour is right.
        "dark-page": "var(--c-surface-page)",
        "dark-surface": "var(--c-surface-raised)",
        "dark-elevated": "var(--c-surface-sunken)",
        "dark-border": "var(--c-border)",
        "dark-border-strong": "var(--c-border-strong)",
        "dark-text": "var(--c-text-primary)",
        "dark-muted": "var(--c-text-secondary)",
        error: "#ba1a1a",
        success: "#178b1f",
        "error-bg": "#ffdad6",

        // Semantic tokens, generated from theme/tokens.ts — each resolves to a
        // CSS variable that flips with the .dark class.
        //
        // Spread LAST on purpose. It shadows the flat legacy names above that
        // share a key -- border, primary, text-primary, text-secondary,
        // text-muted, success -- which means every existing use of those
        // classes becomes theme-aware without touching a single component.
        // That's the point: those names were already semantic, they just
        // pointed at one fixed light-mode value.
        ...require("./theme/colors.generated.js"),
      },
      spacing: {
        base: "8px",
        xs: "4px",
        sm: "12px",
        md: "24px",
        lg: "48px",
        xl: "80px",
        gutter: "24px",
        "margin-mobile": "16px",
        "margin-desktop": "64px",

        // Old spacing compatibility
        "screen-x": "16px",
        card: "16px",
        section: "24px",
      },
      // The whole scale used to be 8px, `full` included — so every
      // `rounded-full` in the app (74 of them: avatars, chips, pills, the
      // code input) rendered as an 8px rounded square. Avatar only looked
      // right because it sets borderRadius as an inline style and never went
      // through this.
      //
      // DEFAULT stays 8px: 444 uses of plain `rounded` are load-bearing and
      // this is not the change to move them in. The named steps get real
      // values, which is what they were always being written to mean.
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px", // Standard border radius
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px",
        full: "9999px",

        // Old compatibility
        card: "8px",
        button: "8px",
      },
      boxShadow: {
        // Level 2 (Interactive/Floating)
        "level-2": "0px 10px 30px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
