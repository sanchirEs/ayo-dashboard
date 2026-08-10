/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ui-* scale (spacing / borderRadius): this app's <html> renders at
      // font-size: 62.5% (public/css/style.css:157, the Remos "1.4rem = 14px" template
      // convention), which shrinks every rem-based Tailwind utility app-wide to 62.5%
      // of its textbook size. 133 other files were built and eyeballed at that
      // shrunken scale, so the fix here is scoped, not global: these are NEW,
      // additively-named entries expressed in raw px (immune to the root font-size),
      // used only by components/product-form/** and the card/switch/radio-group/
      // accordion primitives it depends on. Everything else keeps using the existing
      // rem-based scale untouched. Prefix checked against every file in public/css/
      // for the literal substring "-ui-" — zero matches, so nothing here collides
      // with a Bootstrap or template utility class.
      //
      // Font sizes are NOT added here as named ui-xs/ui-sm/ui-base keys — verified via
      // `twMerge('text-ui-xs text-muted-foreground')` that tailwind-merge silently
      // drops a custom-named text-* size utility whenever a text-* colour utility
      // shares the same cn() call (it mis-disambiguates "ui-xs" as a colour token,
      // since Tailwind overloads the text- prefix for size, colour AND alignment, and
      // a custom suffix doesn't match its size heuristic). That is nearly every real
      // usage in this codebase. Tailwind's own arbitrary bracket syntax
      // (text-[12px]/text-[14px]/text-[16px], used directly at call sites) does not
      // have this problem — verified safe in combination with a trailing colour class
      // — so font sizes are fixed that way instead, not via a config-level scale.
      spacing: {
        "ui-0.5": "2px",
        "ui-1": "4px",
        "ui-1.5": "6px",
        "ui-2": "8px",
        "ui-2.5": "10px",
        "ui-3": "12px",
        "ui-4": "16px",
        "ui-5": "20px",
        "ui-6": "24px",
        "ui-9": "36px",
        "ui-10": "40px",
        "ui-20": "80px",
        "ui-24": "96px",
        "ui-28": "112px",
        "ui-96": "384px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "ui-sm": "4px",
        "ui-md": "6px",
        "ui-lg": "8px",
        "ui-xl": "12px",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
