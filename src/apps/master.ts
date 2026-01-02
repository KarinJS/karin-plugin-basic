import crypto from 'crypto'
import { karin, logger, config, segment, SendMessage } from 'node-karin'

const CAPTCHA = new Map<string, string>()
export const Master = karin.command(/^#设置主人$/, async (e) => {
  if (e.isMaster) {
    await e.reply(`\n[${e.userId}] 已经是主人`, { at: true })
    return true
  }
  const sign = crypto.randomUUID()
  logger.mark(`设置主人验证码：${logger.green(sign)}`)
  CAPTCHA.set(e.userId, sign)
  await e.reply('\n请输入控制台验证码', { at: true })
  const event = await karin.ctx(e)

  if (sign !== event.msg.trim()) {
    await e.reply('验证码错误', { at: true })
    return true
  }

  const name = 'config' as const
  const data = config.getYaml(name, 'user')
  data.master.push(e.userId)
  config.setYaml(name, data)

  await e.reply('\n设置主人成功', { at: true })
  return true
}, { name: '设置主人', priority: -1 })

export const addMaster = karin.command(/^#新增主人/, async (e) => {
  const userId = e.at[0] || e.msg.replace(/^#新增主人/, '').trim()
  if (!userId) {
    await e.reply('请输入需要新增主人的账号或者艾特ta', { at: true })
    return true
  }
  const Master = config.master()
  if (Master.includes(userId)) {
    await e.reply(`[${userId}] 已经是主人`, { at: true })
    return true
  }

  const name = 'config' as const
  const data = config.getYaml(name, 'user')
  data.master.push(userId)
  config.setYaml(name, data)

  await e.reply(`\n新增主人: ${userId}`, { at: true })
  return true
}, { name: '新增主人', priority: -1, permission: 'master' })

export const delMaster = karin.command(/^#删除主人/, async (e) => {
  const userId = e.at[0] || e.msg.replace(/^#删除主人/, '').trim() || e.userId
  if (userId === e.userId) {
    if (e.isMaster) {
      await e.reply(`\n[${e.userId}] 不可以删除自己`, { at: true })
      return true
    }
  } else if (!config.master().includes(userId)) {
    await e.reply(`\n[${userId}] 不是主人`, { at: true })
    return true
  }

  const name = 'config' as const
  const data = config.getYaml(name, 'user')
  data.master = data.master.filter((v: string) => v !== userId)
  config.setYaml(name, data)

  await e.reply(`\n删除主人: ${userId}`, { at: true })
  return true
}, { name: '删除主人', priority: -1, permission: 'master' })

export const listMaster = karin.command(/^#主人列表$/, async (e) => {
  const masters = config.master()
  await e.reply(`主人列表:\n${masters.map(v => `- ${v}`).join('\n')}`, { reply: true })
  return true
}, { name: '主人列表', priority: -1, permission: 'master' })

export const setMasterCaptcha = karin.command(/^#设置主人验证码$/, async (e) => {
  const msg: SendMessage = []
  CAPTCHA.forEach((v, k) => {
    msg.push(segment.text(`- 用户: ${k} 验证码: ${v}`))
  })
  if (msg.length === 0) return e.reply('暂无验证码', { reply: true })
  await e.reply(['主人验证码列表:\n', ...msg], { reply: true })
}, { name: '设置主人验证码', priority: -1, permission: 'master' })
