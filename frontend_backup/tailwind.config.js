/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        quantix: {
          bg: "#0d0f14",
          surface: "#12151c",
          card: "#1a1d27",
          border: "#2a2d3a",
          primary: "#4f8ef7",
          green: "#00d4a1",
          red: "#ff4d6d",
          amber: "#f5a623",
          text: "#e8eaf0",
          muted: "#6b7280",
        },
      },
      boxShadow: {
        "quantix-card": "0 18px 45px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};