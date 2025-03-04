import { info } from './root'
import { components } from 'node-karin'
import { config, writeConfig } from '@/utils/config'

import type { Config } from '@/types/config'

export default {
  info: {
    name: '基础插件',
    version: info.version,
    description: info.pkg.description,
    author: [
      {
        name: info.pkg.author,
        avatar: 'https://github.com/sj817.png'
      }
    ]
  },
  /** 动态渲染的组件 */
  components: () => {
    const cfg = config()
    const list = [
      components.switch.create('status', {
        color: 'success',
        label: '统计状态',
        description: '关闭后可降低redis压力...',
        defaultSelected: cfg.status
      }),
      components.switch.create('forward', {
        color: 'success',
        label: '更新转发',
        description: '全部更新是否使用转发',
        defaultSelected: cfg.forward
      }),
      components.switch.create('restartMode', {
        color: 'success',
        label: '重启方式',
        description: '打开为前台重启 关闭为后台重启',
        defaultSelected: cfg.restartMode
      }),
      components.switch.create('restart', {
        color: 'success',
        label: '自动重启',
        description: '更新完成是否自动重启',
        defaultSelected: cfg.restart
      })
    ]

    return list
  },

  /** 前端点击保存之后调用的方法 */
  save: (config: Config) => {
    writeConfig(config)
    return {
      success: true,
      message: '保存成功'
    }
  }
}
