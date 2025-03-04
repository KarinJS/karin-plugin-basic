import {
  config
} from "../chunk-647Y5KXD.js";
import "../chunk-DZWGT2BP.js";

// src/apps/restart.ts
import { common, karin, logger, restart } from "node-karin";
var restarts = karin.command(/^#重启$/, async (e) => {
  try {
    await e.reply(`\u5F00\u59CB\u91CD\u542F \u672C\u6B21\u8FD0\u884C\u65F6\u95F4: ${common.uptime()}`, { at: true });
    const { status, data } = await restart(e.selfId, e.contact, e.messageId, config().restartMode);
    if (status === "failed") throw data;
    return true;
  } catch (error) {
    logger.error(error);
    await e.reply(`\u91CD\u542F\u5931\u8D25: ${error.message || "\u672A\u77E5\u539F\u56E0"}`, { at: true });
    return true;
  }
}, { name: "\u91CD\u542F", perm: "admin" });
export {
  restarts
};
