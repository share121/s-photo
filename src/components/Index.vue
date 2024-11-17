<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";
import { mkdir, readDir } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";
import { chineseMap } from "../chinese-map";
import { ImgFile, ImgState, ImgStateDir } from "../img-file";

const notification = useNotification();
onMounted(() => {
  window.onerror = (message, source, lineno, colno, error) => {
    notification.error({
      content: "全局错误",
      meta: `错误消息：${message}\n脚本 URL：${source}\n行号：${lineno}\n列号：${colno}\n错误对象：${error}`,
      duration: 3000,
      keepAliveOnHover: true,
    });
  };
  window.onunhandledrejection = (event) => {
    notification.error({
      content: "未捕获的异常",
      meta: event.reason + "",
      duration: 3000,
      keepAliveOnHover: true,
    });
  };
});

const dir = ref<string | null>(null);
const imgs = shallowReactive<ImgFile[]>([]);
const selectedImg: Ref<ImgFile | undefined> = shallowRef(undefined);
const curIndex = computed(() =>
  selectedImg.value ? imgs.indexOf(selectedImg.value) : -1
);

const showTags = asyncComputed(
  async () => selectedImg.value && (await selectedImg.value.getTags()),
  undefined,
  { lazy: true }
);
const curImgUrl = asyncComputed(
  async () => selectedImg.value && selectedImg.value.getUrl(),
  undefined,
  { lazy: true }
);

async function openDialog() {
  const dirpath = (dir.value = await open({ directory: true }));
  if (!dirpath) return;
  const entries = await readDir(dirpath);
  for (const e of Object.values(ImgStateDir)) {
    if (e !== ".") {
      try {
        await mkdir(await path.join(dirpath, e));
      } catch (e) {
        console.error(e);
      }
    }
  }
  entries
    .filter((e) => e.isFile)
    .forEach(async (entry) => {
      const ext = (await path.extname(entry.name)).toLowerCase();
      if (!["jpg", "jpeg", "png"].includes(ext)) return;
      imgs.push(new ImgFile(dirpath, entry.name));
    });
}

watch(
  imgs,
  (imgs) => {
    if (!selectedImg.value && imgs.length) selectedImg.value = imgs[0];
  },
  { deep: true }
);

onMounted(() => {
  window.addEventListener(
    "keydown",
    async (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? ""))
        return;
      const map: { [key: string]: () => Promise<void> | void } = {
        ArrowLeft: prevImg,
        ArrowRight: nextImg,
        ArrowUp: prevImg,
        ArrowDown: nextImg,
        q: selectImg,
        p: discardImg,
        z: cancelImg,
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

function prevImg() {
  if (!imgs.length) return;
  if (curIndex.value > 0) {
    selectedImg.value = imgs[curIndex.value - 1];
  } else if (curIndex.value === -1) {
    selectedImg.value = imgs[imgs.length - 1];
  }
  document
    .querySelector(`.img-list-item:nth-child(${curIndex.value + 2})`)
    ?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
}

function nextImg() {
  if (!imgs.length) return;
  if (curIndex.value < imgs.length - 1) {
    selectedImg.value = imgs[curIndex.value + 1];
  }
  document
    .querySelector(`.img-list-item:nth-child(${curIndex.value + 2})`)
    ?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
}

async function selectImg() {
  const img = selectedImg.value;
  nextImg();
  await img?.setState(ImgState.select);
}

async function discardImg() {
  const img = selectedImg.value;
  nextImg();
  await img?.setState(ImgState.discard);
}

async function cancelImg() {
  const img = selectedImg.value;
  if ((await img?.getState()) === ImgState.wait) {
    if (curIndex.value <= 0) return;
    prevImg();
    await cancelImg();
  } else await img?.setState(ImgState.wait);
}

const totalSelected = computed(
  () => imgs.filter((img) => img.state.value === ImgState.select).length
);
const totalDiscarded = computed(
  () => imgs.filter((img) => img.state.value === ImgState.discard).length
);
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-header
      style="height: 64px; display: flex; align-items: center; padding: 0 16px"
      bordered
    >
      <n-h2 style="margin: 0">{{
        selectedImg?.filename
          ? `${selectedImg.filename} (${curIndex + 1}/${imgs.length})`
          : "sPhoto"
      }}</n-h2>
      <n-space style="margin-left: auto">
        <n-button @click="selectImg">选用(Q)</n-button>
        <n-button @click="discardImg">弃用(P)</n-button>
        <n-button @click="cancelImg">撤销(Z)</n-button>
      </n-space>
    </n-layout-header>
    <n-layout position="absolute" style="top: 64px; bottom: 64px" has-sider>
      <n-layout-sider
        :native-scrollbar="false"
        bordered
        show-trigger="arrow-circle"
      >
        <n-list hoverable clickable>
          <n-list-item>
            <n-h3 style="margin: 0">
              图片 ({{ curIndex + 1 }}/{{ imgs.length }})
            </n-h3>
          </n-list-item>
          <n-list-item
            v-for="img of imgs"
            class="img-list-item"
            :key="img.dir + '/' + img.filename"
            @click="selectedImg = img"
            :class="{
              'img-list-item-selected': selectedImg === img,
              ['img-' + img.state.value]: true,
            }"
          >
            <n-thing :title="img.filename" :description="img.dir"></n-thing>
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
          <n-button v-if="!imgs.length" @click="openDialog"
            >选择文件夹</n-button
          >
          <img
            ref="imgEl"
            class="img"
            v-else-if="curImgUrl"
            :src="curImgUrl"
            :alt="selectedImg?.filename ?? '图片'"
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
            <n-list-item v-if="!showTags">
              <n-thing description="选择图片以查看 EXIF 信息"></n-thing>
            </n-list-item>
            <n-list-item v-else v-for="tag in showTags" :key="tag[0]">
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
      通过率：{{ (totalSelected * 100) / (totalSelected + totalDiscarded) }}%
    </n-layout-footer>
  </n-layout>
</template>
