import karin, { config, logger } from 'node-karin'

/**
 * @description 给第一个主人发送消息
 * @param selfId Bot的QQ号
 * @param message 消息内容
 */
export const sendToFirstAdmin = async (selfId: string, message: Parameters<typeof karin.sendMsg>[2]) => {
  const list = config.master()
  let master = list[0]
  if (master === 'console') {
    master = list[1]
  }
  try {
    if (!master) return false
    const a = await karin.sendMaster(selfId, master, message)
    return a.messageId
  } catch (error) {
    logger.bot('info', selfId, `[${master}] 发送主动消息失败:`)
    logger.error(error)
  }
}
