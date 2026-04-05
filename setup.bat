@echo off
REM ============================================================
REM 10x Analyst — One-Command Installer & Launcher (Windows)
REM Usage: Double-click this file or run: setup.bat
REM ============================================================

setlocal EnableDelayedExpansion
title 10x Analyst - Setup

set APP_NAME=10x Analyst
set LOG_FILE=setup.log
set SERVER_PORT=3001
set CLIENT_PORT=5173
set REQUIRED_NODE_VERSION=18

echo.
echo ================================================
echo    %APP_NAME% — Setup ^& Launcher
echo ================================================
echo.

REM --- Initialize log ---
echo ============================================= > "%LOG_FILE%"
echo  %APP_NAME% — Installation Log >> "%LOG_FILE%"
echo  Started: %date% %time% >> "%LOG_FILE%"
echo  System: Windows >> "%LOG_FILE%"
echo ============================================= >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM --- Check Node.js ---
echo [*] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [x] Node.js not found. Install it from https://nodejs.org
    echo STATUS: FAILED >> "%LOG_FILE%"
    echo REASON: Node.js not installed >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
for /f "tokens=2 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
node -e "process.exit(parseInt(process.version.slice(1)) < %REQUIRED_NODE_VERSION% ? 1 : 0)" 2>nul
if %errorlevel% neq 0 (
    echo [x] Node.js %REQUIRED_NODE_VERSION%+ required.
    echo STATUS: FAILED >> "%LOG_FILE%"
    echo REASON: Node.js version too old >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f %%v in ('node -v') do echo [+] Node.js found: %%v
for /f %%v in ('node -v') do echo Node.js: %%v >> "%LOG_FILE%"

REM --- Check npm ---
echo [*] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [x] npm not found.
    echo STATUS: FAILED >> "%LOG_FILE%"
    echo REASON: npm not installed >> "%LOG_FILE%"
    pause
    exit /b 1
)
for /f %%v in ('npm -v') do echo [+] npm found: %%v
for /f %%v in ('npm -v') do echo npm: %%v >> "%LOG_FILE%"

REM --- Install dependencies ---
echo [*] Checking dependencies...
if exist "node_modules\.package-lock.json" (
    echo [+] Dependencies already installed
    echo Dependencies: already present >> "%LOG_FILE%"
) else (
    echo [*] Installing dependencies (this may take a minute^)...
    echo Running: npm install >> "%LOG_FILE%"
    call npm install --loglevel=error 2>> "%LOG_FILE%"
    if %errorlevel% neq 0 (
        echo [x] Failed to install dependencies. Check %LOG_FILE%
        echo STATUS: FAILED >> "%LOG_FILE%"
        echo REASON: npm install failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
    echo [+] Dependencies installed
    echo Dependencies: installed successfully >> "%LOG_FILE%"
)

REM --- TypeScript check ---
echo [*] Verifying TypeScript compilation...
call npx tsc --noEmit 2>> "%LOG_FILE%"
if %errorlevel% equ 0 (
    echo [+] TypeScript: zero errors
    echo TypeScript: compilation clean >> "%LOG_FILE%"
) else (
    echo [!] TypeScript has warnings — app may still work
    echo TypeScript: has warnings >> "%LOG_FILE%"
)

REM --- Log installation status ---
echo. >> "%LOG_FILE%"
echo ============================================= >> "%LOG_FILE%"
echo  INSTALLATION STATUS >> "%LOG_FILE%"
echo ============================================= >> "%LOG_FILE%"
echo STATUS: INSTALLED >> "%LOG_FILE%"
echo Installed at: %date% %time% >> "%LOG_FILE%"
echo ============================================= >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM --- Start backend server ---
echo [*] Starting backend server on port %SERVER_PORT%...
start /b "10x-backend" cmd /c "npx tsx server/index.ts 2>> %LOG_FILE%"
echo [+] Backend server starting...
echo Backend: starting on port %SERVER_PORT% >> "%LOG_FILE%"

REM Give server a moment to boot
timeout /t 3 /nobreak >nul

REM --- Launch frontend ---
echo.
echo ================================================
echo    %APP_NAME% is ready!
echo ================================================
echo.
echo    Open in browser:  http://localhost:%CLIENT_PORT%
echo    Backend API:       http://localhost:%SERVER_PORT%
echo    Install log:       %LOG_FILE%
echo.
echo    Press Ctrl+C to stop the frontend server.
echo    Close this window to stop everything.
echo.

echo APP: RUNNING >> "%LOG_FILE%"
echo Frontend: http://localhost:%CLIENT_PORT% >> "%LOG_FILE%"
echo Backend: http://localhost:%SERVER_PORT% >> "%LOG_FILE%"
echo Started at: %date% %time% >> "%LOG_FILE%"

REM Start Vite (foreground — keeps window alive)
call npx vite --host 2>> "%LOG_FILE%"

echo.
echo [*] Shutting down...
echo Stopped at: %date% %time% >> "%LOG_FILE%"
taskkill /fi "windowtitle eq 10x-backend*" /f >nul 2>&1
echo [+] Servers stopped. Goodbye!
pause
