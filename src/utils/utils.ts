import karin, { config, logger } from 'node-karin'

/**
 * @description 给第一个主人发送消息
 * @param selfId Bot的QQ号
 * @param message 消息内容
 */
export const sendToFirstAdmin = async (selfId: string, message: Parameters<typeof karin.sendMsg>[2]) => {
  const list = config.master()
  const bot = karin.getBot(selfId)
  if (!bot) return false
  const f = await bot.getFriendList(true)
  const master = f.find(item => list.includes(item.userId))?.userId
  try {
    if (!master) return false
    const send = await karin.sendMaster(selfId, master, message)
    return send.messageId
  } catch (error) {
    logger.bot('info', selfId, `[${master}] 发送主动消息失败:`)
    logger.error(error)
  }
}
