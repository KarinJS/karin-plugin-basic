import { App, Update } from '#Karin'

const app = App.init({
  name: '更新日志',
  dsc: '插件更新日志',
  priority: -1
})

app.reg({
  reg: /#更新日志/,
  fnc: 'log',
  async log () {
    if (!this.e.isMaster) return false
    const msg = this.e.msg.replace(/#更新日志/, '').trim()
    let [count, name] = msg.split(' ')
    /** count 只可以查100 */
    if (count > 100) {
      return this.reply('最多只能查100条更新日志', { at: true })
    }

    const update = new Update()
    const res = await update.log({ name, count })
    const { ok, data } = res
    if (ok) {
      this.reply(`${name || 'karin'}更新日志(${count}条)\n\n` + data.trim(), { reply: true })
    } else {
      this.reply(`获取更新日志失败：${data.toString()}`, { reply: true })
    }
  }
})

app.reg({
  reg: /#更新/,
  fnc: 'update',
  async update () {
    if (!this.e.isMaster) return false
    const name = this.e.msg.replace(/#更新/, '').trim()
    const up = new Update()
    const res = await up.update(name, 'git pull')
    const { ok, data } = res
    if (ok) {
      this.reply((name || 'karin') + data.trim(), { at: true })
    } else {
      this.reply(`更新失败：${data.toString()}`, { at: true })
    }
  }
})

export const update = app.plugin(app)
