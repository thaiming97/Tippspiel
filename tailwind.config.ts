import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#0b6b3a",
          dark: "#074a28",
          light: "#12914f",
        },
        gold: {
          DEFAULT: "#f4b400",
          dark: "#c98f00",
          light: "#ffd45e",
        },
        // Helles Rasengrün als „Live"/Akzentfarbe.
        turf: {
          DEFAULT: "#34d27b",
          glow: "#5bf0a0",
        },
        // Stadion bei Nacht – Hintergrundtöne.
        night: {
          DEFAULT: "#06140d",
          800: "#0a1f14",
          700: "#0f2a1c",
          600: "#163a26",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "pitch-gradient":
          "linear-gradient(135deg, #074a28 0%, #0b6b3a 55%, #12914f 100%)",
        "gold-gradient": "linear-gradient(135deg, #ffd45e 0%, #f4b400 100%)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        // Karten „schweben" über dem dunklen Hintergrund.
        float:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 18px 40px -18px rgba(2,20,11,0.55), 0 8px 18px -12px rgba(2,20,11,0.4)",
        "card-hover":
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 28px 56px -20px rgba(2,20,11,0.6)",
        "glow-gold": "0 0 0 1px rgba(244,180,0,0.4), 0 8px 30px rgba(244,180,0,0.35)",
        "glow-turf": "0 8px 30px rgba(52,210,123,0.45)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.82)" },
        },
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.992)", filter: "blur(6px)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.3s ease-in-out infinite",
        "page-in": "page-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        rise: "rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2.6s linear infinite",
        "glow-pulse": "glow-pulse 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
