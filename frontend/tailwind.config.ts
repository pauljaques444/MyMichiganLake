import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WaterFront brand palette
        water: {
          50: "#eff8ff",
          100: "#dbeffe",
          200: "#bfe3fd",
          300: "#92d1fb",
          400: "#5eb6f7",
          500: "#3897f0",
          600: "#2279e5",
          700: "#1a62d2",
          800: "#1c4faa",
          900: "#1c4486",
        },
        dock: {
          50: "#fdf8ee",
          100: "#f8edd4",
          200: "#f0d8a3",
          300: "#e7bc6a",
          400: "#dfa040",
          500: "#d68729",
          600: "#bc6920",
          700: "#9c4f1e",
          800: "#7e3f1f",
          900: "#67351c",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
