# 肠道花园（Gut Garden）

寓教于乐的儿童肠道消化科普应用 — 通过 CSS 3D 花园场景、食物投喂交互、每日打卡、便便分析和成长徽章，让 0-8 岁小朋友在玩耍中了解消化健康知识。

## 快速启动

```bash
# 前端（React + Vite）
cd web
npm install
npm run dev          # http://localhost:3000

# 后端（Fastify）
cd server
npm install
cp .env.example .env  # 编辑数据库连接等配置
npm run dev            # http://localhost:3001
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + Zustand + @dnd-kit + tsParticles + Howler.js + Lottie |
| 后端 | Fastify + TypeScript + Drizzle ORM |
| 数据库 | PostgreSQL |
| 特色 | CSS 3D 四层视差花园 + Lottie 角色动效 |

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
