@echo off
echo 重命名、复制
rename dist\extension worker.js dist\extension-worker.js
move extension-worker.js.map dist\extension-worker.js.map
copy dist ..\scratch\node_modules\scratch-gui\dist
copy build ..\scratch\node_modules\scratch-gui\build
copy dist\chunks ..\scratch\scratch-gui-chunks
echo 正在复制Fetch Worker...
setlocal enabledelayedexpansion

:: 配置路径
set "SOURCE=dist\chunks"
set "TARGET=..\scratch\static\chunks"

:: 创建目标目录（如果不存在）
if not exist "%TARGET%" mkdir "%TARGET%"

:: 复制文件
for %%F in ("%SOURCE%\fetch-worker.*.js") do (
    echo 正在复制: %%~nxF
    copy /y "%%F" "%TARGET%\"
)

echo 操作完成！

cd ..\scratch
echo 打包Scratch WWW
.\temp | echo 非一次性打包模式
