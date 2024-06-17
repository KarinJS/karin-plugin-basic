import Config from '../lib/config.js'
import { plugin, redis, exec, common } from '#Karin'

export class Restart extends plugin {
  constructor () {
    super({
      name: '运行管理',
      dsc: '重启 关机',
      priority: 100000,
      rule: [
        {
          reg: /^#关机$/,
          fnc: 'stop',
          permission: 'master'
        },
        {
          reg: /^#重启$/,
          fnc: 'restart',
          permission: 'master'
        }
      ]
    })
  }

  async stop () {
    await this.reply(`\nKarin 已停止运行 运行时间：${common.uptime()}`, { at: true })
    return await this.CmdStop()
  }

  async restart () {
    await this.reply(`\n开始重启 本次运行时间：${common.uptime()}`, { at: true })
    try {
      await this.CmdRestart()
    } catch (error) {
      return this.reply(`\n重启失败\n${error.message}`, { at: true })
    }
  }

  async CmdRestart () {
    const options = {
      id: this.e.self_id,
      contact: this.e.contact,
      time: Date.now(),
      message_id: this.e.message_id
    }
    const key = `karin:restart:${options.id}`
    // 5分钟有效期
    const EX = 5 * 60
    await redis.set(key, JSON.stringify(options), { EX })

    if (Config.pm2.enable) {
      await exec(Config.pm2.cmd)
      process.exit()
    } else {
      return await this.CmdStop()
    }
  }

  async CmdStop () {
    /** pm2多执行一个指令 */
    try {
      if (process.env.pm_id) {
        await exec(`pm2 delete ${process.env.pm_id}`)
      }
    } finally {
      process.exit()
    }
  }
}
