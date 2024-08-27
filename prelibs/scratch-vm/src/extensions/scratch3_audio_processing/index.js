const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

/**
 * Icon svg to be displayed in the blocks category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTAwcHgiIGhlaWdodD0iMTAwcHgiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA1Ni4yICg4MTY3MikgLSBodHRwczovL3NrZXRjaC5jb20gLS0+CiAgICA8dGl0bGU+U291bmQvR2VuZXJhbC9MaWJyYXJ5IFRpbGUgSWNvbi9MVFI8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZyBpZD0iU291bmQvR2VuZXJhbC9MaWJyYXJ5LVRpbGUtSWNvbi9MVFIiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxwYXRoIGQ9Ik01OS4yMDU4Nzg3LDYwLjMzMzMzMzQgQzU4LjU5NjY5NDcsNjAuMzMzMzMzNCA1Ny45NzA0MzA4LDYwLjE4Njc1OTMgNTcuNDAxMDk5OSw1OS44Nzc5MDY0IEM1NS43MTAxODY5LDU4Ljk1NjU4MyA1NS4xNDY1NDkzLDU2Ljk1MTY1OCA1Ni4xNDg1NzE4LDU1LjM5NjkyNDUgQzU4LjA1NTgzMDQsNTIuNDIzNTYzIDU4LjA1NTgzMDQsNDguNzM4MjY5NCA1Ni4xNDg1NzE4LDQ1Ljc3MDE0MjQgQzU1LjE0NjU0OTMsNDQuMjEwMTc0NCA1NS43MTAxODY5LDQyLjIwNTI0OTEgNTcuNDAxMDk5OSw0MS4yODM5MjU4IEM1OS4xMDkwOTI2LDQwLjM3MzA3MiA2MS4yODM5MzY2LDQwLjg4NjA4MTYgNjIuMjc0NTcyNiw0Mi40MzU1OCBDNjUuNTAyNjc4Nyw0Ny40NjA5ODAyIDY1LjUwMjY3ODcsNTMuNzAwODUyIDYyLjI3NDU3MjYsNTguNzI2MjUyMyBDNjEuNjE0MTQ4OCw1OS43NjI3NDEyIDYwLjQyNDI0NjksNjAuMzMzMzMzNCA1OS4yMDU4Nzg3LDYwLjMzMzMzMzQgWiBNNjkuOTg1Mzc3LDY0LjY2NjY2NjYgQzY5LjQ2NjE2MzcsNjQuNjY2NjY2NiA2OC45Mjc1NDA2LDY0LjUyOTA0MzggNjguNDQ3MTQ3Miw2NC4yMzkwNTI0IEM2Ny4wMDU5NjY4LDYzLjM3Mzk5MzggNjYuNTI1NTczMyw2MS40OTE1MDggNjcuMzc5NjA2MSw2MC4wMzE3MjEzIEM3MC43ODExODAyLDU0LjIwMjQwNSA3MC43ODExODAyLDQ2Ljk1NzUzOCA2Ny4zNzk2MDYxLDQxLjEzMzEzNjggQzY2LjUyNTU3MzMsMzkuNjczMzUwMiA2Ny4wMDU5NjY4LDM3Ljc4NTk0OTMgNjguNDQ3MTQ3MiwzNi45MjA4OTA2IEM2OS44OTMxODAzLDM2LjA3MDU3NzIgNzEuNzQ2ODE5NCwzNi41NDczNDI1IDcyLjYwMDg1MjIsMzguMDAyMjE0IEM3Ny4xMzMwNDkzLDQ1Ljc1ODI1MjEgNzcuMTMzMDQ5Myw1NS40MDE2OTEgNzIuNjAwODUyMiw2My4xNTc3MjkxIEM3Mi4wMzMxMTQ3LDY0LjEzMDkyMDMgNzEuMDIzODAzMyw2NC42NjY2NjY2IDY5Ljk4NTM3Nyw2NC42NjY2NjY2IFogTTUxLjEzMDQzNDcsMzQuMTc4NjI5MyBMNTEuMTMwNDM0Nyw2NC44MTY1MDcyIEM1MS4xMzA0MzQ3LDY4LjQ0NjMyNjQgNDYuNjkzMTY1OSw3MC4zNDY0NjYyIDQzLjkyNjMzNzMsNjcuODk5ODQ4IEwzNy45NTMwOTA2LDYyLjYxMDUzOTggQzM1LjgzNzg4ODksNjAuNzQwNDgxMyAzMy4wODE0MDM3LDU5LjcwMjY3MzggMzAuMjE2MzEzOSw1OS43MDI2NzM4IEwyOS4xNzE2NDIyLDU5LjcwMjY3MzggQzI2LjMxNjg5NTcsNTkuNzAyNjczOCAyNCw1Ny40NjE2MTE2IDI0LDU0LjY4OTExMiBMMjQsNDQuMzYxMTczOSBDMjQsNDEuNTkzNjg3NiAyNi4zMTY4OTU3LDM5LjM0NzYxMTggMjkuMTcxNjQyMiwzOS4zNDc2MTE4IEwzMC4xNTk0MjU4LDM5LjM0NzYxMTggQzMzLjAyNDUxNTYsMzkuMzQ3NjExOCAzNS43ODEwMDA5LDM4LjMwOTgwNDQgMzcuODk2MjAyNSwzNi40Mzk3NDU4IEw0My45MjYzMzczLDMxLjEwMDMwMjEgQzQ2LjY5MzE2NTksMjguNjUzNjgzOCA1MS4xMzA0MzQ3LDMwLjU1MzgyMzkgNTEuMTMwNDM0NywzNC4xNzg2MjkzIFoiIGlkPSJDb21iaW5lZC1TaGFwZSIgZmlsbD0iIzU3NUU3NSIgZmlsbC1ydWxlPSJub256ZXJvIj48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg=="; // 扩展小图标的svg的base64码
//const blockIconURI = require('./audio_processing-small.svg');
const menuIconURI = blockIconURI;

const vers = []; // 存储数据的变量

class Scratch3AudioProcessingBlocks { // 积木类
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }
    /**
     * The key to load & store a target's AudioProcessing state.
     * @return {string} The key.
     */
    static get STATE_KEY() {
        return 'Scratch.AudioProcessing';
    }
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: 'AudioProcessing', // 把name替换为扩展英文名
            name: formatMessage({
                id: "gui.extension.AudioProcessing.name", // 把name替换为扩展英文名
                default: "高级音频处理", // 扩展名
                description: "Name for the 'AudioProcessing' extension" // 扩展介绍
            }),
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            color1: '#CF63CF', // 扩展的所有积木的背景颜色(没有则默认是绿色)
            color2: '#C94FC9', // 扩展的所有积木的选择菜单的背景颜色(没有则默认是深绿色)
            color3: '#BD42BD', // 3级颜色
            color4: '#BD42BD', // 4级颜色
            blocks: [ // 插件积木定义
                {
                    opcode: "loadLabel",
                    text: formatMessage({
                        id: 'AudioProcessing.loadLabel', // 把name替换为扩展英文名，nameFUNC替换为插件积木英文名
                        default: '加载', // 积木的名称，参数使用[]包起来
                        description: '加载类别' // 积木介绍
                    }),
                    blockType: BlockType.LABEL
                },
                {
                    opcode: 'readAudioFromSprite', // 插件积木英文名
                    text: formatMessage({
                        id: 'AudioProcessing.readAudioFromSprite', // 把name替换为扩展英文名，nameFUNC替换为插件积木英文名
                        default: '从角色的 [AUDIO] 中读取音频并存储(覆盖)至内部变量 [NAME]', // 积木的名称，参数使用[]包起来
                        description: '加载音频方式1' // 积木介绍
                    }),
                    blockType: BlockType.COMMAND, // 积木类型，这里是有返回值的积木，`BlockType.COMMAND`是只可执行的代码块
                    arguments: { // 参数列表
                        AUDIO: { // 参数名
                            type: ArgumentType.SOUND, // 参数类型，这里是字符串类型
                        },
                        NAME: { // 参数名
                            type: ArgumentType.STRING, // 参数类型，这里是字符串，`ArgumentType.NUMBER`是纯数字
                            defaultValue: "a" // 默认值
                            //menu: 'usage', // 参数的选择菜单列表名，没有该选项就代表参数可以输入内容
                        }
                    }
                },
                {
                    opcode: 'readAudioFromURL', // 插件积木英文名
                    text: formatMessage({
                        id: 'AudioProcessing.readAudioFromURL', // 把name替换为扩展英文名，nameFUNC替换为插件积木英文名
                        default: '从URL [URL] 中读取 [TYPE] 音频并存储(覆盖)至内部变量 [NAME]', // 积木的名称，参数使用[]包起来
                        description: '加载音频方式2' // 积木介绍
                    }),
                    blockType: BlockType.COMMAND, // 积木类型，这里是有返回值的积木，`BlockType.COMMAND`是只可执行的代码块
                    arguments: { // 参数列表
                        URL: { // 参数名
                            type: ArgumentType.STRING, // 参数类型，这里是字符串类型
                            defaultValue: "http://urls.that.are.not.blocked.by.CORS.policies/path/name" // 默认值
                        },
                        NAME: { // 参数名
                            type: ArgumentType.STRING, // 参数类型，这里是字符串，`ArgumentType.NUMBER`是纯数字
                            defaultValue: "a" // 默认值
                            //menu: 'usage', // 参数的选择菜单列表名，没有该选项就代表参数可以输入内容
                        },
                        TYPE: { // 参数名
                            type: ArgumentType.STRING, // 参数类型，这里是字符串，`ArgumentType.NUMBER`是纯数字
                            defaultValue: "wav", // 默认值
                            menu: 'soundType', // 参数的选择菜单列表名，没有该选项就代表参数可以输入内容
                        }
                    }
                },
                "---",
                {
                    opcode: "readLabel",
                    text: formatMessage({
                        id: 'AudioProcessing.readLabel', // 把name替换为扩展英文名，nameFUNC替换为插件积木英文名
                        default: '读取', // 积木的名称，参数使用[]包起来
                        description: '读取类别' // 积木介绍
                    }),
                    blockType: BlockType.LABEL
                },
                {
                    opcode: 'loadInfo', // 插件积木英文名
                    text: formatMessage({
                        id: 'AudioProcessing.loadInfo', // 把name替换为扩展英文名，nameFUNC替换为插件积木英文名
                        default: '从内部变量 [NAME] 读取音频 [INFO] 信息', // 积木的名称，参数使用[]包起来
                        description: '读取音频信息' // 积木介绍
                    }),
                    blockType: BlockType.REPORTER, // 积木类型，这里是有返回值的积木，`BlockType.COMMAND`是只可执行的代码块
                    arguments: { // 参数列表
                        NAME: { // 参数名
                            type: ArgumentType.STRING, // 参数类型，这里是字符串，`ArgumentType.NUMBER`是纯数字
                            defaultValue: "a" // 默认值
                            //menu: 'usage', // 参数的选择菜单列表名，没有该选项就代表参数可以输入内容
                        },
                        INFO: { // 参数名
                            type: ArgumentType.STRING, // 参数类型，这里是字符串，`ArgumentType.NUMBER`是纯数字
                            defaultValue: "wav", // 默认值
                            menu: 'infos', // 参数的选择菜单列表名，没有该选项就代表参数可以输入内容
                        }
                    }
                },
            ],
            menus: { // 菜单定义
                soundType: { // 新建一个菜单
                    acceptReporters: true, // 未知用处
                    items: [ // 菜单选项
                        { text: "WAV", value: "wav" }, // text为显示的文字，value为执行积木时传递给函数的字符串
                        { text: "MP3", value: "mp3" }
                    ]
                },
                infos: { // 新建一个菜单
                    acceptReporters: true, // 未知用处
                    items: [ // 菜单选项
                        { text: "采样率", value: "framerate" }, // text为显示的文字，value为执行积木时传递给函数的字符串
                        { text: "通道数", value: "nchannels" },
                        { text: "采样总数", value: "nframes" },
                    ]
                }
            }
        };
    }
    _getSoundByName(util, name) {
        const sounds = util.target.getSounds();
        for (const sound of sounds) {
            if (sound.name == name) {
                return sound;
            }
        }
        return null;
    }

    logToDebugger(msg, type) {
        return window._scratch3_debugger_logMessage && (window._scratch3_debugger_logMessage(msg, undefined, type || "log"));
    }

    readAudioFromSprite(args, util) { // 插件积木运行时执行的函数，名称和插件积木英文名一样
        // args是对象，包含了积木所有参数当前的值
        // util是对象，包含了当前角色的所有信息
        var { AUDIO, NAME } = args; // 从参数对象中提取积木中定义的USAGE和URL参数。
        // 执行积木要执行的代码
        const sound = this._getSoundByName(util, AUDIO);
        if (sound) {
            //if (sound.dataFormat == "mp3") {
            //    this.logToDebugger(`很抱歉，当前技术不支持mp3格式，仅支持wav格式。`, "warn");
            //    return;
            //}
            vers[NAME] = {
                data: sound.asset.data,
                type: sound.dataFormat
            }
            this.logToDebugger(`已成功将音频信息存储至内部变量 ${NAME}`);
            return;
        }
        this.logToDebugger(`角色中没有名为 "${AUDIO}" 的音频！`,"warn");
    }

    async readAudioFromURL(args, util) { // 插件积木运行时执行的函数，名称和插件积木英文名一样
        // args是对象，包含了积木所有参数当前的值
        // util是对象，包含了当前角色的所有信息
        var { URL, TYPE, NAME } = args; // 从参数对象中提取积木中定义的USAGE和URL参数。
        // 执行积木要执行的代码
        if (TYPE == "mp3") {
            this.logToDebugger(`很抱歉，当前技术不支持mp3格式，仅支持wav格式。`, "warn");
            return;
        }
        try {
            const data = await fetch(URL).then(res => res.arrayBuffer());
            vers[NAME] = {
                data: data,
                type: TYPE
            }
            this.logToDebugger(`已成功将 ${TYPE} 音频信息存储至内部变量 ${NAME}`);
            return;
        } catch {
            this.logToDebugger(`向指定网址发送请求失败！请确保该地址在本站或一个允许跨域请求的地址上。请求网址：${URL}`, "error");
        }
    }

    loadInfo(args, util) {
        // args是对象，包含了积木所有参数当前的值
        // util是对象，包含了当前角色的所有信息
        var { NAME, INFO } = args; // 从参数对象中提取积木中定义的USAGE和URL参数。
        this.logToDebugger(`准备与服务器建立连接...`);
        const logToDebugger = this.logToDebugger;
        return new Promise((resolve, reject) => {
            var socket = new WebSocket(`${process.env.CLOUDDATA_HOST}/audio/service`);
            var ok = false;

            socket.onopen = function (event) {
                logToDebugger('WebSocket连接已建立，发送消息...');
                socket.send(`{"method":"getInfo","type":"${vers[NAME].type}","info":"${INFO}"}`);
                socket.send(vers[NAME].data);
            };

            socket.onmessage = function (event) {
                logToDebugger("接受完毕！");
                resolve(event.data); // 将接收到的数据作为 Promise 的返回值
                socket.close(); // 关闭连接
                ok = true;
            };

            socket.onerror = function (event) {
                logToDebugger("连接中断！", "error");
                reject('WebSocket连接中断'); // 连接失败时触发 reject
            };

            socket.onclose = function (event) {
                logToDebugger(`连接${ok ? "" : "非正常"}关闭`);
                reject('WebSocket连接中断'); // 连接失败时触发 reject
            };
        });
    }
}

module.exports = Scratch3AudioProcessingBlocks; // 导出主代码，此代码一定不能漏掉
