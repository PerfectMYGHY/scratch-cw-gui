@echo off
echo *****  ����dist  *****
echo *                    *
pause
set NODE_ENV=production
set BUILD_MODE=dist
npm run "build%1"
echo *****  �������  *****
echo ׼�����Ʊ�Ҫ�ļ�
pause
cls
copy 30d09ba32a17082ef820b57d52d60b7b.hex dist\30d09ba32a17082ef820b57d52d60b7b.hex
echo *****  �������  *****
pause