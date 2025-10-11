import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 Couleurs principales
        primary: {
          DEFAULT: "#EA8B48", // Orange principal
          light: "#FCBE8D",
          softer: "#FFE3CF",
          dark: "#9D4C1D",
        },
        secondary: {
          DEFAULT: "#132F49", // Bleu marine principal
          100: "#D3E1EB",
          200: "#9BB6C6",
          300: "#7295AA",
          400: "#38546A",
          900: "#132F49",
        },

        // ❤️ Statuts & accentuations
        danger: "#CE0000",
        success: "#7DB06B",
        warning: "#FCBE8D",

        // ⚫ Neutres et gris
        neutral: {
          black: "#222221",
          dark: "#4C4C4C",
          DEFAULT: "#707070",
          light: "#B5B5B5",
          white: "#FFFFFF",
        },

        // 🔘 Alias pratiques
        black: "#000000",
        white: "#FFFFFF",
      },

      borderRadius: {
        none: "0",
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "Inter", "sans-serif"],
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },

      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      },

      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
}

export default config
