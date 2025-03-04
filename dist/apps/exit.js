// src/apps/exit.ts
import { common, karin } from "node-karin";
var exit = karin.command(/^#关机$/, async (e) => {
  await e.reply(`\u5F00\u59CB\u5173\u673A \u672C\u6B21\u8FD0\u884C\u65F6\u95F4: ${common.uptime()}`, { at: true });
  process.emit("SIGINT");
  return true;
}, { name: "\u5173\u673A", perm: "admin" });
export {
  exit
};
