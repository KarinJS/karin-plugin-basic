import { logger } from 'node-karin'
import { info } from '@/root'

/** 请不要在这编写插件 不会有任何效果~ */
logger.info(`${logger.violet(`[插件:${info.version}]`)} ${logger.green(info.pkg.name)} 初始化完成~`)
