import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import {
  NaiveUiResolver,
  VueUseComponentsResolver,
  VueUseDirectiveResolver,
} from "unplugin-vue-components/resolvers";

// @ts-expect-error process 是 nodejs 的全局变量
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "@vueuse/core", "pinia", {
        "naive-ui": [
          "useDialog",
          "useMessage",
          "useNotification",
          "useLoadingBar",
        ],
      }],
      dts: true,
    }),
    Components({
      dts: true,
      resolvers: [
        NaiveUiResolver(),
        VueUseComponentsResolver(),
        VueUseDirectiveResolver(),
      ],
    }),
  ],

  // 为 Tauri 开发定制的 Vite 选项，仅在 `tauri dev` 或 `tauri build` 中应用
  //
  // 1. 防止 vite 遮蔽 rust 错误
  clearScreen: false,
  // 2. tauri 期望一个固定端口，如果该端口不可用则失败
  server: {
    port: 8080,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 8081,
      }
      : undefined,
    watch: {
      // 3. 告诉 vite 忽略监视 `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  esbuild: {
    drop: host && ["console", "debugger"],
  },
} as any));
