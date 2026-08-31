# 在线演示站部署指南（评委可点击直接体验）

目标：把「肠道花园」部署到一台**国内可直接访问的云服务器**，评委打开一个网址就能玩，**不需要代理、不需要安装任何东西**。

---

## 第 0 步：你需要准备的东西

1. **一台国内云服务器**（二选一，学生认证都很便宜）：
   - 腾讯云轻量应用服务器：`https://cloud.tencent.com/product/lighthouse`（学生机约 10 元/月）
   - 阿里云轻量应用服务器：`https://www.aliyun.com/product/swas`（学生机约 9.5 元/月）
   - 系统选 **Ubuntu 22.04**，配置 **2 核 2G** 以上即可
2. **一个 Gitee（码云）账号**：`https://gitee.com`（手机号注册，免费）
   - 用途：镜像代码仓库（国内克隆快、评委看代码也快）

---

## 第 1 步：把代码镜像到 Gitee（约 3 分钟）

> 服务器从 Gitee 拉代码比从 GitHub 快得多，也避免服务器拉不动 GitHub 的问题。

1. 登录 Gitee，点右上角 **+** → **新建仓库**
   - 仓库名：`gut-garden`
   - 勾选 **公开**（Private 需要部署时配置凭据，麻烦）
   - 不要勾选「初始化仓库」（保持空仓库）
2. 在你的电脑上打开终端，执行：

```bash
cd D:\GutGardenBeta
git remote add gitee https://gitee.com/你的用户名/gut-garden.git
git push gitee master
```

（用户名换成你的 Gitee 用户名；首次会要求输入 Gitee 账号密码或令牌）

完成后，在浏览器打开 `https://gitee.com/你的用户名/gut-garden` 能看到代码即成功。

---

## 第 2 步：登录服务器并一键部署（约 5 分钟）

用你的电脑连上服务器（Windows 用 PowerShell 或 SSH 工具）：

```bash
ssh root@你的服务器IP
```

（腾讯云/阿里云控制台里能重置 root 密码，然后 `ssh root@IP` 回车输入密码即可）

登录后执行：

```bash
# 拉取部署脚本（用你自己 Gitee 用户名替换）
curl -O https://gitee.com/你的用户名/gut-garden/raw/master/deploy/deploy.sh
bash deploy.sh https://gitee.com/你的用户名/gut-garden.git
```

脚本会自动：装 Node 22 → 拉代码 → 装依赖 → 建表 → 构建前端 → 启动服务。

**看到 "部署完成！" 后，访问地址就是：**
```
http://你的服务器IP:3001
```

---

## 第 3 步：放行端口（很重要，别漏了）

云服务器默认只开放 22 端口，**必须手动放行 3001**：

- **腾讯云**：控制台 → 防火墙 → 添加规则 → TCP:3001 → 允许
- **阿里云**：控制台 → 安全组 → 配置规则 → 入方向 → 添加 TCP:3001 来源 0.0.0.0/0

（如果服务器开了 ufw：`sudo ufw allow 3001/tcp`）

---

## 第 4 步：打开验证

浏览器访问 `http://你的服务器IP:3001`：

- 登录页点 **「游客体验」** → 输入宝宝名字 → 1 秒进入
- 或输入任意 11 位手机号 → 点「发送验证码」→ 页面右下角绿色悬浮框里有验证码 → 登录
- 有 AI 对话、每日打卡、花园喂食、便便分析、知识课堂、徽章、好友

> **AI 对话提示**：默认已带 FAQ 关键词回答；想用真实大模型（通义千问），编辑 `server/.env` 填上 `AI_API_KEY`，然后 `systemctl restart gut-garden`。AI Key 申请见根目录 README。

---

## 常见问题

| 问题 | 处理 |
|------|------|
| 页面打不开 | 检查第 3 步端口是否放行；`systemctl status gut-garden` 看服务状态 |
| 想看运行日志 | `journalctl -u gut-garden -f` |
| 重启服务器后服务会自动起来吗 | 会，systemd 已设开机自启 |
| 数据在哪 | `server/.data/`（内嵌 PGlite，无需装数据库） |
| 想更新代码 | 服务器上 `cd /opt/gut-garden && git pull && cd server && npm run build && systemctl restart gut-garden` |

---

## 可选：绑定域名 + HTTPS

如果比赛要求更正式，可以买一个便宜域名（如 `.cn` 几块钱/年），在腾讯云/阿里云解析到服务器 IP，再配 HTTPS（用 Nginx + 免费证书，或直接用云厂商的免费 SSL）。普通演示 **IP:3001 即可，不必上域名**。
