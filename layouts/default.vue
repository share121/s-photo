<script setup lang="ts">
import { darkTheme, lightTheme, zhCN, dateZhCN } from "naive-ui";

const isDark = ref(true);
isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => (isDark.value = e.matches));
</script>

<template>
  <n-config-provider
    :theme="isDark ? darkTheme : lightTheme"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <n-global-style />
    <n-notification-provider>
      <n-dialog-provider>
        <ClientOnly>
          <Dialog>
            <slot></slot>
          </Dialog>
        </ClientOnly>
      </n-dialog-provider>
    </n-notification-provider>
  </n-config-provider>
</template>
