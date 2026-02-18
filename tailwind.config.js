/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Markt brand & semantic colors (docs/DESIGN_SYSTEM.md)
        primary: "#e26136",
        "primary-muted": "#fff6f4",
        "text-primary": "#171311",
        "text-secondary": "#876d64",
        "text-muted": "#60758a",
        "bg-muted": "#f4f1f0",
        "bg-elevated": "#faf9f8",
        border: "#efe9e7",
        "border-light": "#f3efed",
        error: "#e9242a",
        success: "#178b1f",
        "error-bg": "#ffe8e9",
      },
      spacing: {
        // Base 4px scale for consistency
        "screen-x": "16px",
        "card": "16px",
        "section": "24px",
      },
      borderRadius: {
        "card": "16px",
        "button": "9999px",
      },
    },
  },
  plugins: [],
}
