# 开发任务清单 — 肠道花园（Gut Garden）

> **来源**: [gut-garden_系统设计.md](./gut-garden_系统设计.md)
> **团队**: 1 工程师 + 1 美工
> **周期**: 2 周（D1-D14）
> **技术栈**: React 18 + Fastify + PostgreSQL + CSS 3D + Lottie
> **生成日期**: 2026-07-27

---

## 文件路径速查

| 层    | 根路径                  |
| ---- | -------------------- |
| 前端   | `web/`               |
| 后端   | `server/`            |
| 数据库  | `server/db/`         |
| 美术素材 | `web/public/assets/` |

---

## 约定

- `[P]` = 可并行执行（不依赖其他任务）
- `[TDD]` = 测试任务（先写测试，后写实现）
- 任务 ID 全局递增

---

## Phase 1: 项目脚手架（D1）

### 1.1 前端脚手架

- [ ] T001 [P] 使用 Vite 创建 React + TypeScript 项目，安装依赖（react, react-router-dom, framer-motion, zustand, @dnd-kit/core, @dnd-kit/utilities, tsParticles, howler, lottie-web, radix-ui, tailwindcss）
      路径: `web/`
- [ ] T002 [P] 配置 Tailwind CSS + PostCSS，设置粉蓝绿调色板 CSS 变量
      路径: `web/tailwind.config.ts`, `web/src/index.css`
- [ ] T003 [P] 搭建路由骨架：`/` `/garden` `/checkin` `/badges` `/report` `/settings` `/login`，创建页面占位组件
      路径: `web/src/App.tsx`, `web/src/pages/*.tsx`
- [ ] T004 [P] 创建 Zustand store 骨架：gardenStore / checkinStore / badgeStore / authStore
      路径: `web/src/stores/*.ts`

### 1.2 后端脚手架

- [ ] T005 [P] 初始化 Fastify + TypeScript 项目，安装依赖（fastify, drizzle-orm, pg, jsonwebtoken, zod, @fastify/multipart, @fastify/cors, @fastify/jwt）
      路径: `server/`
- [ ] T006 [P] 配置 TypeScript、ESLint、环境变量（DATABASE_URL, JWT_SECRET, AI_API_KEY, STOOL_API_KEY）
      路径: `server/tsconfig.json`, `server/.env.example`
- [ ] T007 [P] 创建 Fastify 插件注册骨架：auth/jwt 插件、CORS 插件、multipart 插件
      路径: `server/src/app.ts`, `server/src/plugins/*.ts`

### 1.3 数据库

- [ ] T008 执行建表 SQL，创建 11 张表 + 18 条徽章种子数据
      路径: `server/db/gut-garden_schema.sql`
- [ ] T009 [P] 配置 Drizzle ORM，生成 schema 文件（所有表的 Drizzle 定义）
      路径: `server/src/db/schema/*.ts`
- [ ] T010 [P] 创建 Drizzle 迁移配置 + 首版 migration
      路径: `server/drizzle.config.ts`, `server/src/db/migrations/`

---

## Phase 2: 基础设施（D1-D2）

### 2.1 认证系统

- [ ] T011 [TDD] 编写 Auth 模块测试：发送验证码 / 登录 / Token 刷新 / Token 过期
      路径: `server/src/modules/auth/__tests__/auth.test.ts`
- [ ] T012 实现 SMS 验证码发送接口（MVP 用 Mock，预留真实短信网关接口）
      路径: `server/src/modules/auth/auth.service.ts` → `sendCode()`
- [ ] T013 实现手机号验证码登录接口，返回 JWT token pair（access + refresh）
      路径: `server/src/modules/auth/auth.service.ts` → `login()`
- [ ] T014 实现 JWT 中间件：解析 token → 注入 `req.user`（parent_id）
      路径: `server/src/plugins/auth.ts`
- [ ] T015 实现前端 AuthProvider + 登录页面 UI + 验证码输入组件
      路径: `web/src/providers/AuthProvider.tsx`, `web/src/pages/LoginPage.tsx`

### 2.2 儿童档案 CRUD

- [ ] T016 [TDD] 编写 Children 模块测试：创建档案 / 列表查询 / 更新 / 年龄校验
      路径: `server/src/modules/children/__tests__/children.test.ts`
- [ ] T017 [P] 创建 Children schema + Drizzle model
      路径: `server/src/db/schema/children.ts`
- [ ] T018 实现 Children Service：listByParent / create / update / getById
      路径: `server/src/modules/children/children.service.ts`
- [ ] T019 实现 Children API 路由：GET /api/children / POST /api/children / PUT /api/children/:id
      路径: `server/src/modules/children/children.routes.ts`
- [ ] T020 实现前端儿童选择/切换组件 + 创建档案表单
      路径: `web/src/components/ChildSwitcher.tsx`, `web/src/components/CreateChildForm.tsx`

### 2.3 通用前端组件

- [ ] T021 [P] 实现 Layout 骨架（右侧边栏 + 主内容区 + 响应式）
      路径: `web/src/components/Layout.tsx`
- [ ] T022 [P] 实现通用 UI 组件库（Button, Modal, Toast, ProgressBar, Spinner）
      路径: `web/src/components/ui/*.tsx`
- [ ] T023 [P] 封装 API 请求客户端（fetch 封装 + JWT 自动附带 + 错误拦截 + 401 自动跳登录）
      路径: `web/src/lib/api.ts`

---

## Phase 3: 探索花园（D2-D3）

### 3.1 花园场景渲染

- [ ] T024 [P] 实现 GardenStage 容器（CSS `perspective: 1200px` + 4 层视差容器）
      路径: `web/src/components/garden/GardenStage.tsx`
- [ ] T025 [P] 实现 ParallaxLayer 组件（接收 translateZ + speed 参数，自动响应鼠标位移）
      路径: `web/src/components/garden/ParallaxLayer.tsx`
- [ ] T026 [P] 实现鼠标视差 hook（useParallax：监听 mousemove → 计算各层偏移量）
      路径: `web/src/hooks/useParallax.ts`
- [ ] T027 实现场景状态切换 hook（根据 gardenStore.current_state 切换场景 PNG + CSS filter 过渡）
      路径: `web/src/hooks/useGardenScene.ts`
- [ ] T028 组装花园页面：4 层 ParallaxLayer + 角色层 + 粒子层 + HUD
      路径: `web/src/pages/GardenPage.tsx`

### 3.2 角色系统

- [ ] T029 [P] 实现 LottiePlayer 组件（封装 lottie-web，支持 play/stop/switch 动画）
      路径: `web/src/components/garden/LottiePlayer.tsx`
- [ ] T030 [P] 实现 Character 组件（PNG 立绘 + Lottie 动效叠加 + Framer Motion 入场/位移）
      路径: `web/src/components/garden/Character.tsx`
- [ ] T031 实现 gardenStore 角色状态管理（positions, animations, currentCharacter）
      路径: `web/src/stores/gardenStore.ts`
- [ ] T032 实现菌小园待机状态切换逻辑（根据花园状态自动切换 idle/happy/worry）
      路径: `web/src/hooks/useCharacterState.ts`

### 3.3 食物投喂交互

- [ ] T033 [P] 实现 FoodToolbar 组件（底部食物栏，使用 @dnd-kit `useDraggable`）
      路径: `web/src/components/garden/FoodToolbar.tsx`
- [ ] T034 实现投喂 DropZone（花园区域，使用 @dnd-kit `useDroppable` + 松手检测）
      路径: `web/src/components/garden/DropZone.tsx`
- [ ] T035 实现投喂动画：Framer Motion 抛物线路径（x/y 贝塞尔曲线 + 缩放 + 旋转）
      路径: `web/src/hooks/useFeedAnimation.ts`
- [ ] T036 实现投喂逻辑：更新 gardenStore（moisture/sugar 计算）→ 写入花园状态 → 触发角色反应
      路径: `web/src/hooks/useFeedLogic.ts`

### 3.4 花园后端 API

- [ ] T037 [TDD] 编写 Garden 模块测试：获取状态 / 记录行为 / 状态流转校验
      路径: `server/src/modules/garden/__tests__/garden.test.ts`
- [ ] T038 [P] 创建 garden_states + garden_action_logs Drizzle model
      路径: `server/src/db/schema/garden.ts`
- [ ] T039 实现 Garden Service：getState / logAction（含状态机流转逻辑 healthy↔high_sugar/dry/recovering）
      路径: `server/src/modules/garden/garden.service.ts`
- [ ] T040 实现花园水分值衰减定时任务（每 30 分钟 -2 点，dry 阈值触发角色变化）
      路径: `server/src/modules/garden/garden.decay.ts`
- [ ] T041 实现 Garden API 路由：GET /api/garden/state / POST /api/garden/log-action
      路径: `server/src/modules/garden/garden.routes.ts`

### 3.5 环境特效

- [ ] T042 [P] 配置 tsParticles 花园花粉漂浮粒子（小圆点、缓动、随机方向）
      路径: `web/src/components/garden/ParticleLayer.tsx`
- [ ] T043 [P] 实现 CSS 溪流流动动画（`@keyframes` 水平位移 + 背景 repeat）
      路径: `web/src/styles/garden-animations.css`
- [ ] T044 [P] 实现放大镜悬停效果（MagnifierOverlay：CSS `transform: scale(2)` 半透明遮罩）
      路径: `web/src/components/garden/MagnifierOverlay.tsx`

---

## Phase 4: 每日打卡（D4-D5）

### 4.1 打卡后端

- [ ] T045 [TDD] 编写 Checkin 模块测试：获取今日任务 / 确认吃好 / 确认睡好 / 补签 / 连续天数 / 补签次数限制
      路径: `server/src/modules/checkin/__tests__/checkin.test.ts`
- [ ] T046 [P] 创建 checkin_records + checkin_calendar Drizzle model
      路径: `server/src/db/schema/checkin.ts`
- [ ] T047 实现 Checkin Service：getToday / confirmEat / confirmSleep / makeup / getCalendar
      路径: `server/src/modules/checkin/checkin.service.ts`
- [ ] T048 实现自动打卡检测：花园交互 ≥ 3 次时自动将 task_garden 从 pending → auto_done
      路径: `server/src/modules/checkin/checkin.service.ts` → `autoDetectGarden()`
- [ ] T049 实现连续打卡天数计算（含补签处理逻辑：补签不打断连续性，但总补签 ≤ 3 次/月）
      路径: `server/src/modules/checkin/checkin.service.ts` → `calcStreak()`
- [ ] T050 实现"吃好"任务跳过逻辑（保存 skip_reason，当天展示家长选择的原因）
      路径: `server/src/modules/checkin/checkin.service.ts` → `skipEatSuggestion()`
- [ ] T051 实现打卡日历接口（整月 status 返回：done/miss/makeup + garden_icon）
      路径: `server/src/modules/checkin/checkin.service.ts` → `getCalendar()`
- [ ] T052 实现 Checkin API 路由（6 个端点）
      路径: `server/src/modules/checkin/checkin.routes.ts`

### 4.2 打卡前端

- [ ] T053 实现打卡页面：3 项任务卡片（花园/吃好/睡好）+ 各自状态与确认按钮
      路径: `web/src/pages/CheckinPage.tsx`
- [ ] T054 [P] 实现 TaskCard 组件（任务图标 + 名称 + 状态 + 确认按钮 + 动态文案展示）
      路径: `web/src/components/checkin/TaskCard.tsx`
- [ ] T055 [P] 实现 Calendar 组件（月视图，颜色标记 done/miss/makeup，支持切换月份）
      路径: `web/src/components/checkin/Calendar.tsx`
- [ ] T056 [P] 实现 checkinStore（今日任务状态、日历数据、连续天数）
      路径: `web/src/stores/checkinStore.ts`
- [ ] T057 实现 CelebrationModal（打卡成功全屏庆祝：Lottie `fx_celebration_stars.json` 播放 + 连续天数展示）
      路径: `web/src/components/checkin/CelebrationModal.tsx`

---

## Phase 5: 便便分析与动态任务（D6-D8）

### 5.1 便便分析后端

- [ ] T058 [TDD] 编写 Stool 模块测试：上传 / 分析结果查询 / 图片校验 / 过期处理 / API 超时降级
      路径: `server/src/modules/stool/__tests__/stool.test.ts`
- [ ] T059 [P] 创建 stool_analyses Drizzle model
      路径: `server/src/db/schema/stool.ts`
- [ ] T060 实现图片上传接口（multipart/form-data → 本地/S3 存储 → 返回 URL）
      路径: `server/src/modules/stool/stool.service.ts` → `upload()`
- [ ] T061 实现第三方便便分析 API 对接（发送图片 → 等待结果 → 解析 Bristol 类型 + diagnosis + task_suggestion）
      路径: `server/src/modules/stool/stool-analysis.client.ts`
- [ ] T062 实现分析失败降级策略（API 超时/不可用 → 返回"菌小园今天有点累"文案 + 支持手动重试）
      路径: `server/src/modules/stool/stool.service.ts` → `analyze()`
- [ ] T063 实现 Bristol 7 型诊断 → 动态任务映射（硬编码 JSON 配置：Type 1→便秘/多喝水吃蔬菜, Type 6→腹泻/补水…）
      路径: `server/src/config/bristol-task-mapping.json`
- [ ] T064 实现动态任务写入 checkin_records.task_eat_content + 3 天有效期逻辑 + 过期恢复默认
      路径: `server/src/modules/stool/stool.service.ts` → `applyTaskSuggestion()`
- [ ] T065 实现当日已确认冲突处理（分析结果应用到明日任务）
      路径: `server/src/modules/stool/stool.service.ts` → `handleConflict()`
- [ ] T066 实现 Stool API 路由（3 个端点）
      路径: `server/src/modules/stool/stool.routes.ts`

### 5.2 便便分析前端

- [ ] T067 实现 StoolUpload 组件（拖拽/点击上传区 + 预览 + 上传进度 + 分析中 loading 状态）
      路径: `web/src/components/checkin/StoolUpload.tsx`
- [ ] T068 实现布里斯托 7 型对照图展示卡片（从科普卡片资源加载）
      路径: `web/src/components/checkin/BristolScaleCard.tsx`
- [ ] T069 实现分析结果展示：Bristol 类型 + 诊断文字 + 动态任务文案 + 家长"跳过"按钮 + 跳过原因选择器
      路径: `web/src/components/checkin/AnalysisResult.tsx`

---

## Phase 6: 徽章系统（D8-D10）

### 6.1 徽章条件引擎

- [ ] T070 [TDD] 编写 Badge 引擎测试：首次打卡 → 获得铜徽章 / 连续 7 天 → 银升级 / 连续 100 天 → 金升级 / 投喂 50 次 / 事件防重
      路径: `server/src/modules/badges/__tests__/badge-engine.test.ts`
- [ ] T071 [P] 创建 badge_defs + badge_awards Drizzle model
      路径: `server/src/db/schema/badge.ts`
- [ ] T072 实现 BadgeConditionEngine（事件驱动、规则 JSON 解析、9 种条件类型判断、聚合查询）
      路径: `server/src/modules/badges/badge-engine.ts`
- [ ] T073 实现徽章发放逻辑：检查条件 → 插入 badge_awards（含 event_id 防重）→ 累积 XP → 检查等级升级
      路径: `server/src/modules/badges/badge.service.ts` → `evaluateAndAward()`
- [ ] T074 实现徽章升级逻辑：已获铜 + 满足 silver_rule → 插入银记录（保留铜记录）；银→金同理
      路径: `server/src/modules/badges/badge.service.ts` → `upgradeBadge()`
- [ ] T075 将徽章检测挂载到所有触发事件点：打卡完成 / 花园行为日志写入 / 问答完成 / 便便分析完成
      路径: `server/src/modules/badges/badge-hooks.ts`

### 6.2 徽章后端 API + 花园等级

- [ ] T076 实现 Badge API 路由：已获得列表 / 待获得列表（含进度百分比）/ 徽章定义全量
      路径: `server/src/modules/badges/badges.routes.ts`
- [ ] T077 实现花园等级系统（Lv.1-10，经验值曲线，等级升级触发解锁 features + 通知）
      路径: `server/src/modules/garden/garden-level.service.ts`
- [ ] T078 实现 garden_xp 累积规则（打卡 +10xp, 投喂 +2xp, 问答答对 +3xp, 徽章铜 +20xp/银 +50xp/金 +100xp）
      路径: `server/src/config/xp-rules.json`

### 6.3 徽章前端

- [ ] T079 [P] 实现 BadgeGrid 组件（徽章墙：已获得彩色 + 待获得灰阶 + 稀有度边框样式）
      路径: `web/src/components/badges/BadgeGrid.tsx`
- [ ] T080 [P] 实现 BadgeCard 组件（单个徽章：图标 + 名称 + 稀有度光效 + 获得日期）
      路径: `web/src/components/badges/BadgeCard.tsx`
- [ ] T081 [P] 实现 GardenLevelBar 组件（等级进度条 + 经验值动画 + 解锁提示）
      路径: `web/src/components/badges/GardenLevelBar.tsx`
- [ ] T082 实现 BadgeRevealModal（新徽章揭晓全屏动画：Lottie `fx_badge_reveal.json` + 徽章旋转展示）
      路径: `web/src/components/badges/BadgeRevealModal.tsx`
- [ ] T083 实现徽章页面（已获得网格 + 待获得进度列表 + 花园等级条）
      路径: `web/src/pages/BadgePage.tsx`
- [ ] T084 [P] 实现 badgeStore
      路径: `web/src/stores/badgeStore.ts`

---

## Phase 7: 成长报告（D10-D11）

### 7.1 报告后端

- [ ] T085 [TDD] 编写 Report 模块测试：周报告生成 / 月报告生成 / 无数据降级 / 快照幂等
      路径: `server/src/modules/report/__tests__/report.test.ts`
- [ ] T086 [P] 创建 growth_report_snapshots + quiz_records Drizzle model
      路径: `server/src/db/schema/report.ts`
- [ ] T087 实现 Report Service：生成 12 项指标快照（打卡率、连续天数、花园等级、徽章数、便便分析次数、Bristol 分布、投喂统计、问答正确率、使用时长等）
      路径: `server/src/modules/report/report.service.ts`
- [ ] T088 实现每日凌晨批处理：聚合昨日数据 + 生成/更新本周/本月 growth_report_snapshots
      路径: `server/src/modules/report/report-cron.ts`
- [ ] T089 实现 Report API 路由：GET /api/report/weekly / GET /api/report/monthly
      路径: `server/src/modules/report/report.routes.ts`

### 7.2 报告前端（家长视图）

- [ ] T090 [P] 实现指标卡片组件（单个指标：图标 + 数值/百分比 + 同环比箭头 + 趋势迷你图）
      路径: `web/src/components/report/MetricCard.tsx`
- [ ] T091 [P] 实现 4 维度指标区（打卡习惯 / 消化健康 / 花园探索 / 知识学习）
      路径: `web/src/components/report/MetricSection.tsx`
- [ ] T092 实现成长报告页面（家长视图：4 维度 12 指标 + 周/月切换 + 无数据引导状态）
      路径: `web/src/pages/ReportPage.tsx`

---

## Phase 8: AI 导览 + 科普问答（D11）

### 8.1 AI 后端

- [ ] T093 实现 SSE 流式接口（POST /api/ai/chat → OpenAI/Claude API → SSE 逐字返回）
      路径: `server/src/modules/ai/ai.routes.ts`
- [ ] T094 实现预设 FAQ 兜底（常用问题列表 + 预设答案，AI 不可用时自动切 FAQ 模式）
      路径: `server/src/config/faq-presets.json`
- [ ] T095 [P] 创建 quiz_records Drizzle model（如果 Phase 7 未创建）
      路径: `server/src/db/schema/quiz.ts`
- [ ] T096 实现每日问答逻辑（随机出题 + 答案校验 + 记录保存）
      路径: `server/src/modules/ai/quiz.service.ts`

### 8.2 AI 前端

- [ ] T097 [P] 实现 AIChatbot 全局悬浮组件（菌小园头像按钮 + 对话气泡 + SSE 流式文本渲染 + 打字效果）
      路径: `web/src/components/ai/AIChatbot.tsx`
- [ ] T098 实现问答卡片组件（问题 + 4 选项 + 正确/错误动画反馈）
      路径: `web/src/components/ai/QuizCard.tsx`

---

## Phase 9: 首页 + 设置（D12）

### 9.1 首页

- [ ] T099 [P] 实现 KingKongZone 组件（4 个金刚按钮：探索花园/每日打卡/成长徽章/我的报告 + 图标 + 跳转）
      路径: `web/src/components/home/KingKongZone.tsx`
- [ ] T100 [P] 实现 GardenBackground 组件（首页轻量花园背景：微缩版 2 层视差，静态非交互）
      路径: `web/src/components/home/GardenBackground.tsx`
- [ ] T101 实现首页（金刚区 + 花园背景 + 右侧边栏显示今日打卡缩略 + 最新徽章缩略）
      路径: `web/src/pages/HomePage.tsx`

### 9.2 设置

- [ ] T102 [P] 实现设置页面（儿童档案编辑 + 每日使用时长限制滑块 + 切换儿童 + 退出登录）
      路径: `web/src/pages/SettingsPage.tsx`

---

## Phase 10: 每日定时任务（D12）

- [ ] T103 实现每日凌晨 cron job：生成所有 active children 今日 checkin_records + 检查过期 stool_analyses + 更新 checkin_calendar
      路径: `server/src/cron/daily-reset.ts`
- [ ] T104 实现每周/每月报告自动生成 cron job
      路径: `server/src/cron/report-generation.ts`
- [ ] T105 实现过期 stool_analyses 清理 job（标记过期 + 图片文件清理）
      路径: `server/src/cron/stool-cleanup.ts`

---

## Phase 11: 集成测试与收尾（D13-D14）

### 11.1 测试

- [ ] T106 [TDD] 编写端到端集成测试：登录→创建儿童→进入花园投喂→打卡确认→上传便便→查看徽章→查看报告
      路径: `server/src/__tests__/e2e/`
- [ ] T107 前端关键页面截图对比测试（花园 4 种状态 / 打卡 3 种状态 / 徽章墙 / 报告页）
- [ ] T108 性能测试：花园页面 CSS 3D 渲染帧率 ≥ 30fps / API 响应 P95 < 500ms
- [ ] T109 异常场景全覆盖测试（见设计文档 §9.2 异常场景表）
- [ ] T110 边界场景全覆盖测试（见设计文档 §9.3 边界场景表）

### 11.2 优化

- [ ] T111 Lottie JSON 按需懒加载（首屏仅加载 idle，其他动画 prefetch）
- [ ] T112 图片资源预加载策略（场景 PNG 首屏优先，徽章按需加载）
- [ ] T113 CSS `will-change` + `transform: translateZ(0)` GPU 合成层优化
- [ ] T114 API 响应缓存（花园状态 / 徽章列表用 Redis 或内存缓存，MVP 可跳过）
- [ ] T115 音效 sprites 合并 + Howler.js 音效池预加载

### 11.3 部署准备

- [ ] T116 [P] Docker Compose 配置（web + server + postgres + nginx）
- [ ] T117 [P] Nginx 配置（静态资源 gzip + API 代理 + SSE 长连接配置）
- [ ] T118 [P] 部署文档 + 环境变量清单

---

## 美工任务清单

> 详见 [美术素材清单与交付规范.md](./美术素材清单与交付规范.md)

| Sprint | 截止 | 内容 | 数量 |
|--------|------|------|------|
| S1 | D5 | 菌小园(1 PNG + 3 Lottie) + 纤纤种子(1 PNG + 2 Lottie) + 场景 4 层 + 速赢徽章 5 枚 + 首页/打卡 UI 13 个 | ~33 项 |
| S1 | D7 | 食物道具 5 张 + 庆祝特效 3 Lottie | 8 项 |
| S2 | D10 | 杂草坏菌(1 PNG + 2 Lottie) + 丁丁泉灵(1 PNG + 2 Lottie) + 香蕉小船(1 PNG + 2 Lottie) + 场景变体 2 张 | ~10 项 |
| S2 | D13 | 剩余徽章 26 张 + 科普卡片 6 张 + UI 补全 8 个 | 40 项 |
| **合计** | | | **~89 项** |

---

## 依赖关系图

```
Phase 1 (脚手架)
  ├── T001-T004 前端搭建 ──┐
  ├── T005-T007 后端搭建 ──┤
  └── T008-T010 数据库 ────┤
                            ▼
Phase 2 (基础设施) ◄──────── 前置依赖
  ├── T011-T015 认证系统
  ├── T016-T020 儿童档案
  └── T021-T023 通用组件
         │
         ├──────────────────────────────────────┐
         ▼                                      ▼
Phase 3 (探索花园)                      Phase 4 (每日打卡)
  T024-T044                              T045-T057
  (依赖: 通用组件 + 后端)                 (依赖: 儿童档案 + 花园自动检测)
         │                                      │
         └────────────┬─────────────────────────┘
                      ▼
              Phase 5 (便便分析)
                T058-T069
                (依赖: 打卡模块 — 需要 checkin_id)
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
  Phase 6 (徽章系统)       Phase 7 (成长报告)
    T070-T084                T085-T092
    (依赖: 打卡+花园)        (依赖: 打卡+便便+徽章)
          │                       │
          └───────────┬───────────┘
                      ▼
              Phase 8 (AI 导览)
                T093-T098
                (独立模块，可并行)
                      │
                      ▼
              Phase 9 (首页+设置)
                T099-T102
                (聚合所有模块)
                      │
                      ▼
              Phase 10 (定时任务)
                T103-T105
                      │
                      ▼
              Phase 11 (集成收尾)
                T106-T118
```

---

## 并行执行建议

### Week 1 并行策略

```
工程师                       美工
───────                      ────
D1: Phase 1 (T001-T010)     角色概念设计 + 场景草图
D2: Phase 2 (T011-T023)     菌小园 3 种 Lottie + 场景 4 层 PNG
D3: Phase 3 花园渲染         纤纤种子 2 种 Lottie + 食物道具
    (T024-T032)              
D4: Phase 3 投喂 +          打卡页 UI 素材 + 速赢徽章 5 枚
    Phase 4 打卡后端           
D5: Phase 4 打卡前端         首页金刚区图标 + 庆祝特效
    (T053-T057)              
D6: Phase 5 便便后端         —
    (T058-T066)              
D7: Phase 5 便便前端        Week 1 素材交付验收
    (T067-T069)              
```

### Week 2 并行策略

```
工程师                       美工
───────                      ────
D8: Phase 6 徽章引擎         杂草坏菌 + 丁丁泉灵 + 香蕉小船
    (T070-T078)              (3 PNG + 6 Lottie)
D9: Phase 6 徽章前端         场景状态变体 2 张
    (T079-T084)              
D10: Phase 7 成长报告        剩余徽章 26 张
     (T085-T092)             
D11: Phase 8 AI 导览         科普卡片 6 张
     (T093-T098)             
D12: Phase 9 首页+设置 +     UI 补全 8 个
     Phase 10 定时任务        
D13: Phase 11 集成测试       素材精细调整 + 最终交付
D14: 最终测试 + BugFix       —
     + Sprint Review          
```

---

## 任务统计

| 阶段 | 任务数 | 可并行 |
|------|--------|--------|
| Phase 1: 脚手架 | 10 | 8 |
| Phase 2: 基础设施 | 13 | 7 |
| Phase 3: 探索花园 | 21 | 10 |
| Phase 4: 每日打卡 | 13 | 5 |
| Phase 5: 便便分析 | 12 | 3 |
| Phase 6: 徽章系统 | 15 | 7 |
| Phase 7: 成长报告 | 8 | 4 |
| Phase 8: AI 导览 | 6 | 3 |
| Phase 9: 首页+设置 | 4 | 3 |
| Phase 10: 定时任务 | 3 | 2 |
| Phase 11: 集成收尾 | 13 | 4 |
| **合计** | **118** | **56** |

---

## MVP 范围确认

MVP 必须交付（对标 PRD F01-F17）：

- [x] 手机号登录 + 儿童档案管理
- [x] 花园场景（4 层视差 + 5 个角色）
- [x] 食物投喂交互（拖拽 + 抛物线动画 + 状态变化）
- [x] 放大镜科普
- [x] 每日打卡（3 项任务 + 日历）
- [x] 便便分析 → 动态任务闭环（Bristol 7 型 + 3 天有效期）
- [x] 徽章体系（18 枚 + 铜/银/金 + 条件引擎）
- [x] 花园等级（Lv.1-10 + XP）
- [x] 成长报告（周/月 + 12 指标）
- [x] AI 导览对话（大模型 + FAQ 兜底）
- [x] 家长设置页面

MVP 可延后：

- [ ] 风车蘑菇/云角马/虎宝角色
- [ ] Redis 缓存层
- [ ] WebSocket 实时推送
- [ ] Apple Health 数据同步
- [ ] 节庆限定徽章
- [ ] WeChat 小程序 / App 端
