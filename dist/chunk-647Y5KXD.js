import {
  info
} from "./chunk-DZWGT2BP.js";

// src/utils/config.ts
import fs from "node:fs";
import path from "node:path";
import {
  watch,
  basePath,
  filesByExt,
  copyConfigSync,
  requireFileSync
} from "node-karin";
var cache;
var dir = path.join(basePath, info.name, "config");
var defConfig = path.join(info.dir, "config");
var main = () => {
  copyConfigSync(defConfig, dir, [".json"]);
  setTimeout(() => {
    const list = filesByExt(dir, ".json", "abs");
    list.forEach((file) => watch(file, (old, now) => {
      cache = void 0;
    }));
  }, 2e3);
};
var config = () => {
  if (cache) return cache;
  const user = requireFileSync(`${dir}/config.json`);
  const def = requireFileSync(`${defConfig}/config.json`);
  const result = { ...def, ...user };
  cache = result;
  return result;
};
var writeConfig = (config2) => {
  const def = requireFileSync(`${defConfig}/config.json`);
  const result = { ...def, ...config2 };
  cache = result;
  fs.writeFileSync(`${dir}/config.json`, JSON.stringify(result, null, 2));
};
main();

export {
  config,
  writeConfig
};
