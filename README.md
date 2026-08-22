# 肠道花园（Gut Garden）

寓教于乐的儿童肠道消化科普应用 — 通过 CSS 3D 花园场景、食物投喂交互、每日打卡、便便分析和成长徽章，让 0-8 岁小朋友在玩耍中了解消化健康知识。

---

## 🚀 快速部署与启动（第一眼就看这里）

**环境要求**：Node.js ≥ 20.19（推荐 LTS 22），npm。**无需安装数据库** —— 后端内置 PGlite（Postgres WASM），开箱即用，数据自动保存在 `server/.data/`。

```bash
# ① 启动后端 API（端口 3001）
cd server
npm install
npm run db:migrate   # 首次运行：自动建表 + 写入徽章定义（幂等，可重复执行）
npm run dev

# ② 启动前端（端口 3000）—— 另开一个终端
cd web
npm install
npm run dev
```

然后浏览器打开 **http://localhost:3000** 即可。

> 生产部署：后端 `cd server && npm run build && npm run start`；前端 `cd web && npm run build`（产物在 `web/dist/`），用任意静态服务器托管并反代 `/api` 到后端即可。

### 🔑 演示登录：账号 / 验证码怎么看

本项目用 **手机号 + 验证码** 登录（模拟短信，不发真实短信），**任意 11 位手机号都能直接注册**：

| 方式 | 操作 | 说明 |
|------|------|------|
| 游客体验（最快） | 登录页点「游客体验」→ 输入宝宝名字 → 开始探索 | 无需手机号，1 秒进入，自带一个宝宝 |
| 手机号登录（完整功能） | 登录页切「注册登录」→ 输手机号（如 `13800000001`）→ 点「发送验证码」 | 见下方「验证码怎么拿」 |

**验证码怎么拿**（点「发送验证码」后，任选一处查看 6 位数字）：
1. **页面右下角的绿色悬浮框**「演示验证码（模拟短信）」—— App 内置，最方便；
2. 后端控制台打印 `[sms-mock] 验证码 13800000001 → 123456`。

把 6 位数字填入验证码输入框，点「登录/注册」即可进入。

> ⚠️ 注意：验证码 5 分钟内有效；同一手机号 **60 秒内**只能发送一次。新手机号会自动注册家长账号，但还没有宝宝档案——登录后到「个人中心」点「添加宝宝」建档即可。

### ⚙️ 可选配置（`server/.env`，从 `.env.example` 复制）

| 变量 | 作用 | 不配置时的行为 |
|------|------|----------------|
| `DATABASE_URL` | 使用外部 PostgreSQL | 默认内置 PGlite，无需任何配置 |
| `AI_API_KEY` | 菌小园 AI 问答（阿里云百炼 DashScope 通义千问 qwen-flash） | 自动降级为本地 FAQ 回答 |
| `STOOL_API_KEY` | 便便拍照视觉分析（外部 API） | 使用本地规则（mock）分析 |
| `ADMIN_PHONES` | 管理员手机号（逗号分隔） | 无管理员 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + Framer Motion + @dnd-kit + tsParticles + Howler.js + Lottie |
| 后端 | Fastify + TypeScript + Drizzle ORM |
| 数据库 | PostgreSQL（内置 PGlite，可选外部实例） |
| AI | 阿里云百炼 · 通义千问（qwen-flash） |
| 特色 | CSS 3D 四层视差花园 + Lottie 角色动效 + 便便垂直 AI 建议 |

## 文档索引

| 文档 | 路径 |
|------|------|
| 业务需求分析 | [docs/00-customer-requirements/](docs/00-customer-requirements/) |
| 产品需求说明书 | [docs/20-prd/gut-garden_产品需求说明书.md](docs/20-prd/gut-garden_产品需求说明书.md) |
| 系统设计 | [docs/30-system-design/gut-garden_系统设计.md](docs/30-system-design/gut-garden_系统设计.md) |
| 任务清单 | [docs/30-system-design/gut-garden_tasks.md](docs/30-system-design/gut-garden_tasks.md) |
| 美术素材规范 | [docs/30-system-design/美术素材清单与交付规范.md](docs/30-system-design/美术素材清单与交付规范.md) |
| 建表 SQL | [docs/30-system-design/gut-garden_schema.sql](docs/30-system-design/gut-garden_schema.sql) |

## 看板

[GitHub Project 看板](https://github.com/users/Zeadeinsung/projects/3) — 按天分组，工程师和美工任务并排显示。
