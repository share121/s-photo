import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "path-browserify";
import GetTagsWorker from "../workers/get-tags.ts?worker";
import { exists, mkdir, readFile, rename } from "@tauri-apps/plugin-fs";
import { Mutex } from "async-mutex";
import "requestidlecallback-polyfill";

export enum FileState {
  select = "select",
  wait = "wait",
  discard = "discard",
}

export const FileStateDir = {
  [FileState.select]: "选用",
  [FileState.wait]: ".",
  [FileState.discard]: "弃用",
} as const;

interface MyFile {
  dir: string;
  name: string;
  state: FileState;
  path: string;
  url: string;
}

export const useFilesStore = defineStore("files", () => {
  const files = reactive<MyFile[]>([]);
  const curIndex = ref(0);
  const curFile = computed(() => files[curIndex.value] as MyFile | undefined);
  const states = computed(() => files.map((file) => file.state));
  const totalSelected = computed(() =>
    states.value.reduce(
      (acc, state) => (state === FileState.select ? acc + 1 : acc),
      0,
    )
  );
  const totalDiscarded = computed(() =>
    states.value.reduce(
      (acc, state) => (state === FileState.discard ? acc + 1 : acc),
      0,
    )
  );
  const passRate = computed(() =>
    totalSelected.value /
    (totalSelected.value + totalDiscarded.value)
  );
  // const curUrl: Ref<string | undefined> = ref(undefined);
  // watchDebounced(curFile, async (file) => {
  //   if (!file) return;
  //   curUrl.value = convertFileSrc(file.path);
  // }, { debounce: 100 });
  const curTags: Ref<string[][] | undefined> = ref(undefined);
  watchDebounced(curFile, async (file, _, onCleanup) => {
    if (!file) return;
    const worker = new GetTagsWorker();
    onCleanup(() => worker.terminate());
    const buffer = await readFile(file.path);
    worker.postMessage(buffer);
    worker.onmessage = ({ data }: { data: string[][] }) => {
      worker.terminate();
      curTags.value = data;
    };
  }, { debounce: 100 });
  const mutex = new Mutex();
  watchDebounced(states, (n) => {
    mutex.runExclusive(async () => {
      for (let i = 0; i < n.length; i++) {
        const file = files[i];
        const destDir = join(file.dir, FileStateDir[file.state]);
        const destPath = join(destDir, file.name);
        if (file.path === destPath) continue;
        const isExists = await exists(destDir);
        if (!isExists) await mkdir(destDir);
        await rename(file.path, destPath);
        file.path = destPath;
        requestIdleCallback(() => {
          file.url = convertFileSrc(file.path);
        }, { timeout: 3000 });
      }
    });
  }, { debounce: 1000 });
  return {
    files,
    curIndex,
    curTags,
    totalSelected,
    totalDiscarded,
    curFile,
    passRate,
    states,
  };
});
