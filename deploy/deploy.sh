#!/usr/bin/env bash
# =============================================================
# 肠道花园 一键部署脚本（Ubuntu 20.04/22.04，Node.js 22）
# 用法：sudo bash deploy.sh [仓库地址]
#   默认仓库：Gitee 镜像（国内访问快）；也可传 GitHub 地址
# 示例：
#   sudo bash deploy.sh https://gitee.com/你的用户名/gut-garden.git
# =============================================================
set -euo pipefail

REPO_URL="${1:-https://gitee.com/Zeadeinsung/gut-garden.git}"
APP_DIR=/opt/gut-garden
SERVICE_NAME=gut-garden
PORT="${PORT:-3001}"

log() { echo -e "\n\033[1;32m==>\033[0m $1"; }

log "[1/6] 安装基础依赖（git curl build-essential）"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates build-essential

log "[2/6] 安装 Node.js 22"
if command -v node >/dev/null 2>&1 && [[ "$(node -v)" == v22* ]]; then
  echo "Node 已安装：$(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

log "[3/6] 拉取代码"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin && git reset --hard origin/master
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

log "[4/6] 安装依赖并构建后端"
cd "$APP_DIR/server"
npm install --no-audit --no-fund
npm run build

# 生成生产 .env（已存在则不覆盖）
if [ ! -f .env ]; then
  cp .env.example .env
  JWT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" .env
  echo "已生成 server/.env（随机 JWT_SECRET）"
fi
# 首次建表 + 写入徽章定义
npm run db:migrate

log "[5/6] 安装依赖并构建前端"
cd "$APP_DIR/web"
npm install --no-audit --no-fund
npm run build

log "[6/6] 配置 systemd 服务并启动"
cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=Gut Garden (肠道花园)
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}/server
ExecStart=/usr/bin/node dist/app.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=${PORT}

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}

sleep 3
IP=$(curl -s --max-time 3 ifconfig.me || hostname -I | awk '{print $1}')
echo ""
echo "=============================================================="
echo "  部署完成！"
echo "  访问地址： http://${IP}:${PORT}"
echo ""
echo "  演示账号：任意 11 位手机号 + 验证码（页面右下角绿色悬浮框里查看）"
echo "  或：登录页点「游客体验」1 秒进入"
echo ""
echo "  AI 对话：请编辑 ${APP_DIR}/server/.env 填入 AI_API_KEY 后"
echo "  执行 systemctl restart ${SERVICE_NAME}"
echo "=============================================================="
