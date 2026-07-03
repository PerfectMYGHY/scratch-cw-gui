@echo off
echo 清理无用文件...
del "dist\extension worker.js"
del "dist\extension worker.js.map"
echo 清空目标chunks目录...
rmdir ..\scratch\scratch-gui-chunks /s /q
mkdir ..\scratch\scratch-gui-chunks
echo 复制chunks目录...
xcopy dist\chunks ..\scratch\scratch-gui-chunks /s /e
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
