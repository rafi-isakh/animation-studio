import flowbite from 'flowbite-react/tailwind';
import scrollbarHide from 'tailwind-scrollbar-hide';
import flowbitePlugin from 'flowbite/plugin';
import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite/**/*.js",
    flowbite.content(),
  ],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ["var(--font-pretendard)"],
        "pretendard-jp": ["var(--font-pretendard-jp)"],
        "pretendard-std": ["var(--font-pretendard-std)"], // Latin optimized
        sans: ["Arial", "sans-serif"],
        "gowun-batang": ["Gowun Batang", "serif"],
        "nanum-gothic": ["Nanum Gothic", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
    },
    keyframes: {
      enterFromBottom: {
        from: { opacity: 0, transform: "translateY(100%)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
      exitToBottom: {
        from: { opacity: 1, transform: "translateY(0)" },
        to: { opacity: 0, transform: "translateY(100%)" },
      },
    },
    animation: {
      enterFromBottom: "enterFromBottom 0.2s ease",
      exitToBottom: "exitToBottom 0.2s ease",
    },
    container: {
      center: true,
    },
  },
  plugins: [
    flowbitePlugin,
    scrollbarHide,
    tailwindcssAnimate,
    flowbite.plugin(),
    function ({ addUtilities }) {
      const newUtilities = {
        ".nanum-gothic": {
          fontFamily: '"Nanum Gothic", sans-serif',
          fontWeight: "400",
          fontStyle: "normal",
        },
        ".nanum-gothic-bold": {
          fontFamily: '"Nanum Gothic", sans-serif',
          fontWeight: "700",
          fontStyle: "normal",
        },
        ".nanum-gothic-extrabold": {
          fontFamily: '"Nanum Gothic", sans-serif',
          fontWeight: "800",
          fontStyle: "normal",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
