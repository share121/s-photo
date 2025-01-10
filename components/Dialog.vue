<template>
  <slot />
</template>

<script lang="ts" setup>
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

const dialog = useDialog();
const notification = useNotification();
window.onerror = (message, source, lineno, colno, error) => {
  notification.error({
    title: "错误",
    content: `${message}\n\n脚本 URL：${source}\n行号：${lineno}\n列号：${colno}\n错误对象：${error}`,
    duration: 3000,
    keepAliveOnHover: true,
  });
};
window.onunhandledrejection = (event) => {
  notification.error({
    title: "未捕获的异常",
    content: event.reason + "",
    duration: 3000,
    keepAliveOnHover: true,
  });
};
console.error = (message) => {
  notification.error({
    title: "错误",
    content: message + "",
    duration: 3000,
    keepAliveOnHover: true,
  });
};
console.warn = (message) => {
  notification.warning({
    title: "警告",
    content: message + "",
    duration: 3000,
    keepAliveOnHover: true,
  });
};
console.info = (message) => {
  notification.info({
    title: "提示",
    content: message + "",
    duration: 3000,
    keepAliveOnHover: true,
  });
};
console.debug = (message) => {
  notification.info({
    title: "调试",
    content: message + "",
    duration: 3000,
    keepAliveOnHover: true,
  });
};
console.log = (message) => {
  notification.info({
    title: "日志",
    content: message + "",
    duration: 3000,
    keepAliveOnHover: true,
  });
};

onMounted(async () => {
  const update = await check();
  let downloaded = 0;
  let contentLength = 0;
  if (update?.available) {
    dialog.info({
      title: "发现新版本",
      content: `版本：${update.currentVersion} -> ${update.version}
更新时间：${update.date}
更新内容：
${update.body ?? "修复了一些已知问题"}`,
      positiveText: "更新",
      negativeText: "取消",
      onPositiveClick: async () => {
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength!;
              console.log(
                `started downloading ${event.data.contentLength} bytes`
              );
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              console.log(`downloaded ${downloaded} from ${contentLength}`);
              break;
            case "Finished":
              console.log("download finished");
              break;
          }
        });
        await relaunch();
      },
    });
  }
});
</script>
