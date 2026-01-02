import { logger, restartDirect } from 'node-karin'
import { plugin } from './utils'
import { cfg } from './config'

export * from './core'

const autorestart = +cfg.get().autorestart

if (autorestart && typeof autorestart === 'number' && autorestart > 0) {
  setTimeout(() => {
    logger.info(`${logger.violet(`[插件:${plugin.name}]`)} 开始自动重启...`)
    restartDirect()
  }, autorestart * 1000)
}

logger.info(`${logger.violet(`[插件:${plugin.name}]`)} ${logger.green(plugin.version)} 初始化完成~`)
