import * as node_karin from 'node-karin';

/** 插件列表 */
declare const plugins: node_karin.Command<keyof node_karin.MessageEventMap>;
/** 检查更新 */
declare const check: node_karin.Command<keyof node_karin.MessageEventMap>;
/** 更新插件 */
declare const update: node_karin.Command<keyof node_karin.MessageEventMap>;
/** 更新日志 */
declare const log: node_karin.Command<keyof node_karin.MessageEventMap>;
/** 全部更新 */
declare const updateAll: node_karin.Command<keyof node_karin.MessageEventMap>;

export { check, log, plugins, update, updateAll };
