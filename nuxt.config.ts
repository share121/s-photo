import AutoImport from "unplugin-auto-import/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  // Enable SSG
  ssr: false,

  // Enables the development server to be discoverable by other devices when running on iOS physical devices
  devServer: { host: process.env.TAURI_DEV_HOST || "localhost" },

  css: ["~/assets/css/main.css"],

  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ["VITE_", "TAURI_"],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
    plugins: [
      AutoImport({
        imports: [
          {
            "naive-ui": [
              "useDialog",
              "useMessage",
              "useNotification",
              "useLoadingBar",
            ],
          },
          "pinia",
          "@vueuse/core",
        ],
        dts: true,
      }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: true,
      }),
    ],
  },
  piniaPluginPersistedstate: {
    storage: "localStorage",
  },
  modules: [
    "nuxtjs-naive-ui",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
  ],
});
