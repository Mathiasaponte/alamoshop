// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Public (non-secret) backend values. .env is not tracked, so published builds
// could ship without them; fall back to these so the browser client always connects.
const PUBLIC_SUPABASE_URL = process.env["VITE_SUPABASE_URL"] || "https://lbhbmzmcpioqqgywoznx.supabase.co";
const PUBLIC_SUPABASE_KEY =
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "sb_publishable_x_mEueYQUm6hujEN7_UtVQ_DyYGoaYD";
const PUBLIC_SUPABASE_PROJECT_ID = process.env["VITE_SUPABASE_PROJECT_ID"] || "lbhbmzmcpioqqgywoznx";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(PUBLIC_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(PUBLIC_SUPABASE_KEY),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(PUBLIC_SUPABASE_PROJECT_ID),
    },
  },
});
