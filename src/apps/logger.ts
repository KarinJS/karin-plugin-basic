import fs from 'node:fs'
import path from 'node:path'
import { karin, logger } from 'node-karin'
import { render } from '@/utils/render'

/**
 * 将 ANSI 颜色码转换为带样式的 HTML 片段
 */
const ansiToHtml = (text: string): string => {
  if (!text) return ''

  const ESC = '\u001b'
  const ansiRegex = new RegExp(`${ESC}\\[([0-9;]+)m`, 'g')

  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  let result = ''
  let lastIndex = 0
  let openSpan = ''

  const colorMap: Record<number, string> = {
    30: '#020617',
    31: '#ef4444',
    32: '#22c55e',
    33: '#eab308',
    34: '#3b82f6',
    35: '#ec4899',
    36: '#06b6d4',
    37: '#e5e7eb',
    90: '#6b7280',
    91: '#f97373',
    92: '#4ade80',
    93: '#fde047',
    94: '#60a5fa',
    95: '#a855f7',
    96: '#38bdf8',
    97: '#f9fafb',
  }

  text.replace(ansiRegex, (match, codesStr, offset) => {
    const chunk = text.slice(lastIndex, offset)
    if (chunk) {
      result += escapeHtml(chunk)
    }
    lastIndex = offset + match.length

    const codes = codesStr.split(';').map((n: string) => Number(n) || 0)

    // 关闭当前颜色
    if (openSpan) {
      result += '</span>'
      openSpan = ''
    }

    // 重置
    if (codes.includes(0) || codes.includes(39)) {
      return ''
    }

    // 24bit 颜色: 38;2;r;g;b
    if (codes[0] === 38 && codes[1] === 2 && codes.length >= 5) {
      const r = codes[2]
      const g = codes[3]
      const b = codes[4]
      openSpan = `color: rgb(${r}, ${g}, ${b})`
      result += `<span style="${openSpan}">`
      return ''
    }

    // 标准前景色
    const colorCode = codes.find((c: number) => colorMap[c])
    if (colorCode !== undefined) {
      const color = colorMap[colorCode]
      openSpan = `color: ${color}`
      result += `<span style="${openSpan}">`
      return ''
    }

    return ''
  })

  const tail = text.slice(lastIndex)
  if (tail) {
    result += escapeHtml(tail)
  }
  if (openSpan) {
    result += '</span>'
  }

  return result
}

/**
 * 去掉首尾纯空行，保留中间换行与缩进
 */
const trimEmptyLines = (text: string): string => {
  const lines = text.split('\n')
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  return lines.join('\n')
}

/**
 * 按一条完整日志分组（支持多行错误堆栈）
 * 规则：以 [时间][等级] 开头视为一条新日志的开始
 */
const groupLogLines = (lines: string[]): string[] => {
  const groups: string[][] = []
  let current: string[] = []

  const isNewEntry = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return false
    // 日志格式示例: [10:26:02.132][INFO] ...
    return /^\[\d{2}:\d{2}:\d{2}\.\d{3}\]\[[A-Z]+]/.test(trimmed)
  }

  for (const line of lines) {
    if (isNewEntry(line)) {
      if (current.length) groups.push(current)
      current = [line]
    } else {
      // 堆栈或附加信息，追加到当前日志
      if (current.length) {
        current.push(line)
      } else {
        // 如果文件开头就是非标准行，单独作为一条
        current = [line]
      }
    }
  }

  if (current.length) groups.push(current)

  return groups.map(item => item.join('\n'))
}

/**
 * 读取当天日志的最后 N 条（默认 50 条）
 */
const getTodayLogs = async (limit = 50): Promise<string[]> => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const logDir = path.join(process.cwd(), '@karinjs', 'logs')
  const logFile = path.join(logDir, `logger.${today}.log`)

  try {
    // 检查文件是否存在
    if (!fs.existsSync(logFile)) {
      // 如果今天的日志不存在，查找最新的日志文件
      const files = fs.readdirSync(logDir)
        .filter(f => f.startsWith('logger.') && f.endsWith('.log') && !f.includes('error'))
        .sort()
        .reverse()

      if (files.length === 0) {
        return ['暂无日志记录']
      }

      const latestLog = path.join(logDir, files[0])
      const content = fs.readFileSync(latestLog, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      const groups = groupLogLines(lines)
      // 获取最后 limit 条日志（按条，不是按行），并反转顺序（最新的在最上面）
      return groups.slice(-limit).reverse()
    }

    const content = fs.readFileSync(logFile, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim())

    const groups = groupLogLines(lines)
    // 获取最后 limit 条，并反转顺序（最新的在最上面）
    return groups.slice(-limit).reverse()
  } catch (error) {
    logger.error('读取日志文件失败:', error)
    return ['读取日志失败']
  }
}

/**
 * 读取错误日志的最后 N 条（默认 50 条）
 * 仅使用 @karinjs/logs/error 目录，旧的 logs 根目录 logger.error.* 已废弃
 */
const getErrorLogs = async (limit = 50): Promise<string[]> => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const errorDir = path.join(process.cwd(), '@karinjs', 'logs', 'error')

  if (!fs.existsSync(errorDir)) {
    return []
  }

  let logFile: string | null = null

  try {
    const todayLoggerError = path.join(errorDir, `logger.error.${today}.log`)
    const todayError = path.join(errorDir, `error.${today}.log`)

    if (fs.existsSync(todayLoggerError)) {
      logFile = todayLoggerError
    } else if (fs.existsSync(todayError)) {
      logFile = todayError
    } else {
      const files = fs.readdirSync(errorDir)
        .filter(f => f.endsWith('.log'))
        .sort()
        .reverse()
      if (files.length) {
        logFile = path.join(errorDir, files[0])
      }
    }

    if (!logFile) return []

    const content = fs.readFileSync(logFile, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim())
    const groups = groupLogLines(lines)
    return groups.slice(-limit).reverse()
  } catch (error) {
    logger.error('读取错误日志文件失败:', error)
    return []
  }
}

/**
 * 解析日志行，提取时间、级别、来源和消息
 */
const parseLogLine = (line: string) => {
  // 支持多行日志：第一行是头，后面是堆栈
  const [firstLine, ...rest] = line.split('\n')

  // 日志格式示例: [10:26:02.132][INFO]  消息...
  let time = ''
  let levelRaw = 'INFO'

  const timeMatch = firstLine.match(/^\[(\d{2}:\d{2}:\d{2}\.\d{3})]/)
  const levelMatch = firstLine.match(/\[([A-Z]+)]/)
  if (timeMatch) time = timeMatch[1]
  if (levelMatch) levelRaw = levelMatch[1]

  const levelKey = levelRaw.toLowerCase()
  const level = levelKey === 'erro' ? 'error' : levelKey

  const messageHead = firstLine.replace(/^\[\d{2}:\d{2}:\d{2}\.\d{3}]\[[A-Z]+]\s*/, '')

  const messageTail = rest.length ? '\n' + rest.join('\n') : ''

  // 先拼接，再去掉首尾空行，避免最上面多出一行空白
  const fullMessage = trimEmptyLines(`${messageHead}${messageTail}`)
  // 去掉 ANSI 码得到纯文本
  // eslint-disable-next-line no-control-regex
  const plainMessage = fullMessage.replace(/\u001b\[[0-9;]+m/g, '')

  return {
    time,
    level,
    message: plainMessage,
    messageHtml: ansiToHtml(fullMessage)
  }
}

export const logViewer = karin.command(/^#日志\s*(\d+)?$/, async (e) => {
  const match = e.msg.match(/^#日志\s*(\d+)?$/)
  let limit = match && match[1] ? Number(match[1]) : 50
  if (!Number.isFinite(limit) || limit <= 0) limit = 50
  if (limit > 1000) limit = 1000

  const logs = await getTodayLogs(limit)
  const parsedLogs = logs.map(parseLogLine)

  try {
    const img = await render('logger/index', {
      logs: parsedLogs,
      total: parsedLogs.length,
      date: new Date().toLocaleString('zh-CN')
    })

    await e.reply(img)
    return true
  } catch (error) {
    logger.error('渲染日志失败:', error)
    await e.reply('日志渲染失败，请查看控制台错误信息')
    return false
  }
}, { name: '日志查看器', perm: 'admin' })

export const errorLogViewer = karin.command(/^#错误日志\s*(\d+)?$/, async (e) => {
  const match = e.msg.match(/^#错误日志\s*(\d+)?$/)
  let limit = match && match[1] ? Number(match[1]) : 50
  if (!Number.isFinite(limit) || limit <= 0) limit = 50
  if (limit > 200) limit = 200

  const logs = await getErrorLogs(limit)

  if (!logs.length) {
    await e.reply('暂无错误日志')
    return true
  }

  const parsedLogs = logs.map(parseLogLine)

  try {
    const img = await render('logger/index', {
      logs: parsedLogs,
      total: parsedLogs.length,
      date: new Date().toLocaleString('zh-CN')
    })

    await e.reply(img)
    return true
  } catch (error) {
    logger.error('渲染错误日志失败:', error)
    await e.reply('错误日志渲染失败，请查看控制台错误信息')
    return false
  }
}, { name: '错误日志查看器', perm: 'admin' })
