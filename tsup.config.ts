import { defineConfig } from 'tsup'
import type { Options } from 'tsup'

/**
 * @description `tsup` configuration options
 */
export const options: Options = {
  entry: ['src/index.ts', 'src/apps/*.ts', 'src/web.config.ts'], // 入口文件
  format: ['esm'], // 输出格式
  target: 'node16', // 目标环境
  splitting: true, // 是否拆分文件
  sourcemap: false, // 是否生成 sourcemap
  clean: true, // 是否清理输出目录
  dts: true, // 是否生成 .d.ts 文件
  outDir: 'dist', // 输出目录
  treeshake: false, // 树摇优化
  minify: false, // 压缩代码
  external: ['node-karin'],
  shims: true,
}

export default defineConfig(options)
