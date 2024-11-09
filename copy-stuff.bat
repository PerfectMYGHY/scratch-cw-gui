@echo off
echo 重命名、复制
rename dist\extension worker.js dist\extension-worker.js
move extension-worker.js.map dist\extension-worker.js.map
copy dist ..\scratch\node_modules\scratch-gui\dist
copy build ..\scratch\node_modules\scratch-gui\build
copy dist\chunks ..\scratch\static\scratch-gui-chunks
cd ..\scratch
echo 打包Scratch WWW
temp | echo 非一次性打包模式
