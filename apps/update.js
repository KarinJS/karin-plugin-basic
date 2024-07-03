import fs from 'fs'
import Config from '../lib/config.js'
import { Restart } from './restart.js'
import { Update, common, plugin, segment, exec } from 'node-karin'

const List = []
export class update extends plugin {
  constructor () {
    super({
      name: '更新',
      dsc: '更新插件',
      priority: 100000,
      rule: [
        {
          reg: /^#插件列表$/,
          fnc: 'updateList',
          permission: 'master',
        },
        {
          reg: /^#检查更新/,
          fnc: 'checkUpdate',
          permission: 'master',
        },
        {
          reg: /^#更新日志/,
          fnc: 'log',
          permission: 'master',
        },
        {
          reg: /^#(强制)?更新(插件)?(?!列表|日志)/,
          fnc: 'update',
          permission: 'master',
        },
        {
          reg: /^#全部(强制)?更新$/,
          fnc: 'updateAll',
          permission: 'master',
        },
      ],
    })
  }

  async updateList (_e, isReply = true) {
    const list = common.getPlugins()
    /** 清空List */
    List.length = 0
    List.push(...list)
    let res = ''
    list.forEach((item, index) => {
      res += `${index + 1}. ${item}\n`
    })
    isReply && await this.reply([
      '\n插件列表：',
      '更新：#更新插件 序号',
      '检查更新：#检查更新 序号',
      '日志：#更新日志 条数 序号',
      res,
    ].join('\n'), { at: true })
    return true
  }

  /**
   * 检查更新
   */
  async checkUpdate () {
    this.reply('正在检查更新，请稍后...', { at: true })
    let name = this.e.msg.replace(/^#检查更新/, '').trim()
    let _path = process.cwd()
    if (Number(name)) {
      if (!List.length) await this.updateList(this.e, false)
      const index = Number(name) - 1
      name = List[index]
      _path = _path + `/plugins/${List[index]}`
    } else if (name) {
      const filePath = this.pluginName(name)
      if (!filePath) return true
      _path = filePath
    } else {
      name = 'Karin'
    }

    try {
      const { data, count = 0 } = await Update.checkUpdate(_path)
      return this.e.reply(`\n检查结果\n检查目标：${name.replace(/^karin-(plugin|adapter)-/g, '')}\n落后：${count}次提交\n${data || '已经是最新版本'}`, { at: true })
    } catch (error) {
      return this.e.reply(`\n检查更新失败：\n${error.message}`, { at: true })
    }
  }

  /**
   * 更新日志
   */
  async log () {
    const msg = this.e.msg.replace(/#更新日志/, '').trim()
    let [count, name] = msg.split(' ')
    if (count > 100) {
      return this.e.reply('最多只能查100条更新日志', { at: true })
    }

    if (!count) count = 10
    let _path = process.cwd()
    /** 如果name可以被Number */
    if (Number(name)) {
      if (!List.length) await this.updateList(this.e, false)
      const index = Number(name) - 1
      name = List[index]
      _path = _path + `/plugins/${List[index]}`
    } else if (name) {
      const filePath = this.pluginName(name)
      if (!filePath) return true
      _path = filePath
    } else {
      name = 'Karin'
    }

    try {
      const data = await Update.getCommit({ path: _path, count })
      return this.e.reply(`\n${name} 更新日志(${count || '10'}条)\n\n` + data.trimEnd(), { at: true })
    } catch (e) {
      return this.e.reply(`\n获取更新日志失败：\n${e.message}`, { at: true })
    }
  }

  /**
   * 执行更新
   */
  async update () {
    this.e.reply('正在更新，请稍后...', { at: true })

    let _path = process.cwd()
    let name = this.e.msg.replace(/^#(强制)?更新(插件)?(?!列表|日志)/, '').trim()
    if (Number(name)) {
      if (!List.length) await this.updateList(this.e, false)
      const index = Number(name) - 1
      name = List[index]
      _path = _path + `/plugins/${List[index]}`
    } else if (name) {
      const filePath = this.pluginName(name)
      if (!filePath) return true
      _path = filePath
    } else {
      name = 'karin'
    }

    let cmd = 'git pull'
    if (this.e.msg.includes('强制')) cmd = 'git reset --hard && git pull --allow-unrelated-histories'
    try {
      const { data } = await Update.update(_path, cmd)

      if (name === 'karin') {
        // 获取当前源最新版本 npm show node-karin version
        const Current = (await exec('npm show node-karin version', false, { cwd: _path, env: process.env })).stdout.trim()
        // 获取本地node-karin版本 npm ls node-karin
        const res = (await exec('npm ls node-karin', false, { cwd: _path, env: process.env })).stdout.trim()
        const karinVersion = res.match(/node-karin@(.*) /)?.[1]
        // 对比版本 如果小于最新版本则更新 获取当前版本失败也更新
        if (!karinVersion || karinVersion !== Current) {
          await exec('pnpm install -P', true, { cwd: _path, env: process.env })
        }
      }

      await this.reply(`\n${name}${data}`, { at: true })

      if (!data.includes('更新成功')) return true

      // 更新成功之后 跑一遍对应包的依赖安装 先获取包名
      if (name !== 'karin') {
        const pkg = common.readJson(_path + '/package.json')
        const cmd = `pnpm install --filter=${pkg.name}`
        await exec(cmd, true, { cwd: _path, env: process.env })
      }

      if (Config.Config.restart) {
        await this.reply(`\n更新完成，开始重启 本次运行时间：${common.uptime()}`, { at: true })
        try {
          const restart = new Restart()
          restart.e = this.e
          await restart.CmdRestart()
          return true
        } catch (error) {
          return this.reply(`\n重启失败\n${error.message}`, { at: true })
        }
      }
    } catch (error) {
      return this.reply(`更新失败：${error.message}`, { at: true })
    }
  }

  /**
   * 全部更新
   */
  async updateAll () {
    this.e.reply('正在进行全部更新，请稍后...', { at: true })
    const msg = []
    const list = Update.getPlugins()
    let cmd = 'git pull'
    if (this.e.msg.includes('强制')) cmd = 'git reset --hard && git pull --allow-unrelated-histories'

    let isRestart = false

    try {
      // 判断是否为git仓库
      const res = await exec('git remote get-url origin', false, { cwd: process.cwd(), env: process.env })
      if (res.status === 'ok') {
        const { data } = await Update.update(process.cwd(), cmd)
        msg.push(`Karin：${data}`)
      }

      // 更新依赖 emmm 主要是为了更新node-karin 先这样 后续兼容其他包管理器 包括使用其他源获取最新版本
      await exec('pnpm install -P', false, { cwd: process.cwd(), env: process.env })
    } catch (error) {
      msg.push(`Karin：${error.message}`)
    }

    const promises = list.map(async name => {
      /** 拼接路径 */
      const item = process.cwd() + `/plugins/${name}`
      try {
        const { data } = await Update.update(item, cmd)
        msg.push(`${name}：${data}`)
        if (!isRestart && data.includes('更新成功')) isRestart = true
      } catch (error) {
        msg.push(`${name}：${error.message}`)
      }
    })

    await Promise.all(promises)

    if (Config.Config.forward) {
      const elements = msg.map(i => segment.text(i))
      const makeForward = common.makeForward(elements, this.e.user_id, this.e.sender.nick)
      await this.replyForward(makeForward)
    } else {
      await this.reply(`\n全部更新完成：\n${msg.join('\n\n')}`, { at: true })
    }

    if (!isRestart) return true

    if (Config.Config.restart) {
      await this.reply(`\n更新完成，开始重启 本次运行时间：${common.uptime()}`, { at: true })
      try {
        const restart = new Restart()
        restart.e = this.e
        await restart.CmdRestart()
        return true
      } catch (error) {
        return this.reply(`\n重启失败\n${error.message}`, { at: true })
      }
    }

    // 已关闭自动重启
    return this.reply('\n已关闭自动重启，请自行重启使更新生效~', { at: true })
  }

  pluginName (name) {
    const _path = process.cwd()
    let filePath = `${_path}/plugins/karin-plugin-${name}`
    if (fs.existsSync(filePath)) return filePath

    filePath = `${_path}/plugins/karin-adapter-${name}`
    if (fs.existsSync(filePath)) return filePath

    this.e.reply('未找到该插件', { at: true })
    return false
  }
}
