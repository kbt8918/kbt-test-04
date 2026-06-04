/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 디자인스타일가이드 v1.0 — 안심맵 포레스트 그린 컬러 시스템
        brand: {
          DEFAULT: "#2E7D32", // Forest Green (Primary)
          dark: "#1B5E20", // Deep Forest
          mint: "#4CAF50", // Mint Green (Accent)
          light: "#E8F5E9", // Soft Mint (Background)
        },
        danger: {
          DEFAULT: "#D32F2F", // Crimson Red (SOS)
          light: "#FFEBEE", // Soft Red
        },
        info: "#1976D2",
        g: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          400: "#BDBDBD",
          500: "#9E9E9E",
          600: "#757575",
          700: "#616161",
          800: "#424242",
          900: "#212121",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
        mono: ["Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        // 시니어 UX: 최소 18px 기준 (대시보드 제외)
        base: ["18px", "1.6"],
      },
      minHeight: { touch: "48px" },
      minWidth: { touch: "48px" },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.05)",
        sheet: "0 8px 24px rgba(0,0,0,0.25)",
        sos: "0 8px 24px rgba(211,47,47,0.4)",
      },
      keyframes: {
        "sos-pulse": {
          "0%": { boxShadow: "0 8px 24px rgba(211,47,47,.4), 0 0 0 0 rgba(211,47,47,.45)" },
          "70%": { boxShadow: "0 8px 24px rgba(211,47,47,.4), 0 0 0 28px rgba(211,47,47,0)" },
          "100%": { boxShadow: "0 8px 24px rgba(211,47,47,.4), 0 0 0 0 rgba(211,47,47,0)" },
        },
        throb: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.14)" } },
        "slide-in": { from: { transform: "translateX(22px)" }, to: { transform: "translateX(0)" } },
        "sheet-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "dim-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "marker-drop": {
          "0%": { transform: "translateY(-14px)" },
          "60%": { transform: "translateY(3px)" },
          "100%": { transform: "translateY(0)" },
        },
        "ping-ring": { "0%": { transform: "scale(.6)", opacity: ".7" }, "100%": { transform: "scale(2.4)", opacity: "0" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "flash-red": { "0%,100%": { opacity: ".15" }, "50%": { opacity: ".35" } },
      },
      animation: {
        "sos-pulse": "sos-pulse 2s infinite",
        throb: "throb 1s ease-in-out infinite",
        "slide-in": "slide-in .3s cubic-bezier(.4,0,.2,1) both",
        "sheet-up": "sheet-up .32s cubic-bezier(.4,0,.2,1)",
        "dim-in": "dim-in .2s ease",
        "marker-drop": "marker-drop .5s cubic-bezier(.3,1.2,.5,1) both",
        "ping-ring": "ping-ring 2s ease-out infinite",
        shimmer: "shimmer 1.4s infinite",
        "flash-red": "flash-red 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
