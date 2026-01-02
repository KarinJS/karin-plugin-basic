import { cfg } from '@/config'
import { common, karin, logger, restart } from 'node-karin'

export const restarts = karin.command(/^#重启$/, async (e) => {
  try {
    await e.reply(`开始重启 本次运行时间: ${common.uptime()}`, { at: true })
    const { status, data } = await restart(e.selfId, e.contact, e.messageId, cfg.get().restartMode)
    if (status === 'failed') throw data
    return true
  } catch (error) {
    logger.error(error)
    await e.reply(`重启失败: ${(error as Error).message || '未知原因'}`, { at: true })
    return true
  }
}, { name: '重启', perm: 'admin' })
