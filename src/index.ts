import { logger } from 'node-karin'
import { plugin } from './utils'

export * from './core'

logger.info(`${logger.violet(`[插件:${plugin.name}]`)} ${logger.green(plugin.version)} 初始化完成~`)
