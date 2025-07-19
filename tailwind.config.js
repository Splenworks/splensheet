/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme"
import plugin from "tailwindcss/plugin"
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      animation: {
        shimmer: "shimmer 5s infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("hocus", ["&:hover", "&:focus"])
      addVariant("both", ["&:before", "&:after"])
    }),
  ],
  darkMode: "selector",
}
