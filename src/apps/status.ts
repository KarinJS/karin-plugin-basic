import { karin } from 'node-karin'
import { cfg } from '@/config'
import { getMonthStat, getTodayStat, initStat, MB, uptime } from '@/core'

export const status = karin.command(/^#状态$/, async (e) => {
  const { send, recv, event } = await getTodayStat()
  const { send: sendMonth, recv: recvMonth, event: eventMonth } = await getMonthStat()

  await e.reply([
    '------机器人状态------',
    `当前版本：v${process.env.KARIN_VERSION}`,
    `内存占用：${MB()}MB`,
    `运行时间：${uptime()}`,
    '------今日统计------',
    `发送消息：${send}次`,
    `插件触发：${event}次`,
    `收到消息：${recv}次`,
    '------本月统计------',
    `发送消息：${sendMonth}次`,
    `插件触发：${eventMonth}次`,
    `收到消息：${recvMonth}次`
  ].join('\n'))

  return true
}, { name: '状态统计' })

if (cfg.get().status) initStat()
