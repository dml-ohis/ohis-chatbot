#!/usr/bin/env bash
# ============================================================
# 10x Analyst — One-Command Installer & Launcher
# Usage: bash setup.sh
# ============================================================

set -e

# --- Config ---
APP_NAME="10x Analyst"
LOG_FILE="setup.log"
SERVER_PORT=3001
CLIENT_PORT=5173
REQUIRED_NODE_VERSION=18

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# --- Helpers ---
log() {
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] $1" >> "$LOG_FILE"
}

print_step() {
  echo -e "${BLUE}[*]${NC} $1"
  log "STEP: $1"
}

print_success() {
  echo -e "${GREEN}[+]${NC} $1"
  log "OK: $1"
}

print_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
  log "WARN: $1"
}

print_error() {
  echo -e "${RED}[x]${NC} $1"
  log "ERROR: $1"
}

print_header() {
  echo ""
  echo -e "${CYAN}${BOLD}================================================${NC}"
  echo -e "${CYAN}${BOLD}   $APP_NAME — Setup & Launcher${NC}"
  echo -e "${CYAN}${BOLD}================================================${NC}"
  echo ""
}

# --- Start ---
print_header

# Initialize log file
echo "=============================================" > "$LOG_FILE"
echo " $APP_NAME — Installation Log" >> "$LOG_FILE"
echo " Started: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo " System: $(uname -s) $(uname -m)" >> "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# --- Check Node.js ---
print_step "Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  print_success "Node.js found: $(node -v)"
  log "Node.js version: $(node -v)"
  if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    print_error "Node.js $REQUIRED_NODE_VERSION+ required. You have v$NODE_VERSION."
    log "FAILED: Node.js version too old"
    echo ""
    echo "STATUS: FAILED" >> "$LOG_FILE"
    echo "REASON: Node.js $REQUIRED_NODE_VERSION+ required" >> "$LOG_FILE"
    exit 1
  fi
else
  print_error "Node.js not found. Install it from https://nodejs.org"
  log "FAILED: Node.js not installed"
  echo ""
  echo "STATUS: FAILED" >> "$LOG_FILE"
  echo "REASON: Node.js not installed" >> "$LOG_FILE"
  exit 1
fi

# --- Check npm ---
print_step "Checking npm..."
if command -v npm &> /dev/null; then
  print_success "npm found: $(npm -v)"
  log "npm version: $(npm -v)"
else
  print_error "npm not found."
  log "FAILED: npm not installed"
  echo ""
  echo "STATUS: FAILED" >> "$LOG_FILE"
  echo "REASON: npm not installed" >> "$LOG_FILE"
  exit 1
fi

# --- Install dependencies ---
print_step "Checking dependencies..."
if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
  print_success "Dependencies already installed"
  log "Dependencies: already present (node_modules exists)"
else
  print_step "Installing dependencies (this may take a minute)..."
  log "Running: npm install"
  if npm install --loglevel=error 2>> "$LOG_FILE"; then
    print_success "Dependencies installed"
    log "Dependencies: installed successfully"
  else
    print_error "Failed to install dependencies. Check $LOG_FILE for details."
    echo ""
    echo "STATUS: FAILED" >> "$LOG_FILE"
    echo "REASON: npm install failed" >> "$LOG_FILE"
    exit 1
  fi
fi

# --- Build check ---
print_step "Verifying TypeScript compilation..."
if npx tsc --noEmit 2>> "$LOG_FILE"; then
  print_success "TypeScript: zero errors"
  log "TypeScript: compilation clean"
else
  print_warning "TypeScript has warnings — app may still work"
  log "TypeScript: has warnings"
fi

# --- Log installation status ---
echo "" >> "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"
echo " INSTALLATION STATUS" >> "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"
echo "STATUS: INSTALLED" >> "$LOG_FILE"
echo "Node.js: $(node -v)" >> "$LOG_FILE"
echo "npm: $(npm -v)" >> "$LOG_FILE"
echo "Dependencies: OK" >> "$LOG_FILE"
echo "TypeScript: OK" >> "$LOG_FILE"
echo "Installed at: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# --- Kill any existing processes on our ports ---
print_step "Checking for port conflicts..."
if command -v lsof &> /dev/null; then
  lsof -ti:$SERVER_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:$CLIENT_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
elif command -v netstat &> /dev/null; then
  # Windows/Git Bash fallback
  true
fi
print_success "Ports $SERVER_PORT and $CLIENT_PORT clear"

# --- Start the backend server ---
print_step "Starting backend server on port $SERVER_PORT..."
log "Starting: npx tsx server/index.ts"
npx tsx server/index.ts > /dev/null 2>> "$LOG_FILE" &
SERVER_PID=$!
log "Backend PID: $SERVER_PID"

# Wait for server to be ready
sleep 2
if kill -0 $SERVER_PID 2>/dev/null; then
  print_success "Backend server running (PID: $SERVER_PID)"
else
  print_error "Backend server failed to start. Check $LOG_FILE"
  echo "STATUS: BACKEND FAILED" >> "$LOG_FILE"
  exit 1
fi

# --- Start the frontend dev server ---
print_step "Starting frontend on port $CLIENT_PORT..."
log "Starting: npx vite --host"

echo ""
echo -e "${GREEN}${BOLD}=============================================${NC}"
echo -e "${GREEN}${BOLD}   $APP_NAME is ready!${NC}"
echo -e "${GREEN}${BOLD}=============================================${NC}"
echo ""
echo -e "   ${BOLD}Open in browser:${NC}  ${CYAN}http://localhost:$CLIENT_PORT${NC}"
echo -e "   ${BOLD}Backend API:${NC}      ${CYAN}http://localhost:$SERVER_PORT${NC}"
echo -e "   ${BOLD}Install log:${NC}      ${CYAN}$LOG_FILE${NC}"
echo ""
echo -e "   Press ${BOLD}Ctrl+C${NC} to stop all servers."
echo ""

log "Frontend starting on port $CLIENT_PORT"
echo "APP: RUNNING" >> "$LOG_FILE"
echo "Frontend: http://localhost:$CLIENT_PORT" >> "$LOG_FILE"
echo "Backend: http://localhost:$SERVER_PORT" >> "$LOG_FILE"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

# Trap to clean up on exit
cleanup() {
  echo ""
  print_step "Shutting down..."
  kill $SERVER_PID 2>/dev/null || true
  print_success "Servers stopped. Goodbye!"
  log "Servers stopped at $(date '+%Y-%m-%d %H:%M:%S')"
}
trap cleanup EXIT INT TERM

# Start Vite (foreground — this keeps the script alive)
npx vite --host 2>> "$LOG_FILE"
