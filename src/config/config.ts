import fs from 'node:fs'
import path from 'node:path'
import { watch, filesByExt, requireFileSync, logger } from 'node-karin'
import type { Config as ConfigType } from './types'
import { plugin } from '@/utils'

/**
 * 配置管理类
 */
class Config {
  /** 配置缓存 */
  private cache: ConfigType | undefined
  /** 用户配置目录 */
  private dir: string = plugin.ConfigDir
  /** 配置文件路径 */
  private configPath: string = path.join(this.dir, 'config.json')
  /** 默认配置 */
  private readonly defaultConfig: ConfigType = {
    status: true,
    forward: true,
    restartMode: true,
    restart: true,
    domain: '',
    autoupdate: false,
    autorestart: 0,
  }

  constructor () {
    this.init()
    this.watchConfig()
  }

  /**
   * 初始化配置文件
   */
  private init (): void {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true })
    }

    // 如果配置文件不存在，创建默认配置
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.defaultConfig, null, 2)
      )
    }
  }

  /**
   * 监听配置文件变化
   */
  private watchConfig (): void {
    setTimeout(() => {
      const list = filesByExt(this.dir, '.json', 'abs')
      list.forEach((file) => {
        watch(file, () => {
          // 配置文件变化时清空缓存
          this.cache = undefined
        })
      })
    }, 2000)
  }

  /**
   * 获取配置
   * @returns 配置对象
   */
  get (): ConfigType {
    // 如果缓存存在，直接返回缓存
    if (this.cache) {
      return this.cache
    }

    try {
      // 读取用户配置
      const userConfig = requireFileSync(this.configPath) as Partial<ConfigType>

      // 合并默认配置和用户配置，避免用户配置丢失
      const result: ConfigType = { ...this.defaultConfig, ...userConfig }

      // 更新缓存
      this.cache = result
      return result
    } catch (error) {
      // 如果读取失败，返回默认配置
      logger.error('读取配置文件失败，使用默认配置:', error)
      return { ...this.defaultConfig }
    }
  }

  /**
   * 写入配置
   * @param config 配置对象
   */
  write (config: Partial<ConfigType>): void {
    try {
      const result: ConfigType = { ...this.defaultConfig, ...config }
      this.cache = result
      fs.writeFileSync(this.configPath, JSON.stringify(result, null, 2))
    } catch (error) {
      logger.error('写入配置文件失败:', error)
      throw error
    }
  }

  /**
   * 更新配置（合并现有配置）
   * @param config 要更新的配置项
   */
  update (config: Partial<ConfigType>): void {
    const current = this.get()
    this.write({ ...current, ...config })
  }

  /**
   * 重置为默认配置
   */
  reset (): void {
    this.write(this.defaultConfig)
  }
}

/** 配置实例 */
export const cfg = new Config()
