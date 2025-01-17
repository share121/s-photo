<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";
import { readDir } from "@tauri-apps/plugin-fs";
import { chineseMap } from "~/utils/chinese-map";
import { extname, join } from "path-browserify";
import { FileState, useFilesStore } from "../stores/files";
import { convertFileSrc } from "@tauri-apps/api/core";

const store = useFilesStore();

async function openDialog() {
  const dir = await open({
    directory: true,
    recursive: true,
  });
  if (!dir) return;
  readDir(dir).then((entries) => {
    for (const entry of entries) {
      if (!entry.isFile) continue;
      const ext = extname(entry.name).toLowerCase();
      if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;
      store.files.push({
        dir,
        name: entry.name,
        state: FileState.wait,
        path: join(dir, entry.name),
        url: convertFileSrc(join(dir, entry.name)),
      });
    }
  });
}

onMounted(() => {
  window.addEventListener(
    "keydown",
    async (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? ""))
        return;
      const map: { [key: string]: () => Promise<void> | void } = {
        ArrowLeft: prevFile,
        ArrowRight: nextFile,
        ArrowUp: prevFile,
        ArrowDown: nextFile,
        q: selectFile,
        p: discardFile,
        z: cancelFile,
      };
      if (e.key in map) {
        e.preventDefault();
        e.stopPropagation();
        await map[e.key]();
      }
    },
    true
  );
});

function scrollToFile(index: number) {
  document
    .querySelector(`.file-list-item:nth-child(${index + 2})`)
    ?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
}

function prevFile() {
  if (!store.files.length) return;
  store.curIndex = Math.max(0, store.curIndex - 1);
  scrollToFile(store.curIndex);
}

function nextFile() {
  if (!store.files.length) return;
  store.curIndex = Math.min(store.files.length - 1, store.curIndex + 1);
  scrollToFile(store.curIndex);
}

function selectFile() {
  if (!store.curFile) return;
  store.curFile.state = FileState.select;
  nextFile();
}

function discardFile() {
  if (!store.curFile) return;
  store.curFile.state = FileState.discard;
  nextFile();
}

function cancelFile() {
  if (!store.curFile) return;
  let index = store.curIndex;
  for (; index >= 0; index--) {
    if (store.files[index].state !== FileState.wait) {
      store.curIndex = index;
      store.curFile.state = FileState.wait;
      scrollToFile(store.curIndex);
      return;
    }
  }
  store.curIndex = 0;
  scrollToFile(store.curIndex);
}

function switchFile(e: PointerEvent) {
  const index = (e.target as HTMLLIElement).dataset.index;
  if (!index) return;
  store.curIndex = parseInt(index);
  scrollToFile(store.curIndex);
}
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-header
      style="height: 64px; display: flex; align-items: center; padding: 0 16px"
      bordered
    >
      <n-h2 style="margin: 0">
        <template v-if="store.curFile?.name">
          {{ store.curFile.name }} ({{ store.curIndex + 1 }}/{{
            store.files.length
          }})
        </template>
        <template v-else>sPhoto</template>
      </n-h2>
      <n-space style="margin-left: auto">
        <n-button @click="selectFile">选用(Q)</n-button>
        <n-button @click="discardFile">弃用(P)</n-button>
        <n-button @click="cancelFile">撤销(Z)</n-button>
      </n-space>
    </n-layout-header>
    <n-layout position="absolute" style="top: 64px; bottom: 64px" has-sider>
      <n-layout-sider
        :native-scrollbar="false"
        bordered
        show-trigger="arrow-circle"
      >
        <n-list clickable hoverable @click="switchFile">
          <n-list-item>
            <n-h3 style="margin: 0">
              图片 ({{ store.files.length === 0 ? 0 : store.curIndex + 1 }}/{{
                store.files.length
              }})
            </n-h3>
          </n-list-item>
          <n-list-item
            v-for="[index, file] of store.files.entries()"
            class="file-list-item"
            :key="file.dir + '/' + file.name"
            :data-index="index"
            :class="{
              'file-list-item-selected': store.curIndex === index,
              ['file-' + file.state]: file.state !== FileState.wait,
            }"
          >
            <n-thing :title="file.name" :description="file.dir"></n-thing>
          </n-list-item>
          <n-list-item>
            <n-thing description="没有更多图片了"></n-thing>
          </n-list-item>
        </n-list>
      </n-layout-sider>
      <n-layout sider-placement="right" has-sider>
        <n-layout
          content-style="display: flex; align-items: center; justify-content: center;"
        >
          <n-button v-if="!store.files.length" @click="openDialog"
            >选择文件夹</n-button
          >
          <img
            ref="imgEl"
            class="img"
            v-else-if="store.curFile?.url"
            :src="store.curFile.url"
            :alt="store.curFile.name ?? '图片'"
          />
          <div v-else>选择图片以查看</div>
        </n-layout>
        <n-layout-sider
          :native-scrollbar="false"
          show-trigger="arrow-circle"
          bordered
        >
          <n-list hoverable>
            <n-list-item>
              <n-h3 style="margin: 0">EXIF 信息</n-h3>
            </n-list-item>
            <n-list-item v-if="!store.curTags?.length">
              <n-thing description="选择图片以查看 EXIF 信息"></n-thing>
            </n-list-item>
            <n-list-item v-else v-for="tag in store.curTags" :key="tag[0]">
              <n-thing
                :title="chineseMap[tag[0]] ?? tag[0]"
                :description="tag[1] + ''"
              ></n-thing>
            </n-list-item>
          </n-list>
        </n-layout-sider>
      </n-layout>
    </n-layout>
    <n-layout-footer
      position="absolute"
      style="height: 64px; padding: 24px"
      bordered
    >
      通过率：{{ (store.passRate * 100).toFixed(2) }}%
    </n-layout-footer>
  </n-layout>
</template>

<style>
.img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.file-list-item-selected {
  background-color: var(--n-merged-color-hover);
}
.file-select * {
  color: rgb(56, 136, 197) !important;
}
.file-discard * {
  color: rgb(208, 58, 83) !important;
}
.file-list-item * {
  pointer-events: none;
}
</style>
