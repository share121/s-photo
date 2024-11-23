import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "path-browserify";
import GetTagsWorker from "../workers/get-tags.ts?worker";
import { readFile } from "@tauri-apps/plugin-fs";

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
}

export const useFilesStore = defineStore("files", () => {
  const files = reactive<MyFile[]>([]);
  const curIndex = ref(0);
  const curFile = computed(() => files[curIndex.value] as MyFile | undefined);
  const curPath = computed(() =>
    curFile.value && join(
      curFile.value.dir,
      FileStateDir[curFile.value.state],
      curFile.value.name,
    )
  );
  const totalSelected = computed(() =>
    files.reduce(
      (acc, file) => (file.state === FileState.select ? acc + 1 : acc),
      0,
    )
  );
  const totalDiscarded = computed(() =>
    files.reduce(
      (acc, file) => (file.state === FileState.discard ? acc + 1 : acc),
      0,
    )
  );
  const passRate = computed(() =>
    totalSelected.value /
    (totalSelected.value + totalDiscarded.value)
  );
  const curUrl: Ref<string | undefined> = ref(undefined);
  watchDebounced(curFile, async (file) => {
    if (!file) return;
    curUrl.value = convertFileSrc(file.path);
  }, { debounce: 50 });
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
  return {
    files,
    curIndex,
    curPath,
    curUrl,
    curTags,
    totalSelected,
    totalDiscarded,
    curFile,
    passRate,
  };
});
