// src/apps/update.ts
import fs from "node:fs";
import path from "node:path";
import { changelog, checkGitPluginUpdate, checkPkgUpdate, getCommit, getPlugins, getPkgVersion, karin, updateAllGitPlugin, updateAllPkg, updateGitPlugin, updatePkg } from "node-karin";
var cache = [];
var getAll = async () => {
  if (cache.length) return cache;
  const git = await getPlugins("git", false);
  const npm = await getPlugins("npm", false);
  const list = [
    "npm:node-karin",
    ...git.map((name) => `git:${name}`),
    ...npm.map((name) => `npm:${name}`)
  ];
  cache.push(...list);
  setTimeout(() => {
    cache.length = 0;
  }, 6e4);
  return list;
};
var plugins = karin.command(/^#插件列表$/, async (e) => {
  const list = await getAll();
  list.forEach((item, index) => {
    item += `${index + 1}. ${item}`;
  });
  await e.reply([
    "\n\u63D2\u4EF6\u5217\u8868\uFF1A",
    "\u66F4\u65B0\uFF1A#\u66F4\u65B0\u63D2\u4EF6 \u5E8F\u53F7\u6216\u540D\u79F0",
    "\u68C0\u67E5\u66F4\u65B0\uFF1A#\u68C0\u67E5\u66F4\u65B0 \u5E8F\u53F7\u6216\u540D\u79F0",
    "\u65E5\u5FD7\uFF1A#\u66F4\u65B0\u65E5\u5FD7 \u6761\u6570 \u5E8F\u53F7\u6216\u540D\u79F0",
    ...list
  ].join("\n"), { at: true });
  return true;
}, { name: "\u63D2\u4EF6\u5217\u8868", perm: "admin" });
var check = karin.command(/^#检查更新/, async (e) => {
  let name = e.msg.replace(/^#检查更新/, "").trim();
  const index = Number(name);
  if (index && typeof index === "number") {
    const list = await getAll();
    name = list[index - 1];
  }
  if (!name) {
    await e.reply("\n\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u63D2\u4EF6\u540D\u79F0\u6216\u5E8F\u53F7~", { at: true });
    return true;
  }
  const tips = "\u5F53\u524D\u7248\u672C\u5DF2\u662F\u6700\u65B0\u7248\u672C";
  if (name.includes("git:")) {
    name = name.replace("git:", "");
    const file = path.join(process.cwd(), "plugins", name.replace("git:", ""));
    const result = await checkGitPluginUpdate(file);
    if (result.status === "error") {
      const { data } = result;
      const msg = typeof data === "string" ? data : `\u83B7\u53D6\u66F4\u65B0\u4FE1\u606F\u5931\u8D25: ${data.message || "\u672A\u77E5\u9519\u8BEF"}`;
      await e.reply(msg, { at: true });
      return true;
    }
    if (result.status === "no") {
      await e.reply(`
${tips}${result.data.replace(tips + "\n", "")}`, { at: true });
      return true;
    }
    await e.reply([
      "\n\u5B58\u5728\u65B0\u7248\u672C:",
      `\u540D\u79F0\uFF1A${name}`,
      `\u843D\u540E: ${result.count}\u6B21\u63D0\u4EA4`,
      `\u66F4\u65B0\u65E5\u5FD7\uFF1A
${result.data}`
    ].join("\n"), { at: true });
    return true;
  }
  if (name.includes("npm:")) {
    name = name.replace("npm:", "");
    const result = await checkPkgUpdate(name);
    if (result.status === "no") {
      await e.reply(`
\u5F53\u524D\u7248\u672C: ${result.local}
${tips}`, { at: true });
      return true;
    }
    if (result.status === "error") {
      const { error } = result;
      const msg = `\u83B7\u53D6\u66F4\u65B0\u4FE1\u606F\u5931\u8D25: ${error.message || "\u672A\u77E5\u9519\u8BEF"}`;
      await e.reply(msg, { at: true });
      return true;
    }
    await e.reply([
      "\n\u5B58\u5728\u65B0\u7248\u672C:",
      `\u540D\u79F0\uFF1A${name}`,
      `\u5F53\u524D\u7248\u672C: ${result.local}`,
      `\u6700\u65B0\u7248\u672C: ${result.remote}`
    ].join("\n"), { at: true });
    return true;
  }
  await e.reply("\n\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u63D2\u4EF6\u540D\u79F0\u6216\u5E8F\u53F7~", { at: true });
  return true;
}, { name: "\u68C0\u67E5\u66F4\u65B0", perm: "admin" });
var update = karin.command(/^#(强制)?更新(插件)?(?!列表|日志)/, async (e) => {
  let name = e.msg.replace(/^#(强制)?更新(插件)?(?!列表|日志)/, "").trim();
  const index = Number(name);
  if (index && typeof index === "number") {
    const list = await getAll();
    name = list[index - 1];
  }
  if (!name) {
    await e.reply("\n\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u63D2\u4EF6\u540D\u79F0\u6216\u5E8F\u53F7~", { at: true });
    return true;
  }
  if (name.includes("git:")) {
    name = name.replace("git:", "");
    const file = path.join(process.cwd(), "plugins", name.replace("git:", ""));
    let cmd = "git pull";
    if (e.msg.includes("\u5F3A\u5236")) cmd = "git reset --hard && git pull --allow-unrelated-histories";
    const result = await updateGitPlugin(file, cmd, 120);
    if (result.status === "failed") {
      const { data } = result;
      const msg = typeof data === "string" ? data : `\u83B7\u53D6\u66F4\u65B0\u4FE1\u606F\u5931\u8D25: ${data.message || "\u672A\u77E5\u9519\u8BEF"}`;
      await e.reply(msg, { at: true });
      return true;
    }
    await e.reply(`
${result.data}`, { at: true });
    return true;
  }
  if (name.includes("npm:")) {
    name = name.replace("npm:", "");
    const result = await updatePkg(name);
    if (result.status === "failed") {
      const { data } = result;
      const msg = typeof data === "string" ? data : `\u83B7\u53D6\u66F4\u65B0\u4FE1\u606F\u5931\u8D25: ${data.message || "\u672A\u77E5\u9519\u8BEF"}`;
      await e.reply(`
${msg}`, { at: true });
      return true;
    }
    const log2 = parseLog(name, result.local, result.remote);
    await e.reply(`
\u66F4\u65B0\u6210\u529F
\u5F53\u524D\u7248\u672C: ${result.remote}
\u66F4\u65B0\u65E5\u5FD7: 
${log2}`, { at: true });
    return true;
  }
  await e.reply("\n\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u63D2\u4EF6\u540D\u79F0\u6216\u5E8F\u53F7~", { at: true });
  return true;
}, { name: "\u66F4\u65B0\u63D2\u4EF6", perm: "admin" });
var log = karin.command(/^#更新日志/, async (e) => {
  const [index, num] = e.msg.replace(/^#更新日志/, "").trim().split(" ");
  if (!index || !num) {
    await e.reply("\n\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u547D\u4EE4 #\u66F4\u65B0\u65E5\u5FD7 <\u5E8F\u53F7\u6216\u63D2\u4EF6\u540D\u79F0> [\u65E5\u5FD7\u6570\u91CF]", { at: true });
    return true;
  }
  const count = Number(num) || 10;
  let name = index;
  if (Number(index)) {
    const list = await getAll();
    name = list[Number(index) - 1];
  }
  if (!name) {
    await e.reply("\n\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u63D2\u4EF6\u540D\u79F0\u6216\u5E8F\u53F7~", { at: true });
    return true;
  }
  if (name.includes("npm:")) {
    name = name.replace("npm:", "");
    const local = await getPkgVersion(name);
    if (!local) {
      await e.reply("\u83B7\u53D6\u63D2\u4EF6\u7248\u672C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u5B58\u5728\u6B64\u63D2\u4EF6", { at: true });
    } else {
      const result = parseLog(name, local, count);
      await e.reply(`
${result}`, { at: true });
    }
    return true;
  }
  if (name.includes("git:")) {
    name = name.replace("git:", "");
    const file = path.join(process.cwd(), "plugins", name);
    const result = await getCommit({ path: file, count });
    await e.reply(`
${result}`, { at: true });
    return true;
  }
  await e.reply("\n\u8BF7\u8F93\u5165\u6B63\u786E\u7684\u63D2\u4EF6\u540D\u79F0\u6216\u5E8F\u53F7~", { at: true });
  return true;
}, { name: "\u66F4\u65B0\u65E5\u5FD7", perm: "admin" });
var updateAll = karin.command(/^#全部(强制)?更新$/, async (e) => {
  const cmd = e.msg.includes("\u5F3A\u5236") ? "git reset --hard && git pull --allow-unrelated-histories" : "git pull";
  try {
    const git = await updateAllGitPlugin(cmd);
    const npm = await updateAllPkg();
    await e.reply([
      "\n\u5168\u90E8\u66F4\u65B0\u5B8C\u6210",
      "-----",
      git,
      "-----",
      npm
    ].join("\n"), { at: true });
  } catch (error) {
    await e.reply(`
\u5168\u90E8\u66F4\u65B0\u5931\u8D25: ${error.message || "\u672A\u77E5\u9519\u8BEF"}`, { at: true });
  }
  return true;
}, { name: "\u5168\u90E8\u66F4\u65B0", perm: "admin" });
var parseLog = (pkg, local, count) => {
  const file = path.join(process.cwd(), "node_modules", pkg, "CHANGELOG.md");
  if (!fs.existsSync(file)) return "\u63D2\u4EF6\u672A\u63D0\u4F9B`CHANGELOG.md`\u6587\u4EF6";
  const data = fs.readFileSync(file, "utf-8");
  if (typeof count === "number") {
    return changelog.logs(data, local, count) || "\u672A\u627E\u5230\u5BF9\u5E94\u7684\u66F4\u65B0\u65E5\u5FD7";
  }
  return changelog.range(data, local, count) || "\u672A\u627E\u5230\u5BF9\u5E94\u7684\u66F4\u65B0\u65E5\u5FD7";
};
export {
  check,
  log,
  plugins,
  update,
  updateAll
};
