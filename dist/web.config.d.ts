import * as node_karin from 'node-karin';

/** `config.json` 文件的类型定义 */
interface Config {
    /** 是否统计状态 关闭后可降低redis压力 */
    status: boolean;
    /** 全部更新是否使用转发 */
    forward: boolean;
    /** 默认重启是否为前台重启 true为前台重启 false为后台重启 */
    restartMode: boolean;
    /** 更新完成是否自动重启 */
    restart: boolean;
}

declare const _default: {
    info: {
        name: string;
        version: string;
        description: string;
        author: {
            name: string;
            avatar: string;
        }[];
    };
    /** 动态渲染的组件 */
    components: () => node_karin.SwitchProps[];
    /** 前端点击保存之后调用的方法 */
    save: (config: Config) => {
        success: boolean;
        message: string;
    };
};

export { _default as default };
