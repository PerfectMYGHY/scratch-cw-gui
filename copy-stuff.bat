@echo off
set SCRATCH_PATH=..\..\scratch
echo 清空目标chunks目录...
rmdir %SCRATCH_PATH%\scratch-gui-chunks /s /q
mkdir %SCRATCH_PATH%\scratch-gui-chunks
echo 复制chunks目录...
xcopy dist\chunks %SCRATCH_PATH%\scratch-gui-chunks /s /e
echo 正在复制Fetch Worker...
setlocal enabledelayedexpansion

:: 配置路径
set "SOURCE=dist\chunks"
set "TARGET=%SCRATCH_PATH%\static\chunks"

:: 创建目标目录或清空并创建
if exist "%TARGET%" rmdir "%TARGET%" /s /q
if not exist "%TARGET%" mkdir "%TARGET%"

:: 复制文件
for %%F in ("%SOURCE%\fetch-worker.*.js") do (
    echo 正在复制: %%~nxF
    copy /y "%%F" "%TARGET%\"
)

echo 操作完成！
