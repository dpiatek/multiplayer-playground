/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/index.html", "./app/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    {
      pattern: /bg-(.*)-200/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        source: "'Source Code Pro', monospace",
      },
    },
  },
  plugins: [],
};
