import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "icons/*.png"],
      workbox: {
        // Never cache OAuth redirects
        navigateFallbackDenylist: [/^\/~oauth/],
        // Cache-first for static assets
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Network-first for Supabase API calls (dynamic content)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      manifest: {
        name: "SkillsMark",
        short_name: "SkillsMark",
        description: "South Africa's trusted skills development platform — connect talent, business, and funding.",
        start_url: "/dashboard",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f5f7fb",
        theme_color: "#159e8a",
        lang: "en-ZA",
        categories: ["education", "business", "productivity"],
        icons: [
          {
            src: "/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          {
            name: "My Dashboard",
            short_name: "Dashboard",
            description: "Go to your personal dashboard",
            url: "/dashboard",
            icons: [{ src: "/icons/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Browse Opportunities",
            short_name: "Opportunities",
            description: "Find skills opportunities near you",
            url: "/dashboard",
            icons: [{ src: "/icons/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
        screenshots: [
          {
            src: "/icons/screenshot-mobile.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
