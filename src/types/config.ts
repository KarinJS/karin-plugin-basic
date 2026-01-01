/** `config.json` 文件的类型定义 */
export interface Config {
  /** 是否统计状态 关闭后可降低redis压力 */
  status: boolean
  /** 全部更新是否使用转发 */
  forward: boolean
  /** 默认重启是否为前台重启 true为前台重启 false为后台重启 */
  restartMode: boolean
  /** 更新完成是否自动重启 */
  restart: boolean
  /** 自定义登录域名 */
  domain: string
  /** 是否自动更新 */
  autoupdate: boolean
}
