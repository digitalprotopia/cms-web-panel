import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        base: "0.9375rem",
      },
      colors: {
        cms: {
          primary: "#0066FF",
          gray: {
            light: "#EBEBEB",
            DEFAULT: "#CCCCCC",
            dark: "#666666",
          },
          secondary: "#dae5f4",
          tertiary: "#687B98",
        },
      },
    },
  },
  plugins: [],
};
export default config;
