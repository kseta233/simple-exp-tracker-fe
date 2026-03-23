import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        accent: "#ea580c",
        pine: "#14532d"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

