import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      bg: "var(--bg)",
      surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)", 3: "var(--surface-3)" },
      line: { DEFAULT: "var(--line)", strong: "var(--line-strong)" },
      ink: { DEFAULT: "var(--ink)", 2: "var(--ink-2)", 3: "var(--ink-3)", on: "var(--on-ink)" },
      accent: {
        DEFAULT: "var(--accent)",
        hover: "var(--accent-hover)",
        soft: "var(--accent-soft)",
        ink: "var(--accent-ink)",
      },
      danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
      success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
      warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)" },
      mike: { DEFAULT: "var(--mike)", soft: "var(--mike-soft)" },
      emma: { DEFAULT: "var(--emma)", soft: "var(--emma-soft)" },
      bob: { DEFAULT: "var(--bob)", soft: "var(--bob-soft)" },
      alex: { DEFAULT: "var(--alex)", soft: "var(--alex-soft)" },
    },
    fontFamily: {
      sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      mono: ["var(--font-mono)", "ui-monospace", "monospace"],
    },
    fontSize: {
      xs: ["12px", { lineHeight: "16px" }],
      sm: ["13px", { lineHeight: "18px" }],
      base: ["14px", { lineHeight: "21px" }],
      md: ["15px", { lineHeight: "22px" }],
      lg: ["17px", { lineHeight: "24px" }],
      xl: ["20px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
      "2xl": ["24px", { lineHeight: "30px", letterSpacing: "-0.015em" }],
      display: ["44px", { lineHeight: "48px", letterSpacing: "-0.01em" }],
      "display-lg": ["60px", { lineHeight: "62px", letterSpacing: "-0.015em" }],
    },
    borderRadius: {
      none: "0",
      sm: "8px",
      DEFAULT: "10px",
      md: "12px",
      lg: "16px",
      xl: "24px",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
      sm: "var(--shadow-sm)",
      md: "var(--shadow-md)",
      lg: "var(--shadow-lg)",
    },
    extend: {
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
      keyframes: {
        breathe: { "0%,100%": { opacity: "0.35" }, "50%": { opacity: "1" } },
        rise: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        breathe: "breathe 1.4s ease-in-out infinite",
        rise: "rise 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [animate],
};

export default config;
