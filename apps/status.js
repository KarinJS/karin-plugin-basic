import moment from 'moment'
import { redis, Bot, App, Cfg } from '#Karin'
import Config from '../lib/config.js'

let recv_count = ''
let send_count = ''
let fnc_count = ''

/** 存储到redis中的key标准 这边只做总数统计 */
const recv_key = 'karin:count:recv'
const send_key = 'karin:count:send'
const fnc_key = 'karin:count:fnc'

if (Config.Config.status) {
  /** 监听收到消息 */
  Bot.on(recv_key, () => redis.incr(recv_count))
  /** 监听发送消息 */
  Bot.on(send_key, () => redis.incr(send_count))
  /** 监听插件触发 */
  Bot.on(fnc_key, () => redis.incr(fnc_count))
}

function init () {
  // 获取当前时间 格式为 YYYY-MM-DD
  const time = moment().format('YYYY-MM-DD')
  recv_count = recv_key + `:${time}`
  send_count = send_key + `:${time}`
  fnc_count = fnc_key + `:${time}`
}

init()

const app = App.init({
  name: '状态统计',
  dsc: '统计机器人收发消息数量，插件触发数量等',
  priority: -1
})

app.cron({
  name: '每天0点初始化统计数据',
  cron: '0 0 * * *',
  fnc: init
})

app.reg({
  reg: /^#状态$/,
  fnc: 'status',
  async status () {
    const all = [
      '------机器人状态------',
      `Karin 版本：v${Cfg.package.version}`,
      `内存占用：${this.MB()}MB`,
      `运行时间：${this.uptime()}`,
      '------今日统计------',
      `发送消息：${await redis.get(send_count) || 0}次`,
      `插件触发：${await redis.get(fnc_count) || 0}次`,
      `收到消息：${await redis.get(recv_count) || 0}次`,
      '------本月统计------',
      `发送消息：${await this.getCount(send_key)}次`,
      `插件触发：${await this.getCount(fnc_key)}次`,
      `收到消息：${await this.getCount(recv_key)}次`
    ]

    this.reply(all.join('\n'))
  },
  MB () {
    let MB = process.memoryUsage().heapUsed / 1024 / 1024
    MB = MB.toFixed(2)
    return MB
  },
  uptime () {
    let uptime = process.uptime()
    let [hour, minute] = [3600, 60].map(unit => {
      let value = Math.floor(uptime / unit)
      uptime %= unit
      return value
    })
    return `${hour}小时${minute}分钟`
  },
  /** 获取30天的消息数量 */
  async getCount (key) {
    let num = 0
    /** 对于30天的统计，预先生成所有可能的键 */
    // eslint-disable-next-line no-unused-vars
    const keys = Array.from({ length: 30 }, (_, i) => {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD')
      return `${key}:${date}`
    })

    for (const k of keys) {
      num += Number(await redis.get(k)) || 0
    }

    return num
  }
})

export const status = app.plugin(app)
