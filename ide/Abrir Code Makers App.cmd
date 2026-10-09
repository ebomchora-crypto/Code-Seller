@echo off
cd /d "%~dp0"
if exist "%~dp0release\win-unpacked\Code Makers IDE.exe" (
  start "" "%~dp0release\win-unpacked\Code Makers IDE.exe"
  exit /b
)
call npm run desktop
if errorlevel 1 pause
