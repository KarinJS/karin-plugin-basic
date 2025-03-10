// src/root.ts
import path from "node:path";

// package.json
var package_default = {
  name: "@karinjs/plugin-basic",
  version: "1.0.2",
  description: "karin plugin for basic functions",
  homepage: "https://github.com/KarinJS/karin-plugin-basic",
  bugs: {
    url: "https://github.com/KarinJS/karin-plugin-basic/issues"
  },
  repository: {
    type: "git",
    url: "git+https://github.com/KarinJS/karin-plugin-basic.git"
  },
  author: "shijin",
  type: "module",
  main: "dist/index.js",
  files: [
    "/lib/**/*.js",
    "/lib/**/*.d.ts",
    "config",
    "resources",
    "LICENSE",
    "package.json",
    "README.md"
  ],
  scripts: {
    build: "tsc && tsup",
    pub: "npm publish --access public",
    sort: "npx sort-package-json",
    dev: "tsx src/index.ts",
    watch: "tsx watch src/index.ts",
    karin: "karin"
  },
  devDependencies: {
    "@types/node": "^20.17.17",
    eslint: "^9.20.0",
    neostandard: "^0.12.1",
    "node-karin": "^1.4.3",
    tsup: "^8.3.6",
    tsx: "^4.19.2",
    typescript: "^5.7.3"
  },
  publishConfig: {
    access: "public",
    registry: "https://registry.npmjs.org"
  },
  karin: {
    main: "src/index.ts",
    apps: [
      "dist/apps"
    ],
    "ts-apps": [
      "dist/apps"
    ],
    static: [
      "resources"
    ],
    files: [
      "config"
    ],
    "ts-web": "src/web.config.ts",
    web: "dist/web.config.js"
  }
};

// src/root.ts
import { fileURLToPath } from "node:url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var __pluginDir = path.resolve(__dirname, "../");
var info = {
  /** 插件目录 */
  dir: __pluginDir,
  /** 插件名称 */
  name: package_default.name.replace(/\//g, "-"),
  /** 插件版本 */
  version: package_default.version,
  /** package.json */
  pkg: package_default
};

export {
  info
};
