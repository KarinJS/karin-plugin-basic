import fs from 'node:fs'
import path from 'node:path'
import { karin, logger } from 'node-karin'
import { render } from '@/utils/render'

// ANSI 相关常量
const ESC = '\u001b'
const ANSI_REGEX = new RegExp(`${ESC}\\[([0-9;]+)m`, 'g')

const escapeHtml = (str: string) => str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const ANSI_COLOR_MAP: Record<number, string> = {
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

// 日志行匹配相关常量
const LOG_TIME_PREFIX_REGEX = /^\[\d{2}:\d{2}:\d{2}\.\d{3}\]/
const LOG_HEADER_REGEX = /^(\[\d{2}:\d{2}:\d{2}\.\d{3}\])(\[(?:INFO|WARN|ERROR|ERRO|FATAL|DEBUG|TRACE|MARK)\])/

const LOG_LEVEL_COLOR_CODE: Record<string, string> = {
  INFO: '\x1b[32m', // 绿色
  WARN: '\x1b[33m', // 黄色
  ERROR: '\x1b[31m', // 红色
  ERRO: '\x1b[31m', // 兼容旧字段
  FATAL: '\x1b[35m', // 紫色
  DEBUG: '\x1b[90m', // 灰色
  TRACE: '\x1b[90m', // 灰色
  MARK: '\x1b[90m', // 灰色
}

/**
 * 将 ANSI 颜色码转换为带样式的 HTML 片段
 */
const ansiToHtml = (text: string): string => {
  if (!text) return ''

  let result = ''
  let lastIndex = 0
  let openSpan = ''

  text.replace(ANSI_REGEX, (match, codesStr, offset) => {
    const chunk = text.slice(lastIndex, offset)
    if (chunk) {
      result += escapeHtml(chunk)
    }
    lastIndex = offset + match.length

    const codes = codesStr.split(';').map((n: string) => parseInt(n, 10))

    // 每次遇到 ANSI 码，先尝试关闭之前的 span
    if (openSpan) {
      result += '</span>'
      openSpan = ''
    }

    // 24bit 颜色: 38;2;r;g;b
    // 注意：像 38;2;255;255;0 这样的序列，最后的 0 是颜色分量，不能被当成重置码
    if (codes[0] === 38 && codes[1] === 2 && codes.length >= 5) {
      const r = codes[2]
      const g = codes[3]
      const b = codes[4]
      // 确保是有效颜色值，否则不生成 span
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        openSpan = `color: rgb(${r}, ${g}, ${b})`
        result += `<span style="${openSpan}">`
      }
      return ''
    }

    // 重置 (0) 或 默认前景色 (39)
    // 仅当它们是唯一的代码时才视为重置，避免误伤 24bit 颜色中的 0 分量
    if (codes.length === 1 && (codes[0] === 0 || codes[0] === 39)) {
      return ''
    }

    // 标准前景色
    const colorCode = codes.find((c: number) => ANSI_COLOR_MAP[c])
    if (colorCode !== undefined) {
      const color = ANSI_COLOR_MAP[colorCode]
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
 * 给日志等级加上 ANSI 颜色
 * 规则：[时间] 的颜色跟随 [等级] 的颜色
 */
const colorizeLog = (line: string) => {
  // 匹配行首的 [时间][等级] 结构
  // 用户指出日志文件内不包含 [Karin] 前缀，统一以 [时间][等级] 开头
  return line.replace(LOG_HEADER_REGEX, (match, timePart, levelPart) => {
    // 提取等级文本，移除 []
    const levelKey = levelPart.replace('[', '').replace(']', '')

    const colorCode = LOG_LEVEL_COLOR_CODE[levelKey] ?? '\x1b[37m'

    // 将颜色应用于 [时间][等级] 整体，并在之后立即重置
    return `${colorCode}${timePart}${levelPart}\x1b[0m`
  })
}

/**
 * 按日志条目分组
 * 确保多行错误堆栈属于同一个日志条目
 */
const groupLogLines = (lines: string[]): string[] => {
  const groups: string[][] = []
  let current: string[] = []

  // 匹配 [HH:mm:ss.ms] 开头，视为新日志
  const isNewEntry = (line: string) => LOG_TIME_PREFIX_REGEX.test(line)

  for (const line of lines) {
    if (!line.trim()) continue

    if (isNewEntry(line)) {
      if (current.length) groups.push(current)
      current = [line]
    } else {
      if (current.length) {
        current.push(line)
      } else {
        current = [line]
      }
    }
  }
  if (current.length) groups.push(current)

  return groups.map(g => g.join('\n'))
}

/**
 * 读取并分组日志文件，返回按时间排序的最后 N 条
 */
const readAndGroupLogFile = (logFile: string, limit: number): string[] => {
  const content = fs.readFileSync(logFile, 'utf-8')
  const lines = content.split('\n')
  const groups = groupLogLines(lines)
  // 默认按时间正序渲染（旧 -> 新），即从上到下
  // 如果希望最新的日志显示在最上方，可以改为：
  // return groups.slice(-limit).reverse()
  return groups.slice(-limit)
}

/**
 * 读取当天日志的最后 N 条（默认 100 条）
 */
const getTodayLogs = async (limit = 100): Promise<string[]> => {
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
      return readAndGroupLogFile(latestLog, limit)
    }

    return readAndGroupLogFile(logFile, limit)
  } catch (error) {
    logger.error('读取日志文件失败:', error)
    return ['读取日志失败']
  }
}

/**
 * 读取错误日志的最后 N 条（默认 100 条）
 * 仅使用 @karinjs/logs/error 目录，旧的 logs 根目录 logger.error.* 已废弃
 */
const getErrorLogs = async (limit = 100): Promise<string[]> => {
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

    return readAndGroupLogFile(logFile, limit)
  } catch (error) {
    logger.error('读取错误日志文件失败:', error)
    return []
  }
}

export const logViewer = karin.command(/^#日志\s*(\d+)?$/, async (e) => {
  const match = e.msg.match(/^#日志\s*(\d+)?$/)
  let limit = match && match[1] ? Number(match[1]) : 50
  if (!Number.isFinite(limit) || limit <= 0) limit = 50
  if (limit > 1000) limit = 1000

  const logs = await getTodayLogs(limit)
  const logsHtml = logs.map(line => ansiToHtml(colorizeLog(line)))

  try {
    const img = await render('logger/index', {
      logs: logsHtml,
      total: logs.length,
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

  const logsHtml = logs.map(line => ansiToHtml(colorizeLog(line)))

  try {
    const img = await render('logger/index', {
      logs: logsHtml,
      total: logs.length,
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
