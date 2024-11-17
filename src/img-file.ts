import { path } from "@tauri-apps/api";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import { Mutex } from "async-mutex";
import ExifReader from "exifreader";

export enum ImgState {
  select = "select",
  wait = "wait",
  discard = "discard",
}

export const ImgStateDir = {
  [ImgState.select]: "选用",
  [ImgState.wait]: ".",
  [ImgState.discard]: "弃用",
} as const;

export class ImgFile {
  __mutex = new Mutex();
  async getPath() {
    const state = await this.getState();
    return path.join(this.dir, ImgStateDir[state], this.filename);
  }
  async getUrl() {
    return convertFileSrc(await this.getPath());
  }
  state = ref(ImgState.wait);
  async getState() {
    await this.__mutex.waitForUnlock();
    return this.state.value;
  }
  async setState(state: ImgState) {
    if (state === this.state.value) return;
    const release = await this.__mutex.acquire();
    try {
      await invoke("move_file", {
        from: await path.join(
          this.dir,
          ImgStateDir[this.state.value],
          this.filename,
        ),
        to: await path.join(
          this.dir,
          ImgStateDir[state],
          this.filename,
        ),
      });
      this.state.value = state;
    } catch (e) {
      throw e;
    } finally {
      release();
    }
  }

  __tags: string[][] | undefined;
  async getTags() {
    if (this.__tags) return this.__tags;
    const path = await this.getPath();
    const buffer = await readFile(path);
    const tags = await ExifReader.load(buffer.buffer, { async: true });
    return this.__tags = Object.entries(tags)
      .filter((t) => t[1].description)
      .map((t) => [t[0], t[1].description]);
  }

  constructor(
    public dir: string,
    public filename: string,
  ) {
  }
}
