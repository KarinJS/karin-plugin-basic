import { common, karin } from 'node-karin'

export const exit = karin.command(/^#关机$/, async (e) => {
  await e.reply(`开始关机 本次运行时间: ${common.uptime()}`, { at: true })
  process.emit('SIGINT')
  return true
}, { name: '关机', perm: 'admin' })
