@echo off
echo *****  ����dist  *****
echo *                    *
pause
set NODE_ENV=production
set BUILD_MODE=dist
npm run "build%1"
