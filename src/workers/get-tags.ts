import ExifReader from "exifreader";
import { DOMParser } from "@xmldom/xmldom";

// @ts-ignore
globalThis.DOMParser = DOMParser;
addEventListener("message", async ({ data }) => {
  const tags = await ExifReader.load(data.buffer, { async: true });
  postMessage(
    Object.entries(tags)
      .filter((t) => t[1].description)
      .map((t) => [t[0], t[1].description]),
  );
});
