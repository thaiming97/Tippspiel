import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marke „FF Entertainment" – Farben aus dem Logo.
        ff: {
          navy: "#1e3a5c",
          "navy-dark": "#15293f",
          orange: "#e8632e",
          "orange-dark": "#c74d1d",
          yellow: "#fbd34d",
          cream: "#fbf6ec",
        },
        // Farben der Antwort-Möglichkeiten (grün = passt, gold = wenn nötig).
        xmas: {
          pine: "#15654a",
          "pine-dark": "#0e4633",
          gold: "#dba63f",
        },
        // Tiefes Tinten-Grün für Text.
        ink: {
          DEFAULT: "#0c1f17",
          soft: "#46564e",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "ff-navy-gradient":
          "linear-gradient(145deg, #15293f 0%, #1e3a5c 55%, #2a4f79 100%)",
        "ff-orange-gradient":
          "linear-gradient(135deg, #f07a45 0%, #e8632e 55%, #c74d1d 100%)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,31,23,0.04), 0 6px 16px -8px rgba(12,31,23,0.12)",
        "card-hover":
          "0 2px 4px rgba(12,31,23,0.05), 0 20px 40px -16px rgba(12,31,23,0.22)",
      },
      keyframes: {
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Schneeflocken der weihnachtlichen Umfragen.
        "snow-fall": {
          "0%": { transform: "translate3d(0,-10%,0)", opacity: "0" },
          "10%": { opacity: "0.85" },
          "90%": { opacity: "0.6" },
          "100%": { transform: "translate3d(14px,62vh,0)", opacity: "0" },
        },
      },
      animation: {
        "page-in": "page-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        rise: "rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "snow-fall": "snow-fall 14s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
