import { MAX_FILES } from "./prompts";
import type { Files } from "./types";

export const MAX_FILE_BYTES = 100_000;

/** Overlay the files Alex wrote onto the previous snapshot and check the result is a runnable project. */
export function mergeFiles(previous: Files, written: Files): { files: Files } | { error: string } {
  const files = { ...previous, ...written };
  const paths = Object.keys(files);
  if (!files["index.html"]?.trim()) return { error: "The app has no index.html." };
  if (paths.length > MAX_FILES) return { error: `The app has ${paths.length} files; the limit is ${MAX_FILES}.` };
  const big = paths.find((p) => new TextEncoder().encode(files[p]).length > MAX_FILE_BYTES);
  if (big) return { error: `${big} is larger than 100 KB.` };
  return { files };
}
