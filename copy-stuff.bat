@echo off
echo 重命名Extension Worker...
rename "dist\extension worker.js" extension-worker.js
echo 复制Map...
copy extension-worker.js.map dist\extension-worker.js.map
copy scratch-gui.js.map dist\scratch-gui.js.map
echo 清空目标dist目录...
rmdir ..\scratch\node_modules\scratch-gui\dist /s /q
mkdir ..\scratch\node_modules\scratch-gui\dist
echo 复制dist目录...
xcopy dist ..\scratch\node_modules\scratch-gui\dist /s /e
echo 清空目标build目录...
rmdir ..\scratch\node_modules\scratch-gui\build /s /q
mkdir ..\scratch\node_modules\scratch-gui\build
echo 复制build目录...
xcopy build ..\scratch\node_modules\scratch-gui\build /s /e
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

cd ..\scratch
echo 打包Scratch WWW
pause
.\temp
