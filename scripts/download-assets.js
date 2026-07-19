const spritesList = require('../src/lib/libraries/sprites.json');
const soundsList = require('../src/lib/libraries/sounds.json');
const costumesList = require('../src/lib/libraries/costumes.json');
const backdropsList = require('../src/lib/libraries/backdrops.json');
const ora = require('ora').default;
const cliProgress = require('cli-progress');
const fs = require('fs');

console.log('============== Scratch 资源下载器 ==============');
console.log('找到初级资源数量:');
console.log('角色数:', spritesList.length);
console.log('声音数:', soundsList.length);
console.log('造型数:', costumesList.length);
console.log('背景数:', backdropsList.length);
console.log('===============================================');

const organizingSpinner = ora('正在整理数据...').start();

const assets = new Set();

for (const {costumes} of spritesList) {
    for (const {md5ext} of costumes) {
        assets.add(md5ext);
    }
}

for (const {md5ext} of soundsList) {
    assets.add(md5ext);
}

for (const {md5ext} of costumesList) {
    assets.add(md5ext);
}

for (const {md5ext} of backdropsList) {
    assets.add(md5ext);
}

organizingSpinner.succeed('整理完毕！');
console.log('共计找到素材个数:', assets.size);

const OUTPUT = './assets/';
const downloadBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

if (!fs.existsSync(OUTPUT)) {
    fs.mkdirSync(OUTPUT);
}

downloadBar.start(assets.size, 0);

const download = async () => {
    let downloaded = 0;
    const failed = [];
    for (const asset of assets) {
        const res1 = await fetch(`https://assets6.scratch-cw.top/assets/internalapi/asset/${asset}/get/`)
            .then(res => {
                if (res.ok) return res;
                return null;
            })
            .then(res => res && res.arrayBuffer());
        const res2 = await fetch(`https://assets1.scratch-cw.top/assets/internalapi/asset/${asset}/get/`)
            .then(res => {
                if (res.ok) return res;
                return null;
            })
            .then(res => res && res.arrayBuffer());
        let arrayBuffer = res1 || res2;
        if (arrayBuffer === null) {
            console.warn('\n警告：服务器上不存在资源:', asset, '，将尝试第三方');
            const res3 = await fetch(`https://m.xiguacity.cn/user_projects_assets/${asset}`) // 借用一下共创世界的
                .then(res => {
                    if (res.ok) return res;
                    return null;
                })
                .then(res => res && res.arrayBuffer());
            if (res3 === null) {
                console.warn('\n警告：在第三方服务器上无法找到素材:', asset);
                failed.push(asset);
                continue;
            }
            console.log('成功在第三方服务器上找到素材:', asset);
            arrayBuffer = res3;
        }
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(`${OUTPUT}${asset}`, buffer);
        downloadBar.update(++downloaded);
    }
    downloadBar.stop();
    console.log('下载完毕！');
    if (failed.length > 0) {
        console.warn('有', failed.length, '个素材下载失败！详细如下');
        for (const asset of failed) {
            console.warn(asset);
        }
    }
};

download();
