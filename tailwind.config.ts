import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sattes Fußball-Grün als Markenfarbe.
        pitch: {
          DEFAULT: "#0a7d4f",
          dark: "#075c3a",
          light: "#10a368",
        },
        // Vibrierendes Lime als Energie-Akzent (aktive Reiter, Highlights).
        lime: {
          DEFAULT: "#b8f23d",
          dark: "#9bd61f",
        },
        gold: {
          DEFAULT: "#f4b400",
          dark: "#c98f00",
          light: "#ffd45e",
        },
        // Tiefes Tinten-Grün für Text.
        ink: {
          DEFAULT: "#0c1f17",
          soft: "#46564e",
        },
        paper: "#f5f4ee",
        // Marke „FF Entertainment" (Farben aus dem Logo).
        ff: {
          navy: "#1e3a5c",
          "navy-dark": "#15293f",
          orange: "#e8632e",
          "orange-dark": "#c74d1d",
          yellow: "#fbd34d",
          cream: "#fbf6ec",
        },
        // Festliche Akzente der Weihnachts-Umfrage.
        xmas: {
          pine: "#15654a",
          "pine-dark": "#0e4633",
          gold: "#dba63f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "pitch-gradient": "linear-gradient(135deg, #075c3a 0%, #0a7d4f 60%, #10a368 100%)",
        "lime-gradient": "linear-gradient(135deg, #c8f96a 0%, #b8f23d 100%)",
        "gold-gradient": "linear-gradient(135deg, #ffd45e 0%, #f4b400 100%)",
        "ff-navy-gradient":
          "linear-gradient(145deg, #15293f 0%, #1e3a5c 55%, #2a4f79 100%)",
        "ff-orange-gradient":
          "linear-gradient(135deg, #f07a45 0%, #e8632e 55%, #c74d1d 100%)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,31,23,0.04), 0 6px 16px -8px rgba(12,31,23,0.12)",
        "card-hover": "0 2px 4px rgba(12,31,23,0.05), 0 20px 40px -16px rgba(12,31,23,0.22)",
        glow: "0 8px 30px rgba(184,242,61,0.55)",
        "glow-gold": "0 10px 36px rgba(244,180,0,0.5)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.82)" },
        },
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Ranglisten-Zeilen kippen gestaffelt von oben herein (Karten-Kaskade).
        "row-in": {
          "0%": { opacity: "0", transform: "translateY(-40px) rotateX(-32deg)" },
          "55%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0) rotateX(0)" },
        },
        // Fußball-Flut: Ball fällt von oben in die Karte, bleibt kurz, läuft ab.
        "ball-flood": {
          "0%": { transform: "translateY(-280%) rotate(0deg)", opacity: "0" },
          "12%": { opacity: "1" },
          "34%": { transform: "translateY(0) rotate(170deg)", opacity: "1" },
          "54%": { transform: "translateY(0) rotate(210deg)", opacity: "1" },
          "100%": { transform: "translateY(340%) rotate(560deg)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        // Neuer Platz 1: Pokal/Krone springt hervor.
        "leader-pop": {
          "0%": { transform: "scale(0.4) rotate(-18deg)", opacity: "0" },
          "55%": { transform: "scale(1.18) rotate(6deg)", opacity: "1" },
          "75%": { transform: "scale(0.94) rotate(-3deg)" },
          "100%": { transform: "scale(1) rotate(0)", opacity: "1" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0)", opacity: "1" },
          "100%": { transform: "translateY(120px) rotate(540deg)", opacity: "0" },
        },
        "ring-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(244,180,0,0.0)" },
          "50%": { boxShadow: "0 0 0 8px rgba(244,180,0,0.18)" },
        },
        // Schneeflocken der Weihnachtsseite: langsames Fallen mit Drift.
        "snow-fall": {
          "0%": { transform: "translate3d(0,-10%,0)", opacity: "0" },
          "10%": { opacity: "0.85" },
          "90%": { opacity: "0.6" },
          "100%": { transform: "translate3d(14px,62vh,0)", opacity: "0" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.3s ease-in-out infinite",
        "page-in": "page-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        rise: "rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "row-in": "row-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "ball-flood": "ball-flood 2.3s cubic-bezier(0.45, 0, 0.3, 1) both",
        shimmer: "shimmer 2.6s linear infinite",
        "leader-pop": "leader-pop 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "confetti-fall": "confetti-fall 1.1s ease-in forwards",
        "ring-glow": "ring-glow 2.2s ease-in-out infinite",
        "snow-fall": "snow-fall 14s linear infinite",
        twinkle: "twinkle 3.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
