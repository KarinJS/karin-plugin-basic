import {
  config
} from "../chunk-647Y5KXD.js";
import "../chunk-DZWGT2BP.js";

// src/apps/status.ts
import moment from "node-karin/moment";
import { EVENT_COUNT, hooks, karin, RECV_MSG, redis, SEND_MSG } from "node-karin";
var status = karin.command(/^#状态$/, async (e) => {
  const today = moment().format("YYYY-MM-DD");
  const month = moment().format("YYYY-MM");
  const [
    send,
    recv,
    event,
    sendMonth,
    recvMonth,
    eventMonth
  ] = await Promise.all([
    getStat(`${SEND_MSG}:${today}*`),
    getStat(`${RECV_MSG}:${today}*`),
    getStat(`${EVENT_COUNT}:${today}*`),
    getStat(`${SEND_MSG}:${month}*`),
    getStat(`${RECV_MSG}:${month}*`),
    getStat(`${EVENT_COUNT}:${month}*`)
  ]);
  await e.reply([
    "------\u673A\u5668\u4EBA\u72B6\u6001------",
    `\u5F53\u524D\u7248\u672C\uFF1Av${process.env.KARIN_VERSION}`,
    `\u5185\u5B58\u5360\u7528\uFF1A${MB()}MB`,
    `\u8FD0\u884C\u65F6\u95F4\uFF1A${uptime()}`,
    "------\u4ECA\u65E5\u7EDF\u8BA1------",
    `\u53D1\u9001\u6D88\u606F\uFF1A${send}\u6B21`,
    `\u63D2\u4EF6\u89E6\u53D1\uFF1A${event}\u6B21`,
    `\u6536\u5230\u6D88\u606F\uFF1A${recv}\u6B21`,
    "------\u672C\u6708\u7EDF\u8BA1------",
    `\u53D1\u9001\u6D88\u606F\uFF1A${sendMonth}\u6B21`,
    `\u63D2\u4EF6\u89E6\u53D1\uFF1A${eventMonth}\u6B21`,
    `\u6536\u5230\u6D88\u606F\uFF1A${recvMonth}\u6B21`
  ].join("\n"));
  return true;
}, { name: "\u72B6\u6001\u7EDF\u8BA1" });
var createKey = (contact) => {
  const { scene, peer, subPeer } = contact;
  return `${moment().format("YYYY-MM-DD")}:${scene}:${peer}${subPeer ? `:${subPeer}` : ""}`;
};
var getStat = async (pattern) => {
  const keys = await redis.keys(pattern);
  const values = await Promise.all(keys.map((key) => redis.get(key).then(Number)));
  return values.reduce((total, value) => total + (value || 0), 0);
};
var MB = () => (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
var uptime = () => {
  const uptime2 = process.uptime();
  const hour = Math.floor(uptime2 / 3600);
  const minute = Math.floor(uptime2 % 3600 / 60);
  return `${hour}\u5C0F\u65F6${minute}\u5206\u949F`;
};
(() => {
  if (!config().status) return;
  hooks.message((event, next) => {
    try {
      redis.incr(`${RECV_MSG}:${createKey(event.contact)}`);
    } finally {
      next();
    }
  });
  hooks.sendMsg.message((contact, _, __, next) => {
    try {
      redis.incr(`${SEND_MSG}:${createKey(contact)}`);
    } finally {
      next();
    }
  });
})();
export {
  status
};
