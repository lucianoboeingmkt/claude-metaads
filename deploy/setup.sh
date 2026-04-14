#!/bin/bash
set -euo pipefail

# ============================================================
# Meta Ads MCP Server - Ubuntu VM Setup Script
# ============================================================
# Usage: sudo bash setup.sh
#
# This script:
# 1. Installs Node.js 22 (if not present)
# 2. Creates a dedicated 'mcp' user
# 3. Clones and builds the project
# 4. Prompts for environment variables
# 5. Installs a systemd service
# 6. Shows Cloudflare Tunnel instructions
# ============================================================

APP_DIR="/opt/meta-ads-mcp"
REPO_URL="https://github.com/lucianoboeingmkt/claude-metaads.git"
SERVICE_NAME="meta-ads-mcp"

echo "=== Meta Ads MCP Server - Setup ==="
echo ""

# --- 1. Check root ---
if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Run this script as root (sudo bash setup.sh)"
  exit 1
fi

# --- 2. Install Node.js 22 if needed ---
if ! command -v node &>/dev/null || [[ "$(node -v)" != v22* ]]; then
  echo "[1/6] Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
else
  echo "[1/6] Node.js 22 already installed ($(node -v))"
fi

# --- 3. Create mcp user ---
if ! id "mcp" &>/dev/null; then
  echo "[2/6] Creating 'mcp' user..."
  useradd --system --no-create-home --shell /bin/false mcp
else
  echo "[2/6] User 'mcp' already exists"
fi

# --- 4. Clone/update repo and build ---
BRANCH="${BRANCH:-main}"

echo "[3/6] Setting up application in ${APP_DIR}..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  rm -rf "$APP_DIR"
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "[4/6] Installing dependencies and building..."
npm install
npx tsc

# --- 5. Configure environment ---
ENV_FILE="${APP_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[5/6] Configuring environment..."
  echo ""

  read -rp "Enter your META_ACCESS_TOKEN: " META_TOKEN
  read -rp "Enter an MCP_API_KEY (optional; leave blank for no endpoint auth): " API_KEY
  read -rp "Enter PORT (default 3005): " PORT
  PORT=${PORT:-3005}

  cat > "$ENV_FILE" <<EOL
META_ACCESS_TOKEN=${META_TOKEN}
MCP_API_KEY=${API_KEY}
PORT=${PORT}
EOL

  chmod 600 "$ENV_FILE"
  echo "Environment saved to ${ENV_FILE}"
else
  echo "[5/6] Environment file already exists at ${ENV_FILE}"
fi

# Set ownership
chown -R mcp:mcp "$APP_DIR"

# --- 6. Install systemd service ---
echo "[6/6] Installing systemd service..."
cp "${APP_DIR}/deploy/meta-ads-mcp.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Service status:"
systemctl status "$SERVICE_NAME" --no-pager -l
echo ""
echo "Useful commands:"
echo "  sudo systemctl status ${SERVICE_NAME}    # check status"
echo "  sudo systemctl restart ${SERVICE_NAME}   # restart"
echo "  sudo journalctl -u ${SERVICE_NAME} -f    # view logs"
echo ""
echo "============================================"
echo "  NEXT STEP: Configure Cloudflare Tunnel"
echo "============================================"
echo ""
echo "If cloudflared is not installed:"
echo "  curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg"
echo "  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list"
echo "  sudo apt update && sudo apt install cloudflared"
echo ""
echo "Then add a route in your Cloudflare Tunnel dashboard:"
echo "  Public hostname: mcp.yourdomain.com"
echo "  Service:         http://localhost:${PORT:-3005}"
echo ""
echo "Your MCP endpoint for Claude.ai will be:"
echo "  https://mcp.yourdomain.com/mcp"
echo ""
