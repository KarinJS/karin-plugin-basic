import { components, defineConfig } from 'node-karin'
import { cfg } from '@/config'

import type { Config } from '@/config'
import { plugin } from '@/utils'

export default defineConfig({
  info: {
    id: plugin.name,
    name: '基础插件',
    version: plugin.version,
    description: plugin.pkg.description,
    author: [
      {
        name: plugin.pkg.author,
        avatar: 'https://github.com/sj817.png'
      }
    ]
  },
  /** 动态渲染的组件 */
  components: () => {
    const config = cfg.get()
    const list = [
      components.switch.create('status', {
        color: 'success',
        label: '统计状态',
        description: '关闭后可降低redis压力...',
        defaultSelected: config.status
      }),
      components.switch.create('forward', {
        color: 'success',
        label: '更新转发',
        description: '全部更新是否使用转发',
        defaultSelected: config.forward
      }),
      components.switch.create('restartMode', {
        color: 'success',
        label: '重启方式',
        description: '打开为前台重启 关闭为后台重启',
        defaultSelected: config.restartMode
      }),
      components.switch.create('restart', {
        color: 'success',
        label: '自动重启',
        description: '更新完成是否自动重启',
        defaultSelected: config.restart
      }),
      components.input.string('domain', {
        color: 'success',
        label: '自定义域名',
        description: 'Web登录发送的自定义域名',
        defaultValue: config.domain,
        isRequired: false
      }),
      components.switch.create('autoupdate', {
        color: 'success',
        label: '自动更新',
        description: '是否启用自动更新',
        defaultSelected: config.autoupdate,
      }),
      components.input.number('autorestart', {
        color: 'success',
        label: '自动重启延迟时间',
        description: '自动重启延迟时间，单位秒，0表示不自动重启',
        defaultValue: config.autorestart + '',
      })
    ]

    return list
  },

  /** 前端点击保存之后调用的方法 */
  save: (config: Config) => {
    cfg.write(config)
    return {
      success: true,
      message: '保存成功'
    }
  }
})
