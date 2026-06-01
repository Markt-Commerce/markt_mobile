/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  content: ["./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
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
        error: "#ba1a1a",
        success: "#178b1f",
        "error-bg": "#ffdad6",
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
        "card": "16px",
        "section": "24px",
      },
      borderRadius: {
        "sm": "8px",
        DEFAULT: "8px", // Standard border radius
        "md": "8px",
        "lg": "8px",
        "xl": "8px",
        "full": "8px",

        // Old compatibility
        "card": "8px",
        "button": "8px",
      },
      fontFamily: {
        geist: ["Geist", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        // Level 2 (Interactive/Floating)
        'level-2': '0px 10px 30px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
