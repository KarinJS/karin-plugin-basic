import {
  config,
  writeConfig
} from "./chunk-647Y5KXD.js";
import {
  info
} from "./chunk-DZWGT2BP.js";

// src/web.config.ts
import { components } from "node-karin";
var web_config_default = {
  info: {
    name: "\u57FA\u7840\u63D2\u4EF6",
    version: info.version,
    description: info.pkg.description,
    author: [
      {
        name: info.pkg.author,
        avatar: "https://github.com/sj817.png"
      }
    ]
  },
  /** 动态渲染的组件 */
  components: () => {
    const cfg = config();
    const list = [
      components.switch.create("status", {
        color: "success",
        label: "\u7EDF\u8BA1\u72B6\u6001",
        description: "\u5173\u95ED\u540E\u53EF\u964D\u4F4Eredis\u538B\u529B...",
        defaultSelected: cfg.status
      }),
      components.switch.create("forward", {
        color: "success",
        label: "\u66F4\u65B0\u8F6C\u53D1",
        description: "\u5168\u90E8\u66F4\u65B0\u662F\u5426\u4F7F\u7528\u8F6C\u53D1",
        defaultSelected: cfg.forward
      }),
      components.switch.create("restartMode", {
        color: "success",
        label: "\u91CD\u542F\u65B9\u5F0F",
        description: "\u6253\u5F00\u4E3A\u524D\u53F0\u91CD\u542F \u5173\u95ED\u4E3A\u540E\u53F0\u91CD\u542F",
        defaultSelected: cfg.restartMode
      }),
      components.switch.create("restart", {
        color: "success",
        label: "\u81EA\u52A8\u91CD\u542F",
        description: "\u66F4\u65B0\u5B8C\u6210\u662F\u5426\u81EA\u52A8\u91CD\u542F",
        defaultSelected: cfg.restart
      })
    ];
    return list;
  },
  /** 前端点击保存之后调用的方法 */
  save: (config2) => {
    writeConfig(config2);
    return {
      success: true,
      message: "\u4FDD\u5B58\u6210\u529F"
    };
  }
};
export {
  web_config_default as default
};
