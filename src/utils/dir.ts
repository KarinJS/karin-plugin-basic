import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { karinPathBase } from 'node-karin'
import pkg from '../../package.json'

const __filename = fileURLToPath(import.meta.url)
let filePath = path.resolve(__filename.replace(/\\/g, '/'), '../../..')
if (!fs.existsSync(path.join(filePath, 'package.json'))) {
  filePath = path.resolve(__filename.replace(/\\/g, '/'), '../..')
}

export const plugin = {
  /** 插件名 */
  name: pkg.name.replace(/\//g, '-'),
  /** 插件版本 */
  version: pkg.version,
  /** 插件绝对路径 */
  dir: filePath,
  /** 插件 package.json */
  pkg,
  /** 插件在 @karinjs 中的目录 */
  get BaseDir () {
    return path.join(karinPathBase, this.name)
  },
  /** 配置文件路径 */
  get ConfigDir () {
    return path.join(this.BaseDir, 'config')
  }
}
