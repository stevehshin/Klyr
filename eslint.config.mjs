import { defineConfig } from "eslint/config";

// Minimal config so build loads on Vercel (eslint-config-next ESM resolution can fail there).
// Run `npm run lint` locally for full Next.js rules.
export default defineConfig([
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"],
  },
]);
