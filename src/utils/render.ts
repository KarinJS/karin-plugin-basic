import path from 'node:path'
import { segment, karin, config } from 'node-karin'
import { plugin } from './dir'

const copyright = `${plugin.name} ${plugin.pkg.version} - Copyright © 2025 KarinJS | Powered by Karin v${config.pkg().version}`
/**
 * 渲染
 * @param name 文件名称 不包含`.html`
 * @param params 渲染参数
 */
export const render = async (
  name: string,
  params: Record<string, any>
) => {
  name = name.replace(/.html$/, '')
  const root = path.join(plugin.dir, 'resources')
  const img = await karin.render({
    name: path.basename(name),
    type: 'png',
    file: path.join(root, `${name}.html`),
    data: {
      pluResPath: `${root}/`,
      sys: {
        copyright,
      },
      ...params,
    },
    pageGotoParams: {
      waitUntil: 'networkidle0',
    },
    setViewport: {
      deviceScaleFactor: 3
    }
  })
  return segment.image(`${img.includes('base64://') ? img : `base64://${img}`}`)
}
