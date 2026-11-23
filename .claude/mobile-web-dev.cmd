@echo off
set "PATH=C:\qatools\node-v22.14.0-win-x64;%PATH%"
cd /d "%~dp0.."
call pnpm --filter @ummahlibrary/mobile exec expo start --web --port 8090
