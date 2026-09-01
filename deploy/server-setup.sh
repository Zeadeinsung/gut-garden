#!/usr/bin/env bash
# =============================================================
# 肠道花园 服务器部署脚本（tarball 直传版，国内最快）
# 前提：/home/ubuntu/gut-garden-src.tgz 已上传
# 用法：sudo bash /home/ubuntu/server-setup.sh [tarball路径]
# =============================================================
set -euo pipefail

TARBALL="${1:-/home/ubuntu/gut-garden-src.tgz}"
APP_DIR=/opt/gut-garden
SERVICE_NAME=gut-garden
PORT="${PORT:-3001}"
REGISTRY="https://registry.npmmirror.com"

log() { echo -e "\n\033[1;32m==>\033[0m $1"; }

if [ ! -f "$TARBALL" ]; then
  echo "错误：找不到 $TARBALL，请先上传 tarball。"
  exit 1
fi

log "[1/6] 安装基础依赖 + Node.js 22"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates build-essential
if command -v node >/dev/null 2>&1 && [[ "$(node -v)" == v22* ]]; then
  echo "Node 已安装：$(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

log "[2/6] 解压源码到 /opt/gut-garden"
cd /opt
rm -rf /opt/_gg_extract
mkdir -p /opt/_gg_extract
tar -xzf "$TARBALL" -C /opt/_gg_extract
# 容器内路径以 GutGardenBeta/ 开头
SRC_DIR=$(find /opt/_gg_extract -maxdepth 1 -mindepth 1 -type d | head -1)
if [ -z "$SRC_DIR" ]; then
  echo "错误：tarball 解压后为空"
  exit 1
fi
# 已有部署则备份，避免覆盖现场数据
if [ -d "$APP_DIR" ]; then
  BAK="${APP_DIR}.bak-$(date +%Y%m%d%H%M%S)"
  echo "检测到已有 $APP_DIR，备份到 $BAK"
  mv "$APP_DIR" "$BAK"
fi
mv "$SRC_DIR" "$APP_DIR"
rm -rf /opt/_gg_extract

log "[3/6] 生成生产环境变量（随机 JWT_SECRET）"
cd "$APP_DIR/server"
if [ ! -f .env ]; then
  cp .env.example .env
  # 未配置 DATABASE_URL 时用内嵌 PGlite；.env.example 默认指向 Postgres，注释掉以启用 PGlite
  sed -i 's|^DATABASE_URL=.*|# DATABASE_URL=|' .env
fi
JWT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" .env
# AI 密钥通过系统环境变量注入（可选），若需要请编辑 .env 填入 AI_API_KEY

log "[4/6] 构建后端 + 初始化数据库"
export npm_config_registry="$REGISTRY"
npm install --no-audit --no-fund
npm run build
npm run db:migrate

log "[5/6] 构建前端"
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

sleep 4
echo ""
echo "=============================================================="
if curl -s --max-time 5 -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/"; then
  echo "  服务已在本机 ${PORT} 端口响应！"
else
  echo "  注意：本机探测未通过，请查看日志：journalctl -u ${SERVICE_NAME} -n 50"
fi
IP=$(curl -s --max-time 3 ifconfig.me || hostname -I | awk '{print $1}')
echo "  访问地址： http://${IP}:${PORT}"
echo ""
echo "  演示账号：任意 11 位手机号 + 验证码（页面右下角绿色悬浮框里查看）"
echo "  或：登录页点「游客体验」1 秒进入"
echo ""
echo "  AI 对话：编辑 ${APP_DIR}/server/.env 填入 AI_API_KEY 后"
echo "  执行 systemctl restart ${SERVICE_NAME}"
echo "=============================================================="
