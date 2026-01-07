/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
        border: "var(--color-border)", // Golden border
        input: "var(--color-input)", // Input background
        ring: "var(--color-ring)", // Focus ring - Divine gold
        background: "var(--color-background)", // Deep space canvas
        foreground: "var(--color-foreground)", // Warm off-white
        primary: {
          DEFAULT: "var(--color-primary)", // Divine gold
          foreground: "var(--color-primary-foreground)", // Deep space dark
        },
        secondary: {
          DEFAULT: "var(--color-secondary)", // Warm bronze
          foreground: "var(--color-secondary-foreground)", // White
        },
        destructive: {
          DEFAULT: "var(--color-destructive)", // Compassionate red
          foreground: "var(--color-destructive-foreground)", // White
        },
        muted: {
          DEFAULT: "var(--color-muted)", // Elevated surface
          foreground: "var(--color-muted-foreground)", // Muted warm gray
        },
        accent: {
          DEFAULT: "var(--color-accent)", // Celestial yellow
          foreground: "var(--color-accent-foreground)", // Dark surface
        },
        popover: {
          DEFAULT: "var(--color-popover)", // Popover background
          foreground: "var(--color-popover-foreground)", // Warm off-white
        },
        card: {
          DEFAULT: "var(--color-card)", // Card background
          foreground: "var(--color-card-foreground)", // Warm off-white
        },
        success: {
          DEFAULT: "var(--color-success)", // Gentle green
          foreground: "var(--color-success-foreground)", // Dark slate
        },
        warning: {
          DEFAULT: "var(--color-warning)", // Warm amber
          foreground: "var(--color-warning-foreground)", // Dark gray
        },
        error: {
          DEFAULT: "var(--color-error)", // Compassionate red
          foreground: "var(--color-error-foreground)", // White
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)", // 18px
        md: "var(--radius-md)", // 12px
        sm: "var(--radius-sm)", // 6px
        xl: "var(--radius-xl)", // 24px
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        caption: ["var(--font-caption)"],
        mono: ["var(--font-mono)"],
      },
      spacing: {
        xs: "var(--spacing-xs)", // 6px
        sm: "var(--spacing-sm)", // 12px
        md: "var(--spacing-md)", // 18px
        lg: "var(--spacing-lg)", // 24px
        xl: "var(--spacing-xl)", // 36px
        "2xl": "var(--spacing-2xl)", // 48px
        "3xl": "var(--spacing-3xl)", // 72px
        "4xl": "var(--spacing-4xl)", // 96px
        "5xl": "var(--spacing-5xl)", // 144px
      },
      boxShadow: {
        "glow-soft": "var(--glow-soft)",
        "glow-medium": "var(--glow-medium)",
        "glow-strong": "var(--glow-strong)",
        "glow-divine": "var(--glow-divine)",
      },
      keyframes: {
        "aurora-border": {
          "0%, 100%": { borderColor: "rgba(212, 175, 55, 0.3)" },
          "50%": { borderColor: "rgba(255, 229, 92, 0.5)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "aurora-border": "aurora-border 3s ease-in-out infinite",
        breathe: "breathe 2s ease-in-out infinite",
        "fade-in": "fade-in 0.25s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.25s ease-out",
      },
      transitionDuration: {
        DEFAULT: "250ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },
    },
  },
  plugins: [],
}