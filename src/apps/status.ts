import moment from 'node-karin/moment'
import { config } from '@/utils/config'
import { EVENT_COUNT, karin, RECV_MSG, redis, SEND_MSG } from 'node-karin'
import type { Contact } from 'node-karin'

export const status = karin.command(/^#状态$/, async (e) => {
  const today = moment().format('YYYY-MM-DD')
  const month = moment().format('YYYY-MM')

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
  ])

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

/**
 * 生成存储键
 * @param contact 联系人
 * @example
 * ```ts
 * friend:<peer>
 * group:<peer>
 * guild:<peer>:<subPeer>
 * direct:<peer>:<subPeer>
 * ```
 */
const createKey = (contact: Contact) => {
  const { scene, peer, subPeer } = contact
  return `${moment().format('YYYY-MM-DD')}:${scene}:${peer}${subPeer ? `:${subPeer}` : ''}`
}

/**
 * 获取 Redis 键值统计
 */
const getStat = async (pattern: string) => {
  const keys = await redis.keys(pattern)
  const values = await Promise.all(keys.map((key) => redis.get(key).then(Number)))
  return values.reduce((total, value) => total + (value || 0), 0)
}

const MB = () => (process.memoryUsage().rss / 1024 / 1024).toFixed(2)

const uptime = () => {
  const uptime = process.uptime()
  const hour = Math.floor(uptime / 3600)
  const minute = Math.floor((uptime % 3600) / 60)
  return `${hour}小时${minute}分钟`
}

(() => {
  if (!config().status) return

  karin.on(RECV_MSG, (contact) => redis.incr(`${RECV_MSG}:${createKey(contact)}`))
  karin.on(SEND_MSG, (contact) => redis.incr(`${SEND_MSG}:${createKey(contact)}`))
  karin.on(EVENT_COUNT, ({ plugin, event }) => {
    const key = `${EVENT_COUNT}:${moment().format('YYYY-MM-DD')}:${plugin.file.basename}:${plugin.file.method}`
    redis.incr(key)
  })
})()
