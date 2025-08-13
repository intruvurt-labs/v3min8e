import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Cyberpunk colors
        "cyber-green": "hsl(var(--cyber-green))",
        "cyber-blue": "hsl(var(--cyber-blue))",
        "cyber-orange": "hsl(var(--cyber-orange))",
        "cyber-purple": "hsl(var(--cyber-purple))",
        "cyber-grid": "hsl(var(--cyber-grid))",
        "cyber-glow": "hsl(var(--cyber-glow))",
        "matrix-green": "hsl(var(--matrix-green))",
        "electric-blue": "hsl(var(--electric-blue))",
        "neon-orange": "hsl(var(--neon-orange))",
        "dark-bg": "hsl(var(--dark-bg))",
        "darker-bg": "hsl(var(--darker-bg))",
        "grid-line": "hsl(var(--grid-line))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Monaco",
          "Cascadia Code",
          "Roboto Mono",
          "monospace",
        ],
        cyber: ["Orbitron", "Exo 2", "Rajdhani", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "cyber-scan": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "grid-glow": {
          "0%": { opacity: "0.3", filter: "brightness(1)" },
          "100%": { opacity: "0.8", filter: "brightness(1.5)" },
        },
        "data-flow": {
          "0%": { transform: "translateX(-100%) translateY(0)" },
          "100%": { transform: "translateX(100vw) translateY(-20px)" },
        },
        "pulse-glow": {
          "0%": { boxShadow: "0 0 5px currentColor" },
          "100%": { boxShadow: "0 0 20px currentColor, 0 0 30px currentColor" },
        },
        "circuit-flow": {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        "electric-current": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        "matrix-rain": {
          "0%": { transform: "translateY(-100vh)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "cyber-scan": "cyber-scan 2s linear infinite",
        "grid-glow": "grid-glow 3s ease-in-out infinite alternate",
        "data-flow": "data-flow 4s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite alternate",
        "circuit-flow": "circuit-flow 5s linear infinite",
        "electric-current": "electric-current 1.5s ease-in-out infinite",
        "matrix-rain": "matrix-rain 10s linear infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
