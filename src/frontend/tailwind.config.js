/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 디자인스타일가이드 v1.0 컬러 시스템
        primary: "#2563EB", // 신뢰 블루
        secondary: "#16A34A", // 따뜻한 그린
        sos: "#DC2626", // SOS 레드
      },
      fontSize: {
        // 시니어 UX: 최소 18px 기준
        base: ["18px", "1.6"],
      },
      minHeight: {
        touch: "48px", // 최소 터치 타깃 48px
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};
