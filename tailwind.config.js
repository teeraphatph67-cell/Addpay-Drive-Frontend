/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // เพิ่ม fontFamily ที่นี่
      fontFamily: {
        itim: ['Itim', 'cursive', 'system-ui'],
        // หรือถ้าอยากตั้งเป็น default
        // sans: ['Itim', 'cursive', 'system-ui'],
      },
      
      keyframes: {
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeInSlow: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(40px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        gradientShift: "gradientShift 15s ease infinite",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        fadeInSlow: "fadeInSlow 1.4s ease-out forwards",
        slideUp: "slideUp 1s ease-out forwards",
      },
    },
  },
  plugins: [],
};