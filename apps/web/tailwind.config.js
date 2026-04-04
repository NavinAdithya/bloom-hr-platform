/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#0f766e",
          green: "#22c55e",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15,118,110,0.18)",
      },
      keyframes: {
        floatUp: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0px)", opacity: "1" },
        },
      },
      animation: {
        floatUp: "floatUp 520ms ease-out both",
      },
    },
  },
  plugins: [],
};

