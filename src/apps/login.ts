import { config } from '@/utils/config'
import karin, { common, contactFriend, logger, segment } from 'node-karin'
import axios from 'node-karin/axios'
import os from 'node:os'

const url = { IPv4: ['https://4.ipw.cn'], IPv6: ['https://6.ipw.cn'] }

export const login = karin.command(/#?(面板|web)登录$/i, async (e) => {
  const net = os.networkInterfaces()
  const cfg = config()
  const IP: { lan: { ipv4: null | string, ipv6: null | string }, net: { ipv4: null | string, ipv6: null | string } } =
    { lan: { ipv4: null, ipv6: null }, net: { ipv4: null, ipv6: null } }
  for (const i in net) {
    for (const iface of net[i]!) {
      if (iface.internal) continue
      if (iface.family === 'IPv4') {
        const ip = iface.address
        if (
          ip.startsWith('192.168.') ||
          ip.startsWith('10.') ||
          (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)
        ) {
          IP.lan.ipv4 = ip
        }
      } else if (iface.family === 'IPv6') {
        const ip = iface.address
        if (ip.startsWith('fd') || ip.startsWith('fe80:') || ip.startsWith('fc')) {
          IP.lan.ipv6 = ip
        }
      }
    }
  }
  IP.net.ipv4 = await getnetIP('IPv4')
  IP.net.ipv6 = await getnetIP('IPv6')
  const port = process.env.HTTP_PORT
  const token = process.env.HTTP_AUTH_KEY
  const msg = [segment.text('面板登录地址：')]
  if (cfg.domain) msg.push(segment.text(`- 自定义域名: ${cfg.domain}/web/login?token=${token}`))
  msg.push(segment.text(`- 内网地址: ${IP.lan.ipv4 ? `http://${IP.lan.ipv4}:${port}/web/login?token=${token}` : `http://${IP.lan.ipv4}:${port}/web/login?token=${token}`}`))
  if (IP.net.ipv4) msg.push(segment.text(`- 外网IPv4地址: http://${IP.net.ipv4}:${port}/web/login?token=${token}`))
  if (IP.net.ipv6) msg.push(segment.text(`- 外网IPv6地址: http://${IP.net.ipv6}:${port}/web/login?token=${token}`))
  try {
    const content = common.makeForward(msg, e.selfId, e.bot.account.name)
    await e.bot.sendForwardMsg(contactFriend(e.userId), content)
    if (e.isGroup) await e.reply('登录地址已经私信给主人了哦~')
  } catch (err) {
    msg.forEach(item => {
      item.text = item.text + '\n'
    })
    await e.bot.sendMsg(contactFriend(e.userId), msg)
    if (e.isGroup) await e.reply('登录地址已经私信给主人了哦~')
    return true
  }
  return true
}, { name: '面板登录', perm: 'admin' })

async function getnetIP (type: 'IPv4' | 'IPv6') {
  for (const i of url[type] || []) {
    try {
      const res = await axios.get(i)
      if (res.data) {
        return res.data
      }
    } catch (e) {
      logger.error(`访问${i}获取外网${type}地址失败: ${e}`)
      continue
    }
  }
  return null
}
