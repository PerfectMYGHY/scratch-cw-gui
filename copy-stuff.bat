@echo off
echo ������������
rename dist\extension worker.js dist\extension-worker.js
move extension-worker.js.map dist\extension-worker.js.map
copy dist ..\scratch\node_modules\scratch-gui\dist
copy build ..\scratch\node_modules\scratch-gui\build
copy dist\chunks ..\scratch\static\scratch-gui-chunks
cd ..\scratch
echo ���Scratch WWW
temp | echo ��һ���Դ��ģʽ
