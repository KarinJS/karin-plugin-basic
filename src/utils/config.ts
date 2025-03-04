import fs from 'node:fs'
import path from 'node:path'
import { info } from '@/root'
import {
  watch,
  basePath,
  filesByExt,
  copyConfigSync,
  requireFileSync,
} from 'node-karin'
import type { Config } from '@/types/config'

let cache: Config | undefined

/** 用户配置目录 */
const dir = path.join(basePath, info.name, 'config')
/** 默认配置目录 */
const defConfig = path.join(info.dir, 'config')

const main = () => {
  /** 复制默认配置 */
  copyConfigSync(defConfig, dir, ['.json'])

  /**
   * @description 监听配置文件
   */
  setTimeout(() => {
    const list = filesByExt(dir, '.json', 'abs')
    list.forEach(file => watch(file, (old, now) => {
      cache = undefined
    }))
  }, 2000)
}

/**
 * @description 配置文件
 */
export const config = (): Config => {
  if (cache) return cache
  const user = requireFileSync(`${dir}/config.json`)
  const def = requireFileSync(`${defConfig}/config.json`)
  const result: Config = { ...def, ...user }

  cache = result
  return result
}

/**
 * 写入配置
 * @param config 配置
 */
export const writeConfig = (config: Config) => {
  const def = requireFileSync(`${defConfig}/config.json`)
  const result: Config = { ...def, ...config }

  cache = result
  fs.writeFileSync(`${dir}/config.json`, JSON.stringify(result, null, 2))
}
main()
