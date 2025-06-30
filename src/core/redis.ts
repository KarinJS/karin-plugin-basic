import moment from 'node-karin/moment'
import { EVENT_COUNT, hooks, RECV_MSG, redis, SEND_MSG } from 'node-karin'

import type { Contact } from 'node-karin'

let isOn = false

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
export const createKey = (contact: Contact) => {
  const { scene, peer, subPeer } = contact
  return `${moment().format('YYYY-MM-DD')}:${scene}:${peer}${subPeer ? `:${subPeer}` : ''}`
}

/**
 * 获取 Redis 键值统计
 * @param pattern - 键值统计的 pattern
 */
export const getStat = async (pattern: string) => {
  const keys = await redis.keys(pattern)
  const values = await Promise.all(keys.map((key) => redis.get(key).then(Number)))
  return values.reduce((total, value) => total + (value || 0), 0)
}

/**
 * 获取今日统计
 */
export const getTodayStat = async (): Promise<{
  /** 今日发送消息 */
  send: number
  /** 今日收到消息 */
  recv: number
  /** 今日插件触发次数 */
  event: number
}> => {
  const today = moment().format('YYYY-MM-DD')

  const [
    send,
    recv,
    event,
  ] = await Promise.all([
    getStat(`${SEND_MSG}:${today}*`),
    getStat(`${RECV_MSG}:${today}*`),
    getStat(`${EVENT_COUNT}:${today}*`),
  ])

  return {
    send,
    recv,
    event,
  }
}

/**
 * 获取本月统计
 */
export const getMonthStat = async (): Promise<{
  /** 本月发送消息 */
  send: number
  /** 本月收到消息 */
  recv: number
  /** 本月插件触发次数 */
  event: number
}> => {
  const month = moment().format('YYYY-MM')

  const [
    send,
    recv,
    event,
  ] = await Promise.all([
    getStat(`${SEND_MSG}:${month}*`),
    getStat(`${RECV_MSG}:${month}*`),
    getStat(`${EVENT_COUNT}:${month}*`),
  ])

  return {
    send,
    recv,
    event,
  }
}

/**
 * 获取内存使用情况
 */
export const MB = () => (process.memoryUsage().rss / 1024 / 1024).toFixed(2)

/**
 * 获取运行时间
 */
export const uptime = () => {
  const uptime = process.uptime()
  const day = Math.floor(uptime / 86400)
  const hour = Math.floor((uptime % 86400) / 3600)
  const minute = Math.floor((uptime % 3600) / 60)

  return `${day > 0 ? `${day}天` : ''}${hour}小时${minute}分钟`
}

/**
 * 初始化 Redis 键值统计
 */
export const initStat = () => {
  if (isOn) return
  isOn = true

  hooks.message((event, next) => {
    try {
      redis.incr(`${RECV_MSG}:${createKey(event.contact)}`)
    } finally {
      next()
    }
  })

  hooks.sendMsg.message((contact, _, __, next) => {
    try {
      redis.incr(`${SEND_MSG}:${createKey(contact)}`)
    } finally {
      next()
    }
  })

  hooks.eventCall((e, _, next) => {
    try {
      redis.incr(`${EVENT_COUNT}:${createKey(e.contact)}`)
    } finally {
      next()
    }
  })
}
