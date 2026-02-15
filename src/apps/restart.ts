import { cfg } from '@/config'
import { plugin } from '@/utils'
import { common, karin, logger, restart, restartDirect } from 'node-karin'
import cron from 'node-cron'

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

const createRestartTask = () => {
  const Cron = cfg.get().restartTask as string
  if (Cron && +Cron === 0) return logger.info(`${logger.violet(`[插件:${plugin.name}]`)} [定时重启] 未启用`)
  if (!cron.validate(Cron)) return logger.info(`${logger.violet(`[插件:${plugin.name}]`)} [定时重启] Cron表达式错误`)
  return karin.task(`[${plugin.name}][定时重启]`, Cron, async () => {
    try {
      await restartDirect()
    } catch (err) {
      logger.error(err)
    }
  }, { log: true })
}

export const restartTask = createRestartTask()
