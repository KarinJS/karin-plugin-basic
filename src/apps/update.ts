import fs from 'node:fs'
import path from 'node:path'
import { changelog, checkGitPluginUpdate, checkPkgUpdate, getCommit, getPlugins, getPkgVersion, karin, updateAllGitPlugin, updateAllPkg, updateGitPlugin, updatePkg, segment, restartDirect, db } from 'node-karin'
import { config } from '@/utils/config'
import { sendToFirstAdmin } from '@/utils/utils'

const NODE_KARIN_UPDATE_KEY = 'basic:update:node-karin'
const cache: string[] = []

interface BasicUpdateStat {
  lastRemote: string
  lastLocal: string
}

const getAll = async () => {
  if (cache.length) return cache
  const git = await getPlugins('git', false)
  const npm = await getPlugins('npm', false)
  const list = [
    'npm:node-karin',
    ...git.map(name => `git:${name}`),
    ...npm.map(name => `npm:${name}`)
  ]

  cache.push(...list)
  setTimeout(() => {
    cache.length = 0
  }, 60000)
  return list
}

/** 插件列表 */
export const plugins = karin.command(/^#插件列表$/, async (e) => {
  const list = await getAll()
  list.forEach((item, index) => {
    item += `${index + 1}. ${item}`
  })

  await e.reply([
    '\n插件列表：',
    '更新：#更新插件 序号或名称',
    '检查更新：#检查更新 序号或名称',
    '日志：#更新日志 条数 序号或名称',
    ...list,
  ].join('\n'), { at: true })

  return true
}, { name: '插件列表', perm: 'admin' })

/** 检查更新 */
export const check = karin.command(/^#检查更新/, async (e) => {
  let name = e.msg.replace(/^#检查更新/, '').trim()

  /** 传入的是序号 */
  const index = Number(name)
  if (index && typeof index === 'number') {
    const list = await getAll()
    name = list[index - 1]
  }

  if (!name) {
    await e.reply('\n请输入正确的插件名称或序号~', { at: true })
    return true
  }

  const tips = '当前版本已是最新版本'

  if (name.includes('git:')) {
    name = name.replace('git:', '')
    const file = path.join(process.cwd(), 'plugins', name.replace('git:', ''))
    const result = await checkGitPluginUpdate(file)
    if (result.status === 'error') {
      const { data } = result
      const msg = typeof data === 'string' ? data : `获取更新信息失败: ${data.message || '未知错误'}`
      await e.reply(msg, { at: true })
      return true
    }

    if (result.status === 'no') {
      await e.reply(`\n${tips}${result.data.replace(tips + '\n', '')}`, { at: true })
      return true
    }

    await e.reply([
      '\n存在新版本:',
      `名称：${name}`,
      `落后: ${result.count}次提交`,
      `更新日志：\n${result.data}`,
    ].join('\n'), { at: true })
    return true
  }

  if (name.includes('npm:')) {
    name = name.replace('npm:', '')
    const result = await checkPkgUpdate(name)
    if (result.status === 'no') {
      await e.reply(`\n当前版本: ${result.local}\n${tips}`, { at: true })
      return true
    }

    if (result.status === 'error') {
      const { error } = result
      const msg = `获取更新信息失败: ${(error as Error).message || '未知错误'}`
      await e.reply(msg, { at: true })
      return true
    }

    await e.reply([
      '\n存在新版本:',
      `名称：${name}`,
      `当前版本: ${result.local}`,
      `最新版本: ${result.remote}`,
    ].join('\n'), { at: true })
    return true
  }

  await e.reply('\n请输入正确的插件名称或序号~', { at: true })
  return true
}, { name: '检查更新', perm: 'admin' })

/** 更新插件 */
export const update = karin.command(/^#(强制)?更新(插件)?(?!列表|日志)/, async (e) => {
  let name = e.msg.replace(/^#(强制)?更新(插件)?(?!列表|日志)/, '').trim()

  /** 传入的是序号 */
  const index = Number(name)
  if (index && typeof index === 'number') {
    const list = await getAll()
    name = list[index - 1]
  }

  if (!name) {
    await e.reply('\n请输入正确的插件名称或序号~', { at: true })
    return true
  }

  if (name.includes('git:')) {
    name = name.replace('git:', '')
    const file = path.join(process.cwd(), 'plugins', name.replace('git:', ''))

    let cmd = 'git pull'
    if (e.msg.includes('强制')) cmd = 'git reset --hard && git pull --allow-unrelated-histories'

    const result = await updateGitPlugin(file, cmd, 120)
    if (result.status === 'failed') {
      const { data } = result
      const msg = typeof data === 'string' ? data : `获取更新信息失败: ${data.message || '未知错误'}`
      await e.reply(msg, { at: true })
      return true
    }

    await e.reply(`\n${result.data}`, { at: true })
    return true
  }

  if (name.includes('npm:')) {
    name = name.replace('npm:', '')
    const result = await updatePkg(name)

    if (result.status === 'failed') {
      const { data } = result
      const msg = typeof data === 'string' ? data : `获取更新信息失败: ${data.message || '未知错误'}`
      await e.reply(`\n${msg}`, { at: true })
      return true
    }

    const log = parseLog(name, result.local, result.remote)

    await e.reply(`\n更新成功\n当前版本: ${result.remote}\n更新日志: \n${log}`, { at: true })
    return true
  }

  await e.reply('\n请输入正确的插件名称或序号~', { at: true })
  return true
}, { name: '更新插件', perm: 'admin' })

/** 更新日志 */
export const log = karin.command(/^#更新日志/, async (e) => {
  // 更新日志 npm:node-karin 10
  const [index, num] = e.msg.replace(/^#更新日志/, '').trim().split(' ')

  if (!index || !num) {
    await e.reply('\n请输入正确的命令 #更新日志 <序号或插件名称> [日志数量]', { at: true })
    return true
  }

  const count = Number(num) || 10
  let name = index
  if (Number(index)) {
    const list = await getAll()
    name = list[Number(index) - 1]
  }

  if (!name) {
    await e.reply('\n请输入正确的插件名称或序号~', { at: true })
    return true
  }

  if (name.includes('npm:')) {
    name = name.replace('npm:', '')
    const local = await getPkgVersion(name)
    if (!local) {
      await e.reply('获取插件版本失败，请检查是否存在此插件', { at: true })
    } else {
      const result = parseLog(name, local, count)
      await e.reply(`\n${result}`, { at: true })
    }
    return true
  }

  if (name.includes('git:')) {
    name = name.replace('git:', '')
    const file = path.join(process.cwd(), 'plugins', name)
    const result = await getCommit({ path: file, count })
    await e.reply(`\n${result}`, { at: true })
    return true
  }

  await e.reply('\n请输入正确的插件名称或序号~', { at: true })
  return true
}, { name: '更新日志', perm: 'admin' })

/** 全部更新 */
export const updateAll = karin.command(/^#全部(强制)?更新$/, async (e) => {
  const cmd = e.msg.includes('强制') ? 'git reset --hard && git pull --allow-unrelated-histories' : 'git pull'
  try {
    const git = await updateAllGitPlugin(cmd)
    const npm = await updateAllPkg()
    await e.reply([
      '\n全部更新完成',
      '-----',
      git,
      '-----',
      npm,
    ].join('\n'), { at: true })
  } catch (error) {
    await e.reply(`\n全部更新失败: ${(error as Error).message || '未知错误'}`, { at: true })
  }

  return true
}, { name: '全部更新', perm: 'admin' })

/**
 * @param pkg npm包名
 * @param local 本地版本
 * @param count 提取的日志数量 或 版本号
 */
const parseLog = (pkg: string, local: string, count: number | string) => {
  const file = path.join(process.cwd(), 'node_modules', pkg, 'CHANGELOG.md')
  if (!fs.existsSync(file)) return '插件未提供`CHANGELOG.md`文件'

  const data = fs.readFileSync(file, 'utf-8')
  if (typeof count === 'number') {
    return changelog.logs(data, local, count) || '未找到对应的更新日志'
  }

  return changelog.range(data, local, count) || '未找到对应的更新日志'
}

export const TaskUpdate = karin.task('Karin-定时更新检查', '*/10 * * * *', async () => {
  if (process.env.NODE_ENV === 'development') return true

  const res = await checkPkgUpdate('node-karin')
  if (res.status !== 'yes') return true

  const botIds = karin.getAllBotID()
  const selfId = botIds.find(id => id.toString() !== 'console')
  if (!selfId) return true

  const oc = config()

  if (oc.autoupdate) {
    const up = await updatePkg('node-karin')
    if (up.status === 'failed') {
      await sendToFirstAdmin(selfId, [segment.text(`自动更新 node-karin 失败: ${String(up.data)}`)])
      return true
    }

    await sendToFirstAdmin(selfId, [
      segment.text(
        `检测到插件 [node-karin] 有新版本~\n已自动更新 (v${up.local} → v${up.remote})，即将重启以应用更新`
      ),
    ])
    await restartDirect({ isPm2: false, reloadDeps: true })
    return true
  }

  const last = await db.get<BasicUpdateStat>(NODE_KARIN_UPDATE_KEY)
  if (last && last.lastRemote === res.remote) return true

  const msg = [
    segment.text(
      `检测到插件 [node-karin] 有新版本~\n当前版本: v${res.local}\n最新版本: v${res.remote}\n请发送 #更新 进行更新。`
    ),
  ] as Parameters<typeof karin.sendMsg>[2]

  const messageId = await sendToFirstAdmin(selfId, msg)
  if (!messageId) return false

  await db.set(NODE_KARIN_UPDATE_KEY, {
    lastRemote: res.remote,
    lastLocal: res.local
  })

  return true
}, { name: 'Karin-定时更新检查', log: false })
