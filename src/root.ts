import path from 'node:path'
import pkg from '../package.json'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __pluginDir = path.resolve(__dirname, '../')

/** 插件目录信息 */
export const info = {
  /** 插件目录 */
  dir: __pluginDir,
  /** 插件名称 */
  name: pkg.name.replace(/\//g, '-'),
  /** 插件版本 */
  version: pkg.version,
  /** package.json */
  pkg
}
