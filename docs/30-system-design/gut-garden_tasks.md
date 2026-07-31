# 开发任务清单 — 肠道花园（Gut Garden）

> **来源**: [gut-garden_系统设计.md](./gut-garden_系统设计.md) / [前端架构设计](./gut-garden_前端架构设计.md) / [feature.json](../../.adspecs/feature.json)
> **团队**: 1 工程师 + 1 美工
> **周期**: 7 天（D1-D7）
> **技术栈**: React 18 + TypeScript + Tailwind v4 + Framer Motion + Zustand + @dnd-kit + Lottie + Fastify + PostgreSQL + Drizzle ORM
> **版本**: v3.0（5 主项打卡 + 徽章两层分离 + 固定 Header + 11 页面）
> **生成日期**: 2026-07-31

---

## 文件路径速查

| 层 | 根路径 | 说明 |
| ---- | ---- | ---- |
| 前端 | `web/` | React + Vite + TypeScript |
| 后端 | `server/` | Fastify + TypeScript |
| 数据库 | `server/db/` | PostgreSQL + Drizzle ORM |
| 美术素材 | `web/public/assets/` | 详见 [美术素材清单与交付规范](./美术素材清单与交付规范.md) |
| 类型定义 | `web/src/types/` | 前后端共享类型 |
| 布局定义 | `scratch/gut-garden_layout_all_pages.json` | 11 页面块级坐标 |

---

## 约定

- `[P]` = 可并行执行
- `[API]` = 需要后端接口
- `[ART]` = 依赖美术素材
- 任务 ID 全局递增，格式 `T001-TXXX`
- 每个任务卡片包含：**规格说明** + **验收标准** + **文件路径** + **预估工时**

---

## Day 1: 项目脚手架 + 数据库 + 类型基础（D1）

> **目标**: 前后端项目跑起来，数据库表建好，类型定义完成，页面路由骨架就位
> **交付物**: `npm run dev` 可启动，12 张数据库表就绪，10 个页面占位组件可路由

---

### T001 [P] 前端项目初始化

**规格**:
- 使用 Vite 5 创建 React 18 + TypeScript 项目
- 安装全部依赖：`react@18`, `react-dom@18`, `react-router-dom@6`, `framer-motion@11`, `zustand@4`, `@dnd-kit/core`, `@dnd-kit/utilities`, `lottie-web`, `howler`, `radix-ui`（Dialog/Popover/Tooltip/Slider/Switch）, `tailwindcss@4`
- 配置 `vite.config.ts`：路径别名 `@/` → `src/`，SSE 代理到后端 `localhost:3001`
- 配置 `tsconfig.json`：strict mode，路径别名

**验收标准**:
- `cd web && npm run dev` 启动成功，浏览器打开看到 Vite 默认页
- `npm run build` 无报错

**文件路径**: `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`

**预估工时**: 0.5h

---

### T002 [P] Tailwind v4 + CSS 变量 + 全局样式

**规格**:
- 配置 Tailwind v4 `@theme`：新增 6 个自定义颜色变量
- 设置 CSS 变量在 `index.css`：
  - `--color-garden-forest: #4E6A3E`
  - `--color-garden-cream: #FFF9EF`
  - `--color-garden-coral: #F38D83`
  - `--color-garden-hero: #B06AB3`
  - `--font-size-child-base: 18px`
  - `--font-size-parent-base: 14px`
- 配置全局字体：儿童文字（ZCOOL KuaiLe / Comic Neue fallback）+ 家长文字（Noto Serif SC）
- 重置默认样式 `body { margin: 0; background: var(--color-garden-cream); }`
- 创建全局动画样式 `web/src/styles/animations.css`：定义 `@keyframes float`, `@keyframes pulse-glow`, `@keyframes slideUp`, `@keyframes fadeIn`

**验收标准**:
- 打开浏览器，body 背景为奶油米色 `#FFF9EF`
- DevTools 检查 CSS 变量可读取
- 全局动画 keyframes 在 DevTools Styles 面板可见

**文件路径**: `web/src/index.css`, `web/src/styles/animations.css`

**预估工时**: 0.5h

---

### T003 [P] 10 页面路由骨架 + Layout 组件

**规格**:
- 使用 `react-router-dom` v6 配置 10 条路由 + 1 个全局弹窗
- 所有页面组件初始为占位组件（显示页面名称 + 后续开发标注）
- 路由表：

| 路由 | 页面组件 | 游客可访问 | 说明 |
| ---- | ---- | ---- | ---- |
| `/` | `HomePage` | ✅ | 首页 |
| `/garden` | `GardenPage` | ✅ | 探索花园 |
| `/classroom` | `ClassroomPage` | ✅ | 探索课堂 |
| `/checkin` | `CheckinPage` | ✅ | 每日打卡 |
| `/badges` | `BadgePage` | ✅ | 成长徽章 |
| `/profile` | `ProfilePage` | ✅ | 我的主页 |
| `/report` | `ReportPage` | ❌ | 成长报告 |
| `/settings` | `SettingsPage` | ❌ | 设置 |
| `/login` | `LoginPage` | ✅ | 登录/注册 |
| `/onboarding` | `OnboardingPage` | ✅ | 新用户引导 |

- Layout 组件包裹 `<Outlet />`：底部 Dock 常驻 + 右侧 AI 面板常驻 + 页面切换 Framer Motion 动画（`AnimatePresence` + `fadeIn` 300ms）
- 路由守卫 `<ProtectedRoute>` 包裹 `/report` `/settings`（检查 `authStore.isGuest` → 跳转 `/login`）
- 路由懒加载 `React.lazy(() => import(...))`

**验收标准**:
- 浏览器地址栏输入 10 条路由，均显示对应页面占位组件（无 404）
- 未登录访问 `/report` → 自动跳转 `/login`
- 页面切换有 300ms 淡入过渡

**文件路径**: `web/src/App.tsx`, `web/src/components/Layout.tsx`, `web/src/components/ProtectedRoute.tsx`, `web/src/pages/*.tsx`

**预估工时**: 1h

---

### T004 [P] TypeScript 类型定义全量

**规格**:
- 创建 5 个类型文件，覆盖全部数据模型：

`web/src/types/garden.ts`:
```ts
type GardenState = 'healthy' | 'high_sugar' | 'dry' | 'recovering';
type GrowthStage = 1 | 2 | 3 | 4 | 5 | 6;
interface GardenStateData { child_id: number; current_state: GardenState; moisture_level: number; growth_stage: GrowthStage; garden_xp: number; unlocked_features: string[]; last_updated: string; }
interface GardenActionLog { id: number; child_id: number; action_type: 'feed' | 'explore' | 'magnifier' | 'treatment'; action_detail: Record<string, unknown>; created_at: string; }
```

`web/src/types/checkin.ts`:
```ts
type TaskStatus = 'pending' | 'done' | 'auto_done';
type SubItemCode = 'water' | 'vegetable' | 'fruit' | 'outdoor' | 'early_sleep';
interface CheckinRecord { id: number; child_id: number; checkin_date: string; task_explore: TaskStatus; task_eat: TaskStatus; task_sleep: TaskStatus; task_water: TaskStatus; task_sport: TaskStatus; is_makeup: boolean; makeup_date: string | null; completed_at: string | null; }
interface CheckinCalendarDay { calendar_date: string; status: 'done' | 'miss' | 'makeup'; sub_items_completed: number; garden_icon: string; }
// 5 主项任务定义（2026-07-31 更新）
interface MainTask { code: 'explore' | 'eat' | 'sleep' | 'water' | 'sport'; name: string; icon: string; description: string; isCompound?: boolean; subTasks?: string[]; }
```

`web/src/types/badges.ts`:
```ts
type BadgeCategory = 'persist' | 'explore' | 'learn' | 'special';
type BadgeRarity = 'bronze' | 'silver' | 'gold';
interface BadgeDef { id: number; code: string; name: string; category: BadgeCategory; description: string; condition_rule: Record<string, unknown>; silver_rule?: Record<string, unknown>; gold_rule?: Record<string, unknown>; sort_order: number; }
interface BadgeAward { id: number; child_id: number; badge_def_id: number; rarity: BadgeRarity; awarded_at: string; }
// 两层分离：21 图标 + 3 边框
interface BadgeDisplay { iconUrl: string; frameUrl: string; rarity: BadgeRarity; }
```

`web/src/types/classroom.ts`:
```ts
type ModuleCode = 'fiber_square' | 'ferment_workshop' | 'scfa_spring' | 'barrier_wall' | 'eco_station';
type QuestionType = 'single_choice' | 'pairing' | 'ordering';
interface KnowledgeModule { module_code: ModuleCode; name: string; description: string; cards_unlocked: number; cards_total: number; animation_watched: boolean; completed: boolean; }
interface KnowledgeCard { id: number; module_code: ModuleCode; title: string; front_image: string; back_content: string; child_summary: string; parent_detail: string; }
interface QuizQuestion { id: number; module_code: ModuleCode; question_type: QuestionType; question: string; options: string[]; correct_answer: string | string[]; }
```

`web/src/types/user.ts`:
```ts
interface Parent { id: number; phone: string; created_at: string; }
interface Child { id: number; parent_id: number | null; nickname: string; age: number; daily_limit_minutes: number; avatar_url: string | null; }
interface AuthState { token: string | null; parent: Parent | null; activeChild: Child | null; isGuest: boolean; guestId: string; }
```

**验收标准**:
- 所有 interface/enum/type 可被其他文件 import，TypeScript 编译无报错
- 5 个类型文件无语法错误

**文件路径**: `web/src/types/garden.ts`, `web/src/types/checkin.ts`, `web/src/types/badges.ts`, `web/src/types/classroom.ts`, `web/src/types/user.ts`

**预估工时**: 0.5h

---

### T005 [P] Zustand Store 骨架（6 个 Store）

**规格**:
- 创建 6 个 Zustand Store，每个 Store 包含完整的 state interface + actions
- 游客模式数据通过 `persist` middleware 自动写入 localStorage
- 6 个 Store 定义：

| Store | 文件名 | 核心 State | 持久化（localStorage） |
| ---- | ---- | ---- | ---- |
| `authStore` | `authStore.ts` | token, parent, activeChild, isGuest, guestId | token + guestId only |
| `gardenStore` | `gardenStore.ts` | currentState, moistureLevel, growthStage, gardenXp, interactionCount, unlockedFeatures | 全部持久化 |
| `checkinStore` | `checkinStore.ts` | todayTasks (5 主项), streak, longestStreak, calendarData, stoolReportBanner | todayTasks + streak |
| `badgeStore` | `badgeStore.ts` | awardedBadges[], pendingBadges[], currentStage | awardedBadges |
| `classroomStore` | `classroomStore.ts` | modules[5], quizHistory | 全部持久化 |
| `uiStore` | `uiStore.ts` | onboardingComplete, sidebarOpen, readingLevel, activeModal, fps, deviceTier | onboardingComplete only |

- 每个 Store 包含 `loadFromLocalStorage()` 和 `syncToBackend()` 方法（游客模式桥接）
- `uiStore` 额外包含：`setReadingLevel('child'|'parent')`, `toggleSidebar()`, `openModal()`, `closeModal()`

**验收标准**:
- 6 个 Store 均可 import，TypeScript 无报错
- 在浏览器 Console 中可调用 `zustand` devtools 查看各 Store 初始值
- `uiStore` 切换 readingLevel，Console 输出新值

**文件路径**: `web/src/stores/authStore.ts`, `web/src/stores/gardenStore.ts`, `web/src/stores/checkinStore.ts`, `web/src/stores/badgeStore.ts`, `web/src/stores/classroomStore.ts`, `web/src/stores/uiStore.ts`

**预估工时**: 1h

---

### T006 [P] localStorage 工具库 + 游客数据管理

**规格**:
- 实现 `web/src/lib/localStorage.ts`：
  - `getGuestData<T>(key: string): T | null` — 读取游客数据
  - `setGuestData<T>(key: string, data: T): void` — 写入游客数据
  - `removeGuestData(key: string): void` — 删除单个 key
  - `clearAllGuestData(): void` — 注册后清除所有游客数据
  - `migrateGuestData(parentId: number, childId: number): Promise<void>` — 注册时迁移数据到后端（POST `/api/auth/migrate`）
- 数据 key 命名规范：`gut_garden_{storeName}`
- 所有读写包裹 `try-catch`，catch 内静默降级（localStorage 不可用时不影响功能）

**验收标准**:
- 浏览器 Console 调用 `setGuestData('test', {a:1})` → `getGuestData('test')` 返回 `{a:1}`
- 隐私模式下 localStorage 不可用 → 不抛异常
- `clearAllGuestData()` 后所有 `gut_garden_*` key 被清除

**文件路径**: `web/src/lib/localStorage.ts`

**预估工时**: 0.5h

---

### T007 [P] API 请求客户端封装

**规格**:
- 实现 `web/src/lib/api.ts`：
  - `apiClient` 基于 `fetch` 封装
  - 自动从 `authStore` 读取 JWT token，附加到 `Authorization: Bearer xxx` header
  - 响应拦截：`code !== 0` → 抛出自定义 `ApiError`（含 code + message）
  - 401 错误自动清除 token → 切换到游客模式 → 弹出登录引导
  - 网络错误静默重试 1 次（仅 GET 请求）
  - `api.get<T>(url, params?)` / `api.post<T>(url, body)` / `api.put<T>(url, body)` — 泛型方法
- 导出 SSE 流式请求方法 `api.stream(url, body, onChunk, onDone, onError)`

**验收标准**:
- `api.get('/api/health')` 返回 `{code:0, data:'ok'}`
- 模拟 401 响应 → 自动清除 token 并触发登录引导
- SSE 方法接收逐块回调

**文件路径**: `web/src/lib/api.ts`

**预估工时**: 0.5h

---

### T008 [P] 通用 UI 组件库

**规格**:
- 实现 6 个基础 UI 组件（基于 Radix UI + Tailwind v4）：

| 组件 | 文件 | 关键 Props | 说明 |
| ---- | ---- | ---- | ---- |
| `Button` | `Button.tsx` | variant('primary'/'secondary'/'ghost'), size('sm'/'md'/'lg'), disabled, loading, onClick | 胶囊圆角 12px, 悬停 scale 1.05, 点击 scale 0.95 |
| `Modal` | `Modal.tsx` | open, onClose, title, children, size('sm'/'md'/'lg') | Radix Dialog 封装，毛玻璃背景，入场弹跳动画 |
| `Toast` | `Toast.tsx` | message, type('success'/'error'/'info'), duration | 右上角滑入，3s 自动消失，可手动关闭 |
| `ProgressBar` | `ProgressBar.tsx` | value(0-100), color, label, showValue | 圆角进度条 + Framer Motion 数字递增动画 |
| `Spinner` | `Spinner.tsx` | size, color | CSS border 旋转动画 |
| `DualText` | `DualText.tsx` | childText, parentText, defaultLevel | 双阅读层级：根据 `uiStore.readingLevel` 自动切换显示内容 |

- 所有组件导出到 `web/src/components/ui/index.ts`
- `DualText` 组件实现逻辑：读取 `uiStore.readingLevel`，`'child'` 显示 `childText`，`'parent'` 显示 `parentText`

**验收标准**:
- 创建 Storybook 或临时测试页面，6 个组件均可交互
- `DualText` 切换 readingLevel → 显示内容自动变化
- `Button` 点击无障碍：Tab 聚焦 + Enter/Space 触发

**文件路径**: `web/src/components/ui/Button.tsx`, `web/src/components/ui/Modal.tsx`, `web/src/components/ui/Toast.tsx`, `web/src/components/ui/ProgressBar.tsx`, `web/src/components/ui/Spinner.tsx`, `web/src/components/ui/DualText.tsx`, `web/src/components/ui/index.ts`

**预估工时**: 1.5h

---

### T009 [P] 底部 7-Tab Dock 导航栏 + Hero CTA 按钮

**规格**:
- 实现 `BottomDock` 组件：`3 + 1 + 3` 对称式 7-Tab 底部导航
- 布局：宽度 100%，高度 80px，y=720（固定于画布底部）
- 7 个 Tab：

| 位置 | Tab 名称 | 图标 | 路由 | 说明 |
| ---- | ---- | ---- | ---- | ---- |
| 左1 | 苗页 | `ui_nav_home.svg` | `/` | 首页 |
| 左2 | 探索花园 | `ui_nav_garden.svg` | `/garden` | 花园交互 |
| 左3 | 每日打卡 | `ui_nav_checkin.svg` | `/checkin` | 打卡页面 |
| **中** | **拍便便分析** | `ui_nav_stool.svg` | — | **Hero CTA 按钮** |
| 右1 | 探索课堂 | `ui_nav_classroom.svg` | `/classroom` | 知识学习 |
| 右2 | 成长徽章 | `ui_nav_badges.svg` | `/badges` | 徽章陈列 |
| 右3 | 我的主页 | `ui_nav_profile.svg` | `/profile` | 个人中心 |

- **Hero CTA 按钮**（中央）：
  - 尺寸 64×64px，粉紫渐变 `#B06AB3`，圆形凸起突破 Dock 顶部 16px
  - 点击弹出 `StoolRecordModal` 弹窗（图标选择 / 拍照上传双模式）
  - 微呼吸动画（Framer Motion `animate={{ scale: [1, 1.05, 1] }}` loop）
- **选中态**：胶囊型高亮容器（Pill），主题色背景
- **未选中态**：低亮度暗色图标 + 小字标签
- **触控最小尺寸**：48×48px
- 使用 `useLocation()` 判断当前路由，自动高亮对应 Tab

**验收标准**:
- 7 个 Tab 全部显示，点击切换路由，选中态高亮正确
- Hero CTA 按钮点击 → 弹出 `StoolRecordModal`（当前可为占位弹窗）
- 浏览器窗口 1280×800 → Dock 位置 y=720 精确

**文件路径**: `web/src/components/navigation/BottomDock.tsx`, `web/src/components/navigation/HeroCTAButton.tsx`

**预估工时**: 1h

---

### T010 后端项目初始化

**规格**:
- 初始化 Fastify + TypeScript 项目
- 安装全部依赖：`fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/multipart`, `drizzle-orm`, `pg`, `zod`, `dotenv`
- 配置 `tsconfig.json`：strict mode，路径别名 `@/` → `src/`
- 创建 `server/src/app.ts`：注册 CORS（允许 `localhost:5173`）、JWT 插件、multipart 插件、路由注册
- 创建 `server/src/plugins/auth.ts`：JWT 验证中间件（解析 token → 注入 `req.user`，无 token 的游客请求正常通过）
- `.env.example` 文件：`DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, `STOOL_API_KEY`, `PORT=3001`
- API 统一响应格式：`{ code: number, data?: T, message?: string }`

**验收标准**:
- `cd server && npm run dev` 启动成功，控制台输出 `Server running on port 3001`
- `curl http://localhost:3001/api/health` 返回 `{"code":0,"data":"ok"}`

**文件路径**: `server/package.json`, `server/tsconfig.json`, `server/.env.example`, `server/src/app.ts`, `server/src/plugins/auth.ts`

**预估工时**: 1h

---

### T011 数据库建表 + Drizzle ORM 配置

**规格**:
- 执行 `server/db/gut-garden_schema.sql` 建表 SQL，创建全部 12 张表
- 12 张表：`parents`, `children`, `checkin_records`, `stool_analyses`, `badge_defs`, `badge_awards`, `garden_states`, `garden_action_logs`, `knowledge_module_progress`, `quiz_records`, `growth_report_snapshots`, `checkin_calendar`
- 执行 21 条徽章种子数据（徽章定义表 `badge_defs`）
- 配置 Drizzle ORM：
  - `server/drizzle.config.ts`：数据库连接、Schema 路径、Migration 输出目录
  - 为 12 张表创建 Drizzle Schema 定义文件（`server/src/db/schema/*.ts`），每个文件定义一个表
  - 创建 `server/src/db/index.ts`：导出 `db` 实例 + 所有 schema
- Migration 初始化：生成首版 migration SQL 文件

**验收标准**:
- PostgreSQL 数据库中 12 张表全部存在（`\dt` 列出）
- `SELECT * FROM badge_defs` 返回 21 行徽章定义数据
- Drizzle schema 定义与 SQL DDL 字段一致（TypeScript 编译无报错）

**文件路径**: `server/db/gut-garden_schema.sql`, `server/drizzle.config.ts`, `server/src/db/index.ts`, `server/src/db/schema/*.ts`, `server/src/db/migrations/`

**预估工时**: 1.5h

---

### T012 [P] 前端 AuthProvider + ReadingLevelProvider

**规格**:
- `AuthProvider`：
  - 包裹整个 App，提供 `authStore` 的 React Context
  - 首次加载时检查 localStorage 中是否有 token → 有则恢复登录态
  - 无 token → 自动生成 `guestId: uuid` → 进入游客模式
  - 提供 `login(phone, code)` / `logout()` / `switchChild(childId)` 方法
- `ReadingLevelProvider`：
  - 从 `uiStore.readingLevel` 读取当前阅读层级
  - 提供 `toggleReadingLevel()` 切换方法
  - 入口：Header 右下角半透明 📖 图标（20×20px），儿童不易发现

**验收标准**:
- 首次访问 → `authStore.isGuest = true`，localStorage 有 `gut_garden_guestId`
- 关闭浏览器重新打开 → guestId 保持不变（从 localStorage 恢复）
- 📖 图标点击 → `readingLevel` 在 child/parent 间切换

**文件路径**: `web/src/providers/AuthProvider.tsx`, `web/src/providers/ReadingLevelProvider.tsx`

**预估工时**: 1h

---

## Day 2: 认证 + 花园场景 + 角色 + 投喂（D2）

> **目标**: 游客可登录注册，花园场景 3 层视差可浏览，2 个核心角色待机动画播放，食物拖拽投喂交互可用
> **交付物**: 登录页 + 花园页（场景 + 角色 + 投喂 + 放大镜）

---

### T013 [API] 手机号验证码登录 API

**规格**:
- `POST /api/auth/send-code`：接收 `{phone}` → 生成 6 位随机验证码 → MVP 打印到控制台（预留真实 SMS 接口）→ 60s 内不可重复发送
- `POST /api/auth/login`：接收 `{phone, code}` → 验证 code → 存在则更新 last_login_at → 返回 JWT token pair（access 15min + refresh 7d）→ 不存在则自动创建 parent 记录

**验收标准**:
- 发送验证码 → 控制台可见 6 位验证码 → 60s 内重复发送返回错误
- 用验证码登录 → 返回 access token + refresh token
- 新手机号首次登录 → `parents` 表新增一条记录

**文件路径**: `server/src/modules/auth/auth.routes.ts`, `server/src/modules/auth/auth.service.ts`

**预估工时**: 1h

---

### T014 [API] 游客数据迁移 API

**规格**:
- `POST /api/auth/migrate`（需 JWT）：
  - 接收 `{guestId, childData}`
  - 创建 children 记录（关联当前 parent_id）
  - 批量迁移 5 类数据：garden_states, checkin_records, stool_analyses (mode=icon_selection), badge_awards, knowledge_module_progress
  - 整体事务（一个失败全部回滚）
  - 返回新 child_id

**验收标准**:
- 游客有 3 天打卡记录 → 注册 → 迁移后后端数据库可见 3 条 checkin_records
- 迁移失败（如手机号已注册过该 child）→ 返回错误码 `MIGRATE_001`
- 事务回滚：模拟中途失败 → 所有表无残留数据

**文件路径**: `server/src/modules/auth/migrate.service.ts`, `server/src/modules/auth/auth.routes.ts`

**预估工时**: 1h

---

### T015 [API] 儿童档案 CRUD API

**规格**:
- `GET /api/children`（需 JWT）：返回当前 parent 下所有 children，按 created_at 排序
- `POST /api/children`（需 JWT）：`{nickname, age, avatar_url?}` → age 校验 3-10 → 创建 children 记录
- `PUT /api/children/:id`（需 JWT）：更新 nickname / age / daily_limit_minutes / avatar_url
- 创建 children 时自动初始化 garden_states（growth_stage=1, moisture_level=50, garden_xp=0）

**验收标准**:
- 创建儿童档案（age=5）→ 成功 → `children` 表可见 + `garden_states` 表可见初始记录
- 创建 age=2 或 age=11 → 返回 `CHILD_002` 错误
- GET 列表按创建时间排序

**文件路径**: `server/src/modules/children/children.routes.ts`, `server/src/modules/children/children.service.ts`

**预估工时**: 0.5h

---

### T016 登录页面 UI + 验证码输入组件

**规格**:
- 登录页面布局（参照 `scratch/gut-garden_layout_all_pages.json` login 定义）：
  - 居中卡片式布局（512×400），奶油米底色 + 森林绿边框
  - 顶部菌小园插画 + "欢迎来到肠道花园" 标题
  - 手机号输入框（11 位中国大陆手机号格式校验）
  - 验证码输入框（6 位数字）+ [获取验证码] 按钮（60s 倒计时）
  - [登录] 按钮（主色森林绿，胶囊圆角）
  - 底部 "跳过，先逛逛" 链接（进入游客模式 → 跳转 `/`）
- 验证码组件 `CodeInput`：6 个独立数字格，自动聚焦跳格，Backspace 返回上一格
- 登录成功后调用 `authStore.login()` → 跳转 `/`

**验收标准**:
- 输入 11 位手机号 → 点击获取验证码 → 按钮变灰 60s 倒计时
- 输入正确验证码 → 登录成功 → 跳转首页
- 点击 "跳过，先逛逛" → 游客模式 → 跳转首页

**文件路径**: `web/src/pages/LoginPage.tsx`, `web/src/components/ui/CodeInput.tsx`

**预估工时**: 1h

---

### T017 [P] 3 层视差容器组件

**规格**:
- `GardenStage`：CSS 3D 透视容器
  - `perspective: 1200px`, `perspective-origin: center`
  - 尺寸：1280×720（填满主内容区）
  - `overflow: hidden`, `position: relative`
- `ParallaxLayer`：接收 `speed: number` + `translateZ: number`
  - 3 层分别配置：

| 图层 | translateZ | 速度系数 | 内容 |
| ---- | ---- | ---- | ---- |
| Sky-Far | -200px | 0.15x | `scene_far.png`（天空 + 远山） |
| Mid | 0px | 0.5x | `scene_mid.png`（花园主体 + 角色） |
| Front | 150px | 0.8x | `scene_near.png`（前排花草/栅栏） |

- `useParallax` hook：监听 `mousemove` → 计算各层水平偏移量（最大位移 5% 视口宽度，防儿童晕动）
- 低端降级：`uiStore.fps < 30` → 关闭视差（仅显示静态图层）

**验收标准**:
- 鼠标移动 → 3 层以不同速度偏移（近景最快、远景最慢）
- `prefers-reduced-motion` 媒体查询匹配 → 视差停止
- FPS < 30 → 静态图层模式

**文件路径**: `web/src/components/garden/GardenStage.tsx`, `web/src/components/garden/ParallaxLayer.tsx`, `web/src/hooks/useParallax.ts`

**预估工时**: 1.5h

---

### T018 [P] [ART] LottiePlayer + Character 角色组件

**规格**:
- `LottiePlayer`：
  - 封装 `lottie-web`，支持 `play`, `stop`, `switchAnimation(jsonPath)`
  - props: `animationData`, `loop`, `autoplay`, `speed`
  - 懒加载：首屏仅加载 idle，其他动画 `IntersectionObserver` 触发
- `Character`：
  - 组合 PNG 立绘（`<img>`）+ Lottie 动效（`<LottiePlayer>`）
  - Framer Motion 入场动画：`initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
  - 状态切换：`idle` → `happy` → `worry`，切换 Lottie JSON
  - 默认播放 `breathing` 待机循环
- `useCharacterState` hook：根据 `gardenStore.currentState` 自动切换角色状态
  - healthy → idle / happy
  - high_sugar → worry
  - dry → worry
  - recovering → idle

**验收标准**:
- 菌小园 PNG + idle Lottie 呼吸动画循环播放
- 花园状态切换 → 角色表情/动画同步切换
- 低端模式（FPS < 30）→ Lottie 替换为静态 PNG

**文件路径**: `web/src/components/garden/LottiePlayer.tsx`, `web/src/components/garden/Character.tsx`, `web/src/hooks/useCharacterState.ts`

**预估工时**: 1.5h

---

### T019 [P] 花园场景状态切换 + 场景变体

**规格**:
- `useGardenScene` hook：
  - 根据 `gardenStore.currentState` 自动切换中景层图片
  - healthy → `scene_mid_healthy.png`
  - high_sugar → `scene_mid_high_sugar.png`（偏暗黄、溪流油污）
  - dry → `scene_mid_dry.png`（干涸、植被饱和度降低）
  - 切换时 CSS `filter` 过渡 800ms ease-in-out
- 花园 6 阶段成长场景元素解锁：
  - 阶段 1（种子）：仅显示基础场景
  - 阶段 2（幼苗）：解锁第一个角色动画
  - 阶段 3（成长）：解锁放大镜功能入口
  - 阶段 4（丰收）：解锁花园状态切换能力
  - 阶段 5（大师）：解锁全部角色
  - 阶段 6（终极）：场景金边特效（CSS `box-shadow: 0 0 30px gold`）

**验收标准**:
- 手动设置 gardenStore.currentState 为 'dry' → 场景色调变为低饱和度
- 阶段切换 → 相应功能解锁/锁定（UI 入口显示/隐藏）

**文件路径**: `web/src/hooks/useGardenScene.ts`

**预估工时**: 1h

---

### T020 食物投喂交互（拖拽 + 抛物线 + 状态更新）

**规格**:
- `FoodToolbar`：底部食物选择栏
  - 显示 7 种食物道具（MVP 使用 5 种）：西兰花🥦、胡萝卜🥕、酸奶🫙、糖果🍬、蛋糕🍰
  - 横向排列，每项包含食物图标 + 名称
  - @dnd-kit `useDraggable` 包装每个食物项
- `DropZone`：花园场景中的投喂区域
  - @dnd-kit `useDroppable` 检测松手位置
  - 松手时触发投喂动画
- `useFeedAnimation` hook：
  - Framer Motion 抛物线路径 `animate={{ x: [0, targetX], y: [0, -100, targetY] }}`
  - 持续时间 600ms，`ease: easeOut`
- `useFeedLogic` hook：
  - 投喂后更新 `gardenStore.moistureLevel`
  - 投喂高糖食物（糖果/蛋糕）→ 状态倾向 high_sugar
  - 投喂纤维食物（西兰花/胡萝卜）→ 状态倾向 healthy
  - 投喂 3 次 → `gardenStore.interactionCount` 递增 → 触发 `task_explore: auto_done`

**验收标准**:
- 从食物栏拖拽西兰花 → 放入花园区域 → 抛物线飞行动画 → 花园水分值 +2
- 投喂糖果 3 次 → 花园状态从 healthy 变为 high_sugar
- 今日花园交互 ≥3 次 → 打卡页 `task_explore` 自动完成

**文件路径**: `web/src/components/garden/FoodToolbar.tsx`, `web/src/components/garden/DropZone.tsx`, `web/src/hooks/useFeedAnimation.ts`, `web/src/hooks/useFeedLogic.ts`

**预估工时**: 1.5h

---

### T021 环境特效（粒子 + CSS 动画）

**规格**:
- `ParticleLayer`：tsParticles 花园花粉漂浮
  - 小圆点粒子（opacity: 0.4, color: #D4E7C5）
  - 随机方向缓动，密度 30 个粒子
  - `prefers-reduced-motion` 时暂停
- CSS 场景动画（`web/src/styles/garden-animations.css`）：
  - 溪流流动：`@keyframes flow { 0% { background-position: 0 0; } 100% { background-position: -200px 0; } }`，`animation: flow 8s linear infinite`
  - 风车旋转：`@keyframes spin { to { transform: rotate(360deg); } }`，`animation: spin 4s linear infinite`
- `MagnifierOverlay` 放大镜组件：
  - 鼠标悬停花园区域 → 显示半透明放大镜（CSS `transform: scale(2)`）
  - 显示当前区域科普文字（如 "这里是肠道屏障城墙，保护花园不受坏菌入侵～"）
  - 移动端替代方案：点击触发（无 hover）

**验收标准**:
- 花园页可见漂浮花粉粒子（30 个浅绿色小圆点）
- 溪流背景持续水平滚动、风车持续旋转
- 鼠标悬停花园区域 → 放大镜叠加显示

**文件路径**: `web/src/components/garden/ParticleLayer.tsx`, `web/src/styles/garden-animations.css`, `web/src/components/garden/MagnifierOverlay.tsx`

**预估工时**: 1h

---

### T022 花园页组装

**规格**:
- 组装 `GardenPage` 组件（参照 `scratch/gut-garden_layout_all_pages.json` garden 定义）：
  - **Header**：← 返回 + 标题"探索花园" + 4 项核心指标（生态 Lv/繁荣度/居民数/连续天数）+ 用户模块 + 设置/音效
  - **左侧面板**（`x=16, w=232`）：`GardenStatusCard`（生态状态大卡片）+ `ImpactFactorsList`（实时影响因素正负增量列表）
  - **中央画布**（`x=264, w=752, y=78`）：`GardenStage`（3 层视差）+ `POITags`（悬浮兴趣点标签）+ `Character`（Lottie 角色）
  - **右侧面板**（`x=1032, w=248`）：`AssistantPanel`（AI 助手）+ `ObservationList`（观察洞察）+ `TipCard`（今日建议）
  - **底部工具栏**（y=640）：浇水💧 / 清理🧹 / 种植🌱 / 放大镜🔬 / 拍照📸 — 红色角标提示待办数量
- `POITag` 组件：悬浮标签（知识模块入口），鼠标悬停高亮 + 弹出简介（"这里是居民之家，住着 8 位小菌民～"）

**验收标准**:
- 花园页完整布局：左栏（状态+影响因素）+ 中央（3 层视差场景+角色+POI）+ 右栏（AI 助手）+ 底部工具栏
- 所有区域坐标与 layout JSON 定义一致
- Header 四槽位标准：左(返回+标题) / 中(HUD) / 用户 / 控制

**文件路径**: `web/src/pages/GardenPage.tsx`, `web/src/components/garden/GardenHUD.tsx`, `web/src/components/garden/GardenStatusCard.tsx`, `web/src/components/garden/ImpactFactorsList.tsx`, `web/src/components/garden/POITag.tsx`, `web/src/components/garden/QuickActionToolbar.tsx`

**预估工时**: 1.5h

---

### T023 [API] 花园状态 API + 行为日志 API

**规格**:
- `GET /api/garden/state?child_id=`：返回 `GardenStateData`（current_state, moisture_level, growth_stage, garden_xp）
- `POST /api/garden/log-action`：记录花园行为 `{child_id, action_type, action_detail}`
  - 写入 `garden_action_logs` 表
  - 更新 `garden_states.moisture_level`（食物类型影响水分 ±）
  - 更新 `garden_states.garden_xp`（投喂 +2xp）
  - 返回 `{interaction_count_today}`（当日总交互次数）
- `GET /api/garden/actions/today-count?child_id=`：返回今日花园交互次数（用于打卡自动检测）

**验收标准**:
- 投喂西兰花 → log_action → garden_xp +2 → 今日交互次数递增
- 当日交互 ≥3 次 → `/api/garden/actions/today-count` 返回 count ≥ 3

**文件路径**: `server/src/modules/garden/garden.routes.ts`, `server/src/modules/garden/garden.service.ts`

**预估工时**: 1h

---

## Day 3: 每日打卡 + 便便双模式（D3）

> **目标**: 5 主项打卡卡片完整交互，便便图标选择（默认）+ 拍照上传（注册用户），便便报告联动机制，打卡日历 + 庆祝动画
> **交付物**: 打卡页（5 卡片 + 日历 + 奖励）+ 便便记录弹窗（双模式）

---

### T024 [API] 5 主项打卡 API

**规格**:
- `GET /api/checkin/today?child_id=`：返回今日 5 项任务状态
  ```json
  {
    "checkin_date": "2026-07-31",
    "tasks": [
      {"code": "explore", "status": "auto_done", "name": "探索花园"},
      {"code": "eat",     "status": "done",      "name": "健康饮食"},
      {"code": "sleep",   "status": "pending",   "name": "优质睡眠"},
      {"code": "water",   "status": "pending",   "name": "补充水分"},
      {"code": "sport",   "status": "pending",   "name": "活力运动"}
    ],
    "streak": 12,
    "longest_streak": 15,
    "stool_reported_today": false,
    "stool_report_banner": null
  }
  ```
- `POST /api/checkin/confirm-task`：确认单项任务 `{child_id, task_code}` → 更新对应字段 → 检查是否全部完成
- `POST /api/checkin/makeup`：补签 `{child_id, calendar_date}` → 校验本月补签 ≤3 次 → 插入补签记录

**验收标准**:
- 依次确认 eat/sleep/water/sport → 全部 done → 返回 `all_completed: true`
- 本月第 4 次补签 → 返回 `CHECKIN_002`

**文件路径**: `server/src/modules/checkin/checkin.routes.ts`, `server/src/modules/checkin/checkin.service.ts`

**预估工时**: 1.5h

---

### T025 [API] 便便报告联动机制（3 层）

**规格**:
- 便便分析完成后 → 3 层联动：
  1. **横幅层**（banner）：`stool_report_banner` 显示在打卡页顶部 "🔬 今日便便观察：Type 4 香蕉便 — 非常健康！继续保持～"
  2. **卡片文案层**（card text）：`task_eat` 卡片的 hint 文案动态更新为便便分析的饮食建议（如 "多吃纤维食物吧！"）
  3. **确认提醒层**（confirmation）：确认 `task_eat` 时弹窗优先显示便便分析建议，询问是否采纳
- 便便结果 3 天有效期（`expires_at`），过期恢复默认文案
- 当日已确认 `task_eat` 后再提交便便 → 建议应用到明日任务

**验收标准**:
- 便便分析 Type 2（干硬）→ 打卡页顶部横幅显示 "多喝水，多吃纤维～" → task_water 卡片文案提示 "今日建议多补充水分"
- 便便结果 3 天后过期 → 打卡页无便便相关文案
- 先确认 task_eat → 后提交便便 → 建议出现在明天的卡片上

**文件路径**: `server/src/modules/stool/stool.service.ts`（`applyTaskSuggestion`, `handleConflict`）

**预估工时**: 1h

---

### T026 [API] 便便图标选择 API（默认模式，游客可用）

**规格**:
- `POST /api/stool/select-icon`：
  - 接收 `{child_id, stool_icon_type, bristol_type}`
  - 写入 `stool_analyses`（mode=icon_selection）
  - 返回基础诊断文案（Bristol 类型对应预设文案）
  - 触发便便报告联动（更新打卡页 banner/卡片文案）
- 游客模式：数据存 localStorage → 调用此接口但不写入数据库（返回计算结果）
- Bristol 7 型预设文案映射：
  - Type 1（兔子便便）→ "有点干哦，多喝水，多吃纤维丰富的蔬菜～"
  - Type 4（香蕉便）→ "非常健康！继续保持均衡饮食～"
  - Type 7（水样）→ "肚子不舒服吗？记得补充水分，如果持续要告诉爸爸妈妈哦～"

**验收标准**:
- 选择 Type 4 香蕉图标 → 返回 `diagnosis: "非常健康！"` + `task_suggestion: "继续保持均衡饮食～"`
- 游客模式选择 → localStorage 有记录，页面正常显示

**文件路径**: `server/src/modules/stool/stool.routes.ts`, `server/src/modules/stool/stool.service.ts`（`selectIcon`）

**预估工时**: 1h

---

### T027 [API] 便便照片上传 + AI 分析 API（注册用户）

**规格**:
- `POST /api/stool/upload`（需 JWT，multipart/form-data）：
  - 接收图片文件（≤10MB，格式 jpg/png/webp）
  - 调第三方便便分析 API → 返回 bristol_type + 诊断
  - 分析超时 30s → 返回降级文案 "菌小园今天有点累，请稍后重试～"
  - 分析失败 → 降级到图标选择模式（不阻塞用户）
  - 非便便图片 → 返回 `is_valid: false` + "请上传便便照片哦～"
- `GET /api/stool/analysis/:id`（需 JWT）：获取历史分析详情
- `GET /api/stool/latest?child_id=`（需 JWT）：最新分析结果

**验收标准**:
- 上传便便照片 → 30s 内返回分析结果（bristol_type + diagnosis）
- 上传风景照 → 返回 `STOOL_001`
- API 超时 → 返回 `STOOL_003` + 降级文案
- 游客访问 → 返回 `STOOL_005` "照片分析需要注册账号哦～"

**文件路径**: `server/src/modules/stool/stool.routes.ts`, `server/src/modules/stool/stool.service.ts`（`upload`, `analyze`）, `server/src/modules/stool/stool-analysis.client.ts`

**预估工时**: 1.5h

---

### T028 [API] 打卡日历 + 连续天数 API

**规格**:
- `GET /api/checkin/calendar?child_id=&month=`：
  - 返回整月日历数据（`CheckinCalendarDay[]`）
  - 每个日期包含 status（done/miss/makeup）+ sub_items_completed + garden_icon
- 连续天数计算（`calcStreak`）：
  - **正向强化**：取"历史最高连续天数"，中断不降级、不标红
  - 显示"当前连续"和"最高记录"两个值
  - 补签计入连续天数，但限制 ≤3 次/月
- 自动打卡检测：花园交互 ≥ 3 次 → `task_explore: auto_done`

**验收标准**:
- 连续打卡 5 天 → 中断 1 天 → 第 6 天打卡 → 当前连续=1，最高记录=5
- 补签昨天 → 连续天数恢复
- 月视图显示 7 月 31 天，已打卡日期绿色圆点

**文件路径**: `server/src/modules/checkin/checkin.service.ts`（`getCalendar`, `calcStreak`, `autoDetectGarden`）

**预估工时**: 1h

---

### T029 5 主项打卡页面 UI

**规格**:
- 打卡页面布局（参照 `layout JSON` checkin 定义，**5 张独立卡片**）：
  - **Header**（标准 4 槽位）：← 返回 + 标题"每日打卡" + 能量进度条 + 用户 + 设置/音效
  - **条件横幅**（y=78, h=48）：便便报告 banner（有便便分析结果时显示，无便便时不显示）
  - **5 张任务卡片**（垂直排列，间距 6px）：
    - ① 探索花园 `cardGarden`（y=88, h=72）— 复合卡片，含子任务行（小游戏/看视频/常识问答，其中常识问答常驻未锁定）
    - ② 健康饮食 `cardEat`（y=166, h=72）— 带便便报告联动文案提示
    - ③ 优质睡眠 `cardSleep`（y=244, h=72）
    - ④ 补充水分 `cardWater`（y=322, h=72）
    - ⑤ 活力运动 `cardSport`（y=400, h=72）
  - **底部**（y=560）：打卡日历（月视图）+ 今日奖励（4 个资源掉落物图标：💧+5 🍃+10 ⭐+5 ☀️+10）
  - **右侧面板**（x=1032, w=248）：助手卡片 + 今日小知识 + 快捷入口

- `TaskCard` 组件：
  - 每张卡片：左侧任务图标 + 任务名称 + 复选框 + 奖励数值
  - 状态颜色：pending（灰色虚线边框）、done（绿色实心填充 + 对勾 ✔）、auto_done（绿色 + "自动完成" 标签）
  - 点击 `pending` 卡片 → 确认弹窗（询问是否完成）
  - 点击 `done` 卡片 → Toast "已完成啦～"

- `CompoundCard`（探索花园专用）：
  - 主卡片下方展开 3 个子任务行：
    - 🎮 小游戏《肠道大冒险》（通关后标记完成）
    - 📺 科普视频 90s（观看后标记完成）
    - 🧩 常识问答 3 题（**常驻未锁定**，即使游戏+视频已完成，仍需每天完成问答）
  - 子任务全部完成 → 主卡片 `auto_done`

**验收标准**:
- 5 张卡片按 layout JSON 坐标精确定位
- 第 1 张（探索花园）展开显示 3 个子任务，其中常识问答始终可点击
- 点击"健康饮食"卡片 → 弹出确认弹窗
- 全部完成 → 所有卡片变绿 → 触发庆祝动画
- 便便报告有数据时 → 顶部显示 banner → task_eat 卡片显示联动文案

**文件路径**: `web/src/pages/CheckinPage.tsx`, `web/src/components/checkin/TaskCard.tsx`, `web/src/components/checkin/TaskCardList.tsx`, `web/src/components/checkin/CompoundCard.tsx`, `web/src/components/checkin/ReportBanner.tsx`

**预估工时**: 2h

---

### T030 [P] 便便记录弹窗（双模式）

**规格**:
- `StoolRecordModal` 全局弹窗（Hero CTA 或打卡页触发）：
  - **默认模式**（游客可用）：图标选择
    - 7 种布里斯托卡通图标展示（横向排列，2 行）
    - 点击选中 → 显示对应名称 + 简短说明
    - [确认记录] 按钮 → 调用 `POST /api/stool/select-icon` → Toast "记录成功！"
  - **高级模式**（注册用户）：拍照上传
    - 拖拽上传区域（虚线边框 + 📷 图标 + "点击或拖拽照片到这里"）
    - 上传预览 + 进度条
    - 分析中显示 Lottie 加载动画 + "菌小园正在分析中..."
    - 分析结果展示：Bristol 类型 + 诊断 + 动态任务文案
  - 底部说明文字："数据仅存本地 · 不构成医疗建议"
- `StoolIconSelector` 组件：
  - `stool_type_1_rabbit.png` ~ `stool_type_7_water.png`
  - 选中态：森林绿边框 + 轻微放大
- `StoolUpload` 组件：
  - 拖拽区域 + 文件选择
  - 游客点击 → 弹出注册引导 "拍照分析需要注册账号哦～"
  - 上传中 → `<Spinner>` + 进度百分比

**验收标准**:
- 点击 Hero CTA → 弹出 StoolRecordModal → 默认显示图标选择
- 选择 Type 4 → 确认 → Toast "记录成功！" → 打卡页顶部便便 banner 出现
- 注册用户切换到拍照模式 → 拖拽图片 → 上传 → 分析结果展示
- 游客点击拍照模式 → 弹出注册引导弹窗

**文件路径**: `web/src/components/stool/StoolRecordModal.tsx`, `web/src/components/stool/StoolIconSelector.tsx`, `web/src/components/stool/StoolUpload.tsx`

**预估工时**: 1.5h

---

### T031 [P] 打卡日历 + 今日奖励组件

**规格**:
- `CheckinCalendar` 组件：
  - 月视图网格（7 列 × 5-6 行），显示当前月份
  - 月份切换 ← → 箭头
  - 已打卡日期：绿色圆点 + 花园状态小图标
  - 今日：金色边框高亮
  - 漏签日期：灰色圆点 + "补签" 按钮（≤3 次/月时显示）
  - 补签日期：橙色圆点 + "补" 小标签
  - 点击任意日期 → 弹出当日详情（完成项 + 子项详情）
- `TodayRewards` 组件：
  - 4 个奖励掉落物图标：💧 水分 +5, 🍃 能量 +10, ⭐ 经验 +5, ☀️ 阳光 +10
  - 图标带 Framer Motion 微浮动动画（上下 0.8-1.2s cycle）

**验收标准**:
- 日历显示本月所有日期，已打卡日期有绿色圆点
- 点击漏签日期 → 显示补签按钮 → 点击补签成功 → 颜色变为橙色
- 本月补签 3 次后再点击 → Toast "本月补签次数已用完"

**文件路径**: `web/src/components/checkin/CheckinCalendar.tsx`, `web/src/components/checkin/TodayRewards.tsx`

**预估工时**: 1h

---

### T032 [P] 打卡庆祝动画

**规格**:
- `CelebrationModal` 组件：
  - 全部 5 项任务完成时触发
  - 全屏半透明遮罩（奶油米 80% opacity）
  - 中央 Lottie 庆祝动画 `fx_celebration.json`（星星爆炸 + 彩带）
  - 文字动画（Framer Motion 逐字弹出）："太棒了！今天全部完成！🎉"
  - 显示连续打卡天数 + 今日获得 XP 总量
  - 3s 后自动关闭或点击关闭
- `prefers-reduced-motion` 时：显示静态金色文字 + 徽章图标，无 Lottie 动画

**验收标准**:
- 全部 5 项确认完成 → 庆祝弹窗自动弹出
- 弹窗显示 "连续打卡 12 天" + "+25XP"
- 3s 后自动关闭

**文件路径**: `web/src/components/checkin/CelebrationModal.tsx`

**预估工时**: 0.5h

---

### T033 [API] 每日凌晨 cron 任务

**规格**:
- 实现 `server/src/cron/daily-reset.ts`：
  - 每日凌晨 00:00 UTC 执行
  - 对所有已注册 children，生成今日 `checkin_records`（5 项任务 status=pending）
  - 检查 `stool_analyses` 中 `expires_at < NOW()` 的记录 → 对应 children 的今日 `task_eat`/`task_water` 文案恢复默认
  - 更新 `checkin_calendar` 表（昨日漏签日期 status=miss，已打卡日期 status=done）
  - 聚合昨日数据生成 `growth_report_snapshots`

**验收标准**:
- 手动触发 cron → 昨日完成打卡的 child 生成了今日新记录 → 检查过期便便结果被清除

**文件路径**: `server/src/cron/daily-reset.ts`

**预估工时**: 1h

---

## Day 4: 探索课堂 + AI 导览（D4）

> **目标**: 5 大知识模块 S 型路径可浏览，知识卡片翻转交互，3 种题型问答，AI 聊天 SSE 流式对话 + FAQ 兜底
> **交付物**: 课堂页（模块地图 + 卡片翻转 + 问答）+ AI 侧边栏 + AI 聊天弹窗

---

### T034 [API] 知识模块 + 卡片 + 问答 API

**规格**:
- `GET /api/classroom/modules?child_id=`：返回 5 大知识模块及用户进度
  - 5 个模块：fiber_square（膳食纤维广场）, ferment_workshop（发酵工坊）, scfa_spring（短链脂肪酸泉）, barrier_wall（肠道屏障城墙）, eco_station（生态平衡观测站）
- `GET /api/classroom/modules/:code/cards`：返回该模块所有知识卡片
  - 每张卡片：`{id, title, front_image, back_content, child_summary, parent_detail}`
- `POST /api/classroom/quiz/answer`：提交问答答案
  - 接收 `{child_id, question_id, answer}`
  - 校验正确性 → 写入 `quiz_records`
  - 正确：返回 `correct: true` + +3xp
  - 错误：返回 `correct: false` + 正确答案提示
  - 全部通过 → 标记 `knowledge_module_progress.completed`

**验收标准**:
- `GET /api/classroom/modules` 返回 5 个模块，默认 cards_unlocked=0
- 提交正确问答答案 → `quizzes_passed` +1, garden_xp +3

**文件路径**: `server/src/modules/classroom/classroom.routes.ts`, `server/src/modules/classroom/classroom.service.ts`, `server/src/modules/classroom/quiz.service.ts`

**预估工时**: 1.5h

---

### T035 [P] [ART] 课堂页面 — S 型路径地图 + 模块节点

**规格**:
- `ClassroomPage` 布局（参照 layout JSON classroom 定义）：
  - **Header**：← 返回 + 挂牌标题 "探索课堂 / 探索肠道生命的秘密" + 知识树进度 🌳🌳🌳🌱 + 用户 + 设置/音效
  - **中央 S 型地图**（`ModuleFlowPath`）：
    - 5 个知识模块节点纵向 S 型排列，节点间用箭头/小径连接
    - 每个节点 `MapWaypoint`：模块建筑图标 + 名称 + 星级收集度（如 ⭐⭐⭐ 3/6）+ 进度环
    - 未解锁节点灰度显示 + 🔒
  - **右上角**：`ContextualNudge` 悬浮气泡 "今天想探索哪个知识区域呢？"
  - **右侧面板**（x=1032, w=248）：`AICompanionWidget`（菌小园老师）+ `QuickFAQList`（快捷提问列表）+ `RecommendationList`（个性化推荐内容）
  - **底部**：`DailyTaskCard`（今日学习任务："学习 1 个知识点"）+ `MilestoneRewardTrack`（知识点收集宝箱进度）
- 点击节点 → 进入该模块的卡片浏览模式（翻转交互）

**验收标准**:
- 5 个模块节点按 S 型排列，已解锁的可点击，未解锁的灰色+🔒
- 点击 "膳食纤维广场" 节点 → 进入知识卡片浏览
- Header 知识树显示 🌳🌳🌳🌱（3 完成 + 1 进行中 + 1 未解锁）

**文件路径**: `web/src/pages/ClassroomPage.tsx`, `web/src/components/classroom/ModuleFlowPath.tsx`, `web/src/components/classroom/MapWaypoint.tsx`, `web/src/components/classroom/AICompanionWidget.tsx`, `web/src/components/classroom/QuickFAQList.tsx`, `web/src/components/classroom/RecommendationList.tsx`, `web/src/components/classroom/MilestoneRewardTrack.tsx`

**预估工时**: 2h

---

### T036 [P] [ART] 知识卡片翻转交互 + 双阅读层级

**规格**:
- `KnowledgeCard` 组件：
  - 正面（默认显示）：插画 `card_{module_code}.png` + 标题 + 一句话儿童摘要（≥18px）
  - 点击翻转 → CSS 3D `rotateY(180deg)` 翻转动画 600ms ease-in-out
  - 背面：详细知识点
    - 儿童简版（≥18px，占 55-60% 高度）：简短文字 + 大图标
    - 家长深版（14px，默认折叠）：展开按钮 `[📖 给家长的注释 +]`
  - 底部按钮（≥48px 触控尺寸）："试一试（问答）" + "问问 AI"
  - 使用 `DualText` 组件根据 `readingLevel` 切换默认展示内容
- 翻转逻辑：`useState` 管理 `isFlipped`，点击卡片触发翻转
- 翻转后底部 "再来一题" 翻回正面

**验收标准**:
- 点击卡片 → 600ms 3D 翻转动画 → 背面知识点显示
- 背面底部 "给家长的注释" 默认折叠，点击展开显示详细内容
- 阅读层级切换 → 默认显示内容变化

**文件路径**: `web/src/components/classroom/KnowledgeCard.tsx`

**预估工时**: 1.5h

---

### T037 [P] 3 种题型问答弹窗

**规格**:
- `QuizModal` 组件：
  - 进入条件：知识卡片底部点击 "试一试"
  - **单选题**（single_choice）：4 个选项大按钮，选中后绿色高亮 + ✅，错误红色高亮 + ❌ + 显示正确答案
  - **配对题**（pairing）：左右两列拖拽连线（@dnd-kit），全部配对正确通过
  - **排序题**（ordering）：竖向列表拖拽排序，顺序正确通过
  - 答对：星星粒子特效 + "答对了！+3XP" Toast
  - 答错：摇动动画 + "再想想哦～" 鼓励文案 + 正确答案提示（不扣分）
  - 底部 [下一题] 按钮
  - 全部题目完成 → "太厉害了！你已经是 ___ 小专家了！" 总结页

**验收标准**:
- 单选题选对 → 绿色高亮 + 星星特效 + +3XP → 2s 后自动下一题
- 单选题选错 → 红色高亮 + 显示正确答案 → 手动点击下一题
- 配对题全部匹配正确 → 通过
- 排序题顺序正确 → 通过

**文件路径**: `web/src/components/classroom/QuizModal.tsx`

**预估工时**: 2h

---

### T038 [API] AI 导览 — SSE 流式对话 + 7 条风格指南

**规格**:
- `POST /api/ai/chat`（SSE 流式）：
  - 接收 `{child_id, message, context?}`
  - 7 条风格指南注入 system prompt（`server/src/config/ai-style-guide.ts`）：
    1. 儿童友好语气：使用简单词汇、活泼语调
    2. 菌小园人格：我是肠道花园的小导游菌小园～
    3. 安全边界：不提供医疗建议、不询问隐私信息、不传播恐慌
    4. 科普准确性：基于科学知识，用比喻解释
    5. 简洁回答：≤80 字，一次一个知识点
    6. 正向引导：鼓励健康饮食和生活习惯
    7. 家长可见提示：回答末尾标注 📖 家长可查看详细解释
  - 调用 OpenAI/Claude API → SSE 逐字返回（`text/event-stream`）
  - 错误降级：AI API 不可用 → 切换到预设 FAQ 匹配 → 返回静态答案
- `GET /api/ai/faq`：返回预设 FAQ 列表（`server/src/config/faq-presets.json`）
  - 10 个常见问题：今天吃了什么会怎么样？/ 酸奶有好处吗？/ 为什么放屁会臭？/ ...

**验收标准**:
- 发送 "为什么吃蔬菜对肠道好？" → SSE 逐字返回回答（菌小园语气）
- AI API 不可用 → 自动匹配 FAQ "吃蔬菜有什么好处？" → 返回预设答案
- 回答包含正面鼓励

**文件路径**: `server/src/modules/ai/ai.routes.ts`, `server/src/config/ai-style-guide.ts`, `server/src/config/faq-presets.json`

**预估工时**: 1.5h

---

### T039 [P] [ART] AI 侧边栏 + 聊天弹窗

**规格**:
- `AISidebar` 组件（右侧常驻，x=1032, w=248）：
  - 顶部：🧸 菌小园待机 Lottie 动画（breathing loop，64×64px）
  - 对话气泡："今天想了解什么呢？"
  - **快捷提问列表**（首页/花园/课堂不同场景显示不同 FAQ 列表）：
    - 首页场景：今天吃了什么？/ 酸奶有好处吗？/ 为什么放屁会臭？
    - 花园场景：这个花园有多大？/ 怎么让花园更漂亮？/ 什么是肠道菌群？
    - 课堂场景：膳食纤维是什么？/ 短链脂肪酸有什么用？
  - **今日观察**：水分达标 ✅ / 纤维偏少 ⚠️ / 按时入睡 ✅
  - 底部 [和我聊天] 按钮 → 打开 `AIChatbot` 全屏聊天弹窗
- `AIChatbot` 组件：
  - 全屏/半屏聊天窗口（参照微信聊天界面风格）
  - 菌小园头像 + 对话气泡（圆角 16px，奶油米底色）
  - 用户消息右对齐（森林绿底色）
  - SSE 流式文本逐字渲染（打字机效果）
  - 输入框 + 发送按钮
  - 建议标签引导：3-4 个可点击的话题标签（如 "🍎 健康食物" "💤 好好睡觉"）
  - 对话历史滚动列表（最新消息自动滚到底部）

**验收标准**:
- AI 侧边栏常驻，首页/花园/课堂切换时快捷提问列表变化
- 点击 [和我聊天] → 打开聊天弹窗 → 发送消息 → SSE 流式返回，逐字显示
- 点击话题标签 → 自动填入输入框 "🍎 健康食物" → 发送

**文件路径**: `web/src/components/ai/AISidebar.tsx`, `web/src/components/ai/AIChatbot.tsx`, `web/src/components/ai/QuickQuestions.tsx`, `web/src/components/ai/DailyObservation.tsx`

**预估工时**: 2h

---

## Day 5: 徽章系统 + 花园 6 阶段成长（D5）

> **目标**: 徽章条件引擎运行，21 枚徽章 + 3 种边框系统，花园 6 阶段成长经验曲线，徽章页面陈列架 + 揭晓动画
> **交付物**: 徽章页（陈列架 + 成长路径）+ 花园阶段进度条 + 徽章揭晓弹窗

---

### T040 [API] 徽章条件引擎

**规格**:
- 实现事件驱动徽章条件引擎 `server/src/modules/badges/badge-engine.ts`：
  - 11 种条件类型检测：checkin_streak, checkin_total, feed_total, magnifier_use, quiz_correct, module_completed, stool_first, perfect_week, all_sub_items, birthday, holiday
  - 事件发生时 `evaluate(eventType, childId)` → 遍历所有 is_active 的 badge_defs → 解析 condition_rule JSON → 查询子项聚合数据 → 判断是否满足
  - **正向强化**：连续天数取 "历史最高" 而非 "当前"
  - 发放逻辑 `awardBadge(childId, badgeDefId, eventId)`：
    - event_id 防重（UNIQUE(event_id, badge_def_id)）
    - 已获铜 → 检查 silver_rule → 满足则升级为银
    - 已获银 → 检查 gold_rule → 满足则升级为金
    - 升级时保留低级记录
  - 发放后写入 `badge_awards` → 累积 `garden_xp`（铜 +20xp, 银 +50xp, 金 +100xp）→ 检查成长阶段升级
- 徽章检测钩子：在所有触发事件点调用 `evaluate()`——打卡完成、花园行为、问答正确、便便记录、模块完成

**验收标准**:
- 首次打卡 → 自动获得"初来乍到"徽章（badge_awards 新增 1 行）
- 累计打卡 7 天 → 获得"一周之星"铜徽章 + garden_xp +20
- 累计打卡 30 天 → "一周之星"升级为银 + garden_xp +50
- 同一事件重复触发 → event_id 防重，不会获得第二枚

**文件路径**: `server/src/modules/badges/badge-engine.ts`, `server/src/modules/badges/badge.service.ts`, `server/src/modules/badges/badge-hooks.ts`

**预估工时**: 2h

---

### T041 [API] 花园 6 阶段成长 + 经验值系统

**规格**:
- `server/src/modules/garden/garden-stage.service.ts`：
  - 6 阶段升级阈值：

| 阶段 | 名称 | 升级条件 |
| ---- | ---- | ---- |
| 1 | 种子 | 初始状态 |
| 2 | 幼苗 | 累计 3 天打卡 + 投喂 10 次 |
| 3 | 成长 | 累计 7 天打卡 + 投喂 30 次 + 获 3 枚徽章 |
| 4 | 丰收 | 累计 21 天打卡 + 投喂 100 次 + 获 6 枚徽章 |
| 5 | 大师 | 累计 50 天打卡 + 投喂 200 次 + 获 10 枚徽章 |
| 6 | 终极 | 累计 100 天打卡 + 投喂 500 次 |

  - 经验值累积规则（`server/src/config/xp-rules.json`）：
    - 打卡完成 +10xp / 投喂 +2xp / 问答正确 +3xp / 子项完成 +2xp
    - 徽章：铜 +20xp / 银 +50xp / 金 +100xp
  - `checkStageUpgrade(childId)`：达到下一阶段条件 → 升级 growth_stage → 解锁对应功能 → 推送通知
  - 阶段升级时触发 Lottie 动画 `fx_stage_up.json`

**验收标准**:
- 种子阶段 → 完成 3 天打卡 + 10 次投喂 → 自动升级为幼苗 → garden_states.growth_stage = 2
- 升级瞬间解锁对应功能（如阶段 3 解锁放大镜功能入口）
- 经验值曲线符合配置

**文件路径**: `server/src/modules/garden/garden-stage.service.ts`, `server/src/config/xp-rules.json`

**预估工时**: 1.5h

---

### T042 [API] 徽章 API

**规格**:
- `GET /api/badges/awarded?child_id=`：已获得徽章列表（含 rarity + 获得时间 + 升级进度）
- `GET /api/badges/pending?child_id=`：待获得徽章列表（含进度百分比 + 目标值）
- `GET /api/badges/defs`：徽章定义全量（21 枚徽章 + 3 种边框信息）

**验收标准**:
- 已获得 3 枚徽章 → `/badges/awarded` 返回 3 条
- 待获得徽章返回 `progress_percent` 如 71%（5/7 天）

**文件路径**: `server/src/modules/badges/badges.routes.ts`

**预估工时**: 0.5h

---

### T043 [P] [ART] 徽章页面 — 陈列架 + 两层分离渲染

**规格**:
- `BadgePage` 布局（参照 layout JSON badges 定义）：
  - **Header**：← 返回 + "🏆 成长徽章馆" + [徽章说明] 按钮 + 用户 + 设置/音效
  - **用户状态卡**：虚拟形象 + 等级 + XP 进度条 + 已获/总徽章数
  - **4 个分类陈列架**（`BadgeShelf` ×4，拟物化木质层架）：
    1. 🏷️ 坚持之星（persist）：6 枚 — 初来乍到/初露锋芒/一周之星/月度冠军/百日守护/全能小冠军
    2. 🏷️ 探索达人（explore）：5 枚 — 初次投喂/小小农夫/小小科学家/放大镜专家/花园医生
    3. 🏷️ 科普小学者（learn）：6 枚 — 好奇宝宝/答题小能手/便便观察员/持续观察/纤维专家/知识全能王
    4. 🏷️ 特殊成就（special）：4 枚 — 超级便便/完美一周/花园生日/春节彩蛋
  - 每个分类支持横向滑动（`overflow-x: auto` + snap）
- **两层分离渲染**（`BadgeItem` 组件）：
  - 21 个中央图标 PNG：`badge_{code}_icon.png`
  - 3 种通用边框 PNG：`ui_badge_frame_bronze.png` / `_silver.png` / `_gold.png`
  - CSS 叠加合成：`<div style="position:relative"> <img src={iconUrl}> <img src={frameUrl} style="position:absolute; inset:0"> </div>`
  - 未解锁：灰度 `filter: grayscale(1)` + 🔒 图标覆盖
  - 已获得：彩色 + 对应边框 + 稀有度光效（铜：暖铜光 / 银：冷银光 / 金：金光粒子）
- **右侧**（x=1032, w=248）：`AssistantDialog`（助手提示）+ `ProgressionTimeline`（成长路径时间轴 Lv.1→Lv.6）+ `UnlockTeaser`（解锁预告 "还差 2 枚徽章解锁新等级"）
- **底部**：`RecentHighlight` — 最近获得徽章 + NEW 角标 + 收集册进度 "18/60" + [分享我的徽章墙] 按钮

**验收标准**:
- 4 个分类陈列架显示，已获得徽章彩色 + 对应边框，未解锁灰度 + 🔒
- 徽章图标 + 边框叠加正确（图标居中在边框内）
- 横向滑动切换分类
- 点击已获得徽章 → 弹窗：获得日期 + 稀有度 + 升级进度

**文件路径**: `web/src/pages/BadgePage.tsx`, `web/src/components/badges/BadgeHeader.tsx`, `web/src/components/badges/UserStatusCard.tsx`, `web/src/components/badges/BadgeShelf.tsx`, `web/src/components/badges/BadgeItem.tsx`, `web/src/components/badges/ProgressionTimeline.tsx`, `web/src/components/badges/UnlockTeaser.tsx`, `web/src/components/badges/RecentHighlight.tsx`

**预估工时**: 2h

---

### T044 [P] [ART] GardenStageBar + BadgeRevealModal

**规格**:
- `GardenStageBar` 组件（首页 + 徽章页底部）：
  - 6 阶段横向进度条：种子🌱 → 幼苗🌿 → 成长🌻 → 丰收🍎 → 大师👑 → 终极🌟
  - 当前阶段高亮 + 下一阶段虚线边框
  - Framer Motion 进度条填充动画（从左到右，与 XP 进度对应）
  - "已成长 12 天，下一阶段：神秘菌屋 🎁" 文字提示
- `BadgeRevealModal` 组件：
  - 新徽章揭晓全屏动画
  - Lottie `fx_badge_reveal.json`（金色粒子爆发 + 徽章从中心弹出）
  - 徽章图标放大居中显示
  - 徽章名称 + 稀有度 + 获得条件文字
  - 3s 自动关闭 + 点击关闭
  - `prefers-reduced-motion` 时：静态显示徽章 + 金色文字

**验收标准**:
- GardenStageBar 显示 6 个阶段节点，当前阶段发光，进度条填充动画
- 获得新徽章 → BadgeRevealModal 弹出 → 金色粒子 + 徽章弹出动画 → 3s 后关闭

**文件路径**: `web/src/components/badges/GardenStageBar.tsx`, `web/src/components/badges/BadgeRevealModal.tsx`

**预估工时**: 1h

---

## Day 6: 首页 + 报告 + 设置 + 引导 + 我的主页（D6）

> **目标**: 首页完整布局（金刚区 + 角色 + AI 面板），成长报告 12 指标家长视图，4 步引导遮罩，设置页，我的主页
> **交付物**: 首页 + 报告页 + 设置页 + 引导遮罩 + 我的主页

---

### T045 [P] [ART] 首页完整布局

**规格**:
- `HomePage` 布局（参照 layout JSON home 定义）：
  - **Header**（标准 4 槽位）：Brand Logo（x=16, w=232）+ 欢迎语（x=264, w=752）+ 用户迷你卡（x=1032, w=90）+ 设置/音效（x=1134, w=130）
  - **左侧栏**（x=16, w=232, y=88）：
    - `TodayTasksCard`：📋 今日任务摘要（5 项任务 + 完成状态）
    - `StatusChips`：💧 水分充足 / 🦠 菌群活跃 / 🛡️ 屏障稳固
    - `DailyTipCard`：💡 "多吃纤维喂养好菌"
  - **视觉中心区**（x=264, w=752）：
    - `MascotAvatar`：🧸 菌小园 Lottie 角色（340×200）+ 对话气泡 "今天一起照顾小居民吧！"
    - `HeroCTA`：⭕ 今日肠道扫描 核心 CTA 按钮（260×170），点击弹出便便记录弹窗
    - `KingKongZone`（4 金刚按钮，x=264, y=500, w=178×4+12×3）：
      - 🌿 探索花园 → `/garden`
      - ✅ 每日打卡 → `/checkin`
      - 📚 知识课堂 → `/classroom`
      - 🏆 成长徽章 → `/badges`
  - **右侧面板**（x=1032, w=248）：`AISidebar`（同 Day 4 T039）
  - **底部**：`GrowthProgressBar`（6 阶段进度条 + 下一阶段预告）
- `GrowthProgressBar` 同 `GardenStageBar`（T044）

**验收标准**:
- 首页完整布局与 layout JSON 坐标一致
- 金刚区 4 按钮点击各跳转到对应路由
- Hero CTA 点击 → 弹出便便记录弹窗
- 左侧今日任务摘要实时反映 checkinStore 状态

**文件路径**: `web/src/pages/HomePage.tsx`, `web/src/components/home/BrandLogo.tsx`, `web/src/components/home/UserProfileCard.tsx`, `web/src/components/home/WelcomeGreeting.tsx`, `web/src/components/home/TodayTasksCard.tsx`, `web/src/components/home/StatusChips.tsx`, `web/src/components/home/DailyTipCard.tsx`, `web/src/components/home/MascotAvatar.tsx`, `web/src/components/home/HeroCTA.tsx`, `web/src/components/home/KingKongZone.tsx`, `web/src/components/home/GrowthProgressBar.tsx`

**预估工时**: 2h

---

### T046 [API] 成长报告 API

**规格**:
- `GET /api/report/weekly?child_id=&week=`（需 JWT）：返回周度 12 指标
- `GET /api/report/monthly?child_id=&month=`（需 JWT）：返回月度 12 指标
- 12 项指标：
  1. 打卡率（打卡天数/总天数）
  2. 最高连续打卡天数
  3. 当前成长阶段
  4. 累计徽章数（按稀有度分）
  5. 便便记录次数
  6. Bristol 类型分布（饼图数据）
  7. 投喂总次数
  8. 问答正确率
  9. 知识模块完成数/5
  10. 子项完成率
  11. 累计使用天数
  12. 花园状态分布（healthy/dry/high_sugar 占比）
- 无数据降级：返回 `data: null` + 前端显示 "暂无数据，快去探索花园吧～"
- 报告快照策略：每日凌晨 cron 聚合生成（读快照，不实时扫全表）

**验收标准**:
- 新用户查看报告 → 所有指标为 "暂无数据" + 引导文案
- 有 7 天数据 → 周度报告显示 12 项指标
- 月度报告中 Bristol 类型分布数据正确

**文件路径**: `server/src/modules/report/report.routes.ts`, `server/src/modules/report/report.service.ts`, `server/src/cron/report-generation.ts`

**预估工时**: 1.5h

---

### T047 [P] 成长报告页面（家长视图）

**规格**:
- `ReportPage` 布局（参照 layout JSON report 定义）：
  - **Header**：← 返回 + "成长报告" + 周期切换 [周报] [月报]（← → 箭头翻页）
  - **4 维度指标区**（`MetricSection` ×4）：
    1. 📊 打卡习惯：打卡率 + 累计天数 + 当前连续 + 最长连续
    2. 🎮 花园互动：投喂总次数 + 累计探索天数 + 当前阶段
    3. 🧠 科普学习：问答正确率 + 完成模块数 + 累计徽章数
    4. 💩 消化健康：Bristol 类型分布柱状图 + 饮食建议采纳率

  - 每个指标 `MetricCard`：图标 + 数值/百分比 + 单位 + 与上周期对比趋势（↑/↓/→）
  - 无数据时显示 "暂无数据" 引导插画 + "快去探索花园吧～"
  - 页面整体极低装饰密度（≤20%），纯色奶油米底色，聚焦数据

**验收标准**:
- 周期切换按钮 [周报] [月报] 点击切换数据
- 4 个维度 12 个指标卡片显示
- 有历史数据时显示对比趋势箭头
- 无数据时显示空状态插画 + 引导文字

**文件路径**: `web/src/pages/ReportPage.tsx`, `web/src/components/report/PeriodSwitcher.tsx`, `web/src/components/report/MetricSection.tsx`, `web/src/components/report/MetricCard.tsx`

**预估工时**: 1.5h

---

### T048 [P] 新用户引导 — 4 步遮罩

**规格**:
- `OnboardingOverlay` 组件（App 层，`position: fixed, z-index: 9999`）：
  - 首次访问触发条件：`localStorage` 中无 `gut_garden_onboardingComplete` 标记
  - 4 步引导，每步高亮对应 UI 区域（其余区域半透明深色遮罩）：
    1. "认识你的花园" → 高亮首页花园状态看板 → 指向左侧 StatusChips
    2. "逛逛知识花园" → 高亮底部 Dock 探索课堂 Tab
    3. "记录便便观察" → 高亮底部 Hero CTA 按钮
    4. "收集成长星星" → 高亮底部 Dock 成长徽章 Tab
  - 每步：居中文字气泡 + [下一步] 按钮 + [跳过] 按钮（右上角）
  - 完成的步骤显示小圆点指示器（4 个点）
  - 完成 / 跳过 → `localStorage` 写入 `gut_garden_onboardingComplete: true`
  - 动画：步骤切换淡入淡出 300ms
- `OnboardingSteps.tsx`：4 步文案 + 高亮区域坐标 + 回调

**验收标准**:
- 清除 localStorage → 刷新页面 → 引导遮罩第 1 步出现
- 点击 [下一步] ×4 → 引导完成 → 遮罩消失 → localStorage 有完成标记
- 点击 [跳过] → 直接关闭 → localStorage 有完成标记
- 刷新页面 → 不再出现引导（localStorage 标记存在）

**文件路径**: `web/src/components/onboarding/OnboardingOverlay.tsx`, `web/src/components/onboarding/OnboardingSteps.tsx`

**预估工时**: 1h

---

### T049 [P] 设置页面

**规格**:
- `SettingsPage`（参照 layout JSON settings 定义）：
  - **Header**：← 返回 + "设置"
  - **儿童档案编辑**（`ChildProfileEditor`）：
    - 头像上传（点击上传，预览裁剪）
    - 昵称输入框（≤30 字）
    - 年龄滑块（3-10，步长 1）
  - **每日使用时长限制**（`TimeLimitSlider`）：
    - 滑块 15min-120min（步长 15min），默认 30min
  - **隐私偏好**（`PrivacyPreferences`）：
    - 数据收集开关
    - 导出数据按钮（JSON 格式下载）
    - 删除账号按钮（二次确认弹窗）
  - **账号管理**：
    - 切换儿童（下拉选择 `children` 列表）
    - 退出登录按钮
  - 页面极低装饰密度（≤20%），纯 UI 功能页面

**验收标准**:
- 编辑昵称 → 保存 → GET `/api/children` 验证已更新
- 时长限制滑块拖动 → 数值实时更新
- 点击 [删除账号] → 弹出二次确认 → 确认后 parents 状态变为 disabled
- 点击 [退出登录] → 清除 token → 跳转首页游客模式

**文件路径**: `web/src/pages/SettingsPage.tsx`, `web/src/components/settings/ChildProfileEditor.tsx`, `web/src/components/settings/TimeLimitSlider.tsx`, `web/src/components/settings/PrivacyPreferences.tsx`

**预估工时**: 1h

---

### T050 [P] 我的主页

**规格**:
- `ProfilePage`（参照 layout JSON profile 定义）：
  - **Header**：← 返回 + "我的主页" + 用户 + 设置/音效
  - **左侧主区**（x=264, w=752）：
    - `AvatarEditor`：可编辑头像 + 昵称 + "Lv.4 肠道小园丁" + "加入于 2026-07-01，已照顾花园 30 天"
    - `AchievementStats` 成就展示：
      - 最长连续：15 天
      - 徽章收集：18/60
      - 知识探索：12 个知识点
      - 便便记录：25 次
      - 6 阶段：🌻 成长（第 3 阶段）
    - `HistoryTabs`：Tab 切换 [打卡记录] [便便记录] [学习记录] — 历史列表
  - **右侧面板**（x=1032, w=248）：
    - `WeeklyStats`：📊 本周统计（打卡 5/7 天 / 获得 3 枚新徽章 / 学习 8 个知识点）
    - `CurrentGoal`：🎯 当前目标 "达成「花朵使者」" + 进度条 7/10 天
    - `FriendsList`：👥 好友（V2 开放，MVP 显示 "即将上线" 占位）
  - 页面中密度装饰（≤70%），场景插画作为背景氛围

**验收标准**:
- 成就区 5 项统计数值与后端数据一致
- Tab 切换 [打卡记录]/[便便记录]/[学习记录] 显示对应历史列表
- 好友区显示 "即将上线" 占位
- 头像点击可编辑

**文件路径**: `web/src/pages/ProfilePage.tsx`, `web/src/components/profile/AvatarEditor.tsx`, `web/src/components/profile/AchievementStats.tsx`, `web/src/components/profile/WeeklyStats.tsx`, `web/src/components/profile/CurrentGoal.tsx`, `web/src/components/profile/HistoryTabs.tsx`

**预估工时**: 1.5h

---

## Day 7: 集成测试 + 优化 + 部署（D7）

> **目标**: E2E 流程可用，性能达标，边缘场景覆盖，Docker + Nginx 部署就绪
> **交付物**: 可部署的 MVP v1.0

---

### T051 端到端集成测试（游客 + 注册全流程）

**规格**:
- 测试脚本覆盖完整游客→注册流程（14 个步骤）：
  1. 打开网站 → 游客模式自动进入首页
  2. 浏览花园 → 3 层视差正常
  3. 拖拽食物投喂 3 次 → 花园状态变化
  4. 进入打卡页 → 探索花园已 auto_done
  5. 确认 健康饮食 → Toast "完成！"
  6. 确认 优质睡眠 → Toast "完成！"
  7. 确认 补充水分 → Toast "完成！"
  8. 确认 活力运动 → Toast "完成！"
  9. 全部完成 → 庆祝弹窗出现
  10. 选择便便图标 Type 4 → 记录成功
  11. 进入课堂 → 浏览模块 → 翻转卡片 → 答对 1 题
  12. 查看徽章页 → 已获得 "初来乍到" + "初次投喂"
  13. 注册账号 → 游客数据迁移成功
  14. 查看报告页 → 有数据展示
- 使用 Playwright 或 Cypress 编写自动化脚本

**验收标准**:
- 14 步流程全部通过，无 JS 报错
- 游客状态下所有基础功能可用
- 注册后迁移数据在数据库可见

**文件路径**: `web/e2e/full-flow.spec.ts`

**预估工时**: 1.5h

---

### T052 异常场景 + 边界场景测试

**规格**:
- **异常场景**（6 项）：
  1. 重复确认同一任务 → 按钮置灰 + Toast "已确认过啦～"
  2. 上传非便便图片 → 返回 is_valid=false
  3. 补签次数用完 → 返回 CHECKIN_002
  4. 连续天数中断 → 当前连续=1，最高记录保留
  5. 便便分析 API 超时 → 降级文案 + 手动重试
  6. 游客点击拍照功能 → 弹出注册引导
- **边界场景**（6 项）：
  1. 跨天零点边缘（23:59 开始 00:01 完成）
  2. 多孩切换数据隔离
  3. 无数据时查看报告 → "暂无数据" 引导
  4. 年龄边界 3 岁 / 10 岁
  5. 5 模块全部完成 → 获得"知识全能王"徽章
  6. localStorage 数据迁移冲突 → 无重复/丢失

**验收标准**:
- 12 项场景全部按预期行为执行
- 无未捕获的异常或空白页面

**文件路径**: `server/src/__tests__/edge-cases/`

**预估工时**: 1h

---

### T053 性能优化

**规格**:
- **前端性能**（6 项优化）：
  1. Lottie JSON 懒加载：首屏仅加载 idle，其他 `IntersectionObserver` 触发
  2. 场景 PNG 预加载：`<link rel="preload">` 3 张场景 WebP + 菌小园 idle Lottie（≤400KB）
  3. CSS `will-change: transform` + `translateZ(0)` GPU 合成层优化（仅视差图层）
  4. 音效 sprites 合并 + Howler.js 音效池
  5. 路由懒加载 `React.lazy()`：GardenPage / ClassroomPage / CheckinPage / BadgePage（非首屏页面）
  6. 徽章 PNG 按需加载（`requestIdleCallback`）
- **后端性能**（3 项）：
  1. 报告页读快照不实时扫全表
  2. 徽章检测异步执行（不阻塞用户操作）
  3. API 响应添加 gzip 压缩

**验收标准**:
- Lighthouse 性能评分 ≥ 80
- 花园场景帧率 ≥ 30fps（低端模式自动降级）
- API 响应 P95 < 500ms
- 首屏加载（LCP）< 2s

**文件路径**: `web/src/lib/assetLoader.ts`, `web/src/lib/performanceDetector.ts`

**预估工时**: 1.5h

---

### T054 低端降级 + 无障碍

**规格**:
- **性能降级**（`performanceDetector.ts`）：
  - 连续 3s FPS < 30 → `uiStore.fps = 'low'` → 触发：
    - 视差关闭（2 层静态图）
    - Lottie 替换为静态 PNG 终帧
    - tsParticles 粒子数量减半
    - 过渡动画时长减半
- **无障碍**（WCAG 2.1 AA）：
  - `prefers-reduced-motion` 媒体查询：禁用所有非必要动画（视差、Lottie、粒子、庆祝动画改为静态显示）
  - 颜色对比度 ≥ 4.5:1（文字/背景）
  - 可交互元素 `min-height: 48px`（触控标准）
  - 表单输入框关联 `<label>`
  - 键盘导航：Tab 顺序合理，焦点可见轮廓
  - 色盲模拟验证（红色盲/绿色盲不影响信息理解）

**验收标准**:
- FPS < 30 持续 3s → 自动降级 → 视差关闭
- 系统开启 `prefers-reduced-motion` → 所有动画停止 → 页面仍可正常使用
- Tab 键可遍历所有页面交互元素

**文件路径**: `web/src/lib/performanceDetector.ts`, `web/src/styles/animations.css`（`@media (prefers-reduced-motion)`）

**预估工时**: 1h

---

### T055 前端装饰密度梯度实现

**规格**:
- 实现 §3.4 中定义的 4 级装饰密度梯度：
  - **高密度**（80-90%，GardenPage）：全屏 3 层视差场景插画 + 毛玻璃 UI 面板
  - **中密度**（50-70%，HomePage / ClassroomPage / CheckinPage)：场景插画作为背景（`opacity: 0.3`），UI 卡片不透明
  - **低密度**（≤40%，BadgePage / ProfilePage）：奶油米纯色底色 + 四角微型装饰元素（藤蔓/叶片 SVG）
  - **极低密度**（≤20%，ReportPage / SettingsPage / LoginPage）：纯色底色，无场景装饰元素
- 页面切换时装饰密度渐变过渡（Framer Motion `animate={{ opacity }}` 300ms）
- 装饰元素实现：
  - 场景背景：`CSS background-image` + `background-size: cover`
  - 四角装饰：绝对定位的 SVG/PNG 小元素（40×40px）
  - 毛玻璃：`backdrop-filter: blur(12px)` + `background: rgba(255, 249, 239, 0.85)`

**验收标准**:
- 花园页 → 全屏场景背景 + 毛玻璃面板
- 徽章页 → 奶油米底色 + 四角藤蔓装饰
- 设置页 → 纯色底色，无任何装饰
- 页面切换时装饰层渐变过渡

**文件路径**: `web/src/hooks/useDecorationDensity.ts`, 各页面组件

**预估工时**: 1h

---

### T056 [P] Docker Compose + Nginx 部署配置

**规格**:
- `docker-compose.yml`（项目根目录）：
  - 4 个服务：`web`（nginx 静态文件 + 反向代理）、`server`（Fastify API）、`postgres`（PostgreSQL 16）、`redis`（可选）
  - web 服务：`nginx:alpine`，暴露 80 端口
  - server 服务：`node:20-alpine`，暴露 3001 端口（内网）
  - postgres 服务：`postgres:16-alpine`，暴露 5432 端口（内网），挂载 volume `pgdata`
- `nginx.conf`：
  - 静态资源 gzip 压缩（`gzip on`, `gzip_types text/css application/javascript image/svg+xml`）
  - API 代理 `/api/*` → `server:3001`（含 SSE 长连接支持 `proxy_buffering off`）
  - 静态文件 `/` → `/usr/share/nginx/html`
  - SPA fallback：所有非 API 路由返回 `index.html`
- `.env.production`：`DATABASE_URL`, `JWT_SECRET`, `AI_API_KEY`, `STOOL_API_KEY`
- 部署文档：环境变量清单 + `docker compose up -d` 启动步骤 + 健康检查 + 日志查看

**验收标准**:
- `docker compose up -d` → 4 个服务全部启动 → `curl http://localhost` 返回首页 HTML
- `curl http://localhost/api/health` 返回 `{"code":0,"data":"ok"}`
- Nginx gzip 对 JS/CSS 生效（响应头 `Content-Encoding: gzip`）

**文件路径**: `docker-compose.yml`, `nginx.conf`, `.env.production`, `docs/部署指南.md`

**预估工时**: 1h

---

### T057 全量联调 + BugFix

**规格**:
- 全量功能联调检查清单：
  - [ ] 游客浏览花园 + 投喂 + 打卡 + 便便图标 → 全部可用
  - [ ] 注册 → 数据迁移 → 后端数据可见
  - [ ] 拍照上传便便 → 分析 → 打卡联动
  - [ ] 课堂 → 模块 → 卡片翻转 → 问答
  - [ ] 徽章获得 → 陈列架显示 → 揭晓动画 → 阶段升级
  - [ ] 报告 → 周/月切换 → 12 指标
  - [ ] 设置 → 编辑档案 → 时长限制
  - [ ] 引导遮罩 → 4 步完成
  - [ ] AI 聊天 → SSE 流式 → FAQ 降级
  - [ ] 多页切换 → Header 四槽位统一 → 底部 Dock 常驻
- 修复所有联调中发现的 Bug

**验收标准**:
- 11 个检查项全部通过
- 所有页面切换无 JS 报错
- 登录/游客模式切换流畅

**预估工时**: 2h

---

## 美工任务清单（Sprint 交付）

> 详见 [美术素材清单与交付规范](./美术素材清单与交付规范.md) — 121 项资产

| Sprint | 截止 | 内容 | 数量 |
| ---- | ---- | ---- | ---- |
| S1 | D3 | 菌小园（1 PNG + 3 Lottie）+ 纤纤种子（1 PNG + 2 Lottie）+ 场景 4 层 PNG（3 张基础 + 3 张变体）+ 7 种便便图标 + 食物道具 7 张 | ~27 项 |
| S1 | D5 | 首页/打卡/课堂 UI 图标（47 个 SVG）+ 知识模块卡片 5 张 + 庆祝特效 3 Lottie + 速赢徽章 6 枚图标 | ~61 项 |
| S2 | D7 | 杂草坏菌（1+2）+ 丁丁泉灵（1+2）+ 香蕉小船（1+2）+ 剩余徽章 15 枚图标 + 3 种边框 + 科普动画 90s + 引导遮罩 UI | ~33 项 |
| **合计** | | | **121 项** |

**美工 GitHub 上传流程**：
1. 打开 `https://github.com/Zeadeinsung/gut-garden`
2. 进入 `web/public/assets/` 对应子目录
3. 点击 "Add file" → "Upload files" → 拖拽文件 → "Commit changes"
4. 开发者执行 `git pull` 同步素材

---

## 依赖关系图

```
Day 1 (脚手架) ─────────────────────────────────────────────────────┐
  T001-T012: 项目初始化 + DB + Types + Stores + UI库 + Dock         │
                                                                     ▼
Day 2 (花园 + 认证) ◄──────────────────────────────────── 前置依赖
  T013-T023: 登录 + 3层视差 + 角色 + 投喂 + 花园API
         │
         ├────────────────────────────────────────────┐
         ▼                                            ▼
Day 3 (打卡 + 便便)                           Day 4 (课堂 + AI)
  T024-T033: 5卡片 + 双模式 + 联动 + 日历        T034-T039: 5模块 + 翻转 + 问答 + SSE
         │                                            │
         └──────────────┬─────────────────────────────┘
                        ▼
              Day 5 (徽章 + 成长)
                T040-T044: 条件引擎 + 阶段系统 + 陈列架
                        │
                        ▼
              Day 6 (首页 + 报告 + 设置 + 引导 + 我的主页)
                T045-T050: 聚合所有模块
                        │
                        ▼
              Day 7 (测试 + 优化 + 部署)
                T051-T057: E2E + 性能 + 降级 + Docker
```

---

## 并行执行建议

### 工程师 + 美工 7 天并行表

```
工程师                                    美工
───────                                   ────
D1: T001-T012 (脚手架+DB+类型+Store)      角色概念设计 + 场景草图 + 便便图标7型
D2: T013-T023 (认证+花园场景+角色+投喂)   菌小园(1 PNG+3 Lottie) + 纤纤种子(1+2)
                                            + 场景4层基础PNG
D3: T024-T033 (打卡5卡片+便便双模式+联动)  食物道具7张 + 知识模块卡片5张
                                            + 庆祝特效3 Lottie
D4: T034-T039 (课堂+AI)                   UI图标47个SVG + 速赢徽章6枚图标
                                            + 场景变体3张
D5: T040-T044 (徽章引擎+阶段+陈列架)      杂草坏菌(1+2) + 丁丁泉灵(1+2)
                                            + 香蕉小船(1+2)
D6: T045-T050 (首页+报告+设置+引导+主页)   剩余徽章15枚图标 + 3种边框
                                            + 引导遮罩UI素材
D7: T051-T057 (测试+优化+部署)             素材精细调整 + 最终交付
```

---

## 任务统计

| Day | 任务数 | 可并行 | 预估总工时 |
| ---- | ---- | ---- | ---- |
| Day 1: 脚手架 | 12 | 10 | 10h |
| Day 2: 花园 + 认证 | 11 | 6 | 13h |
| Day 3: 打卡 + 便便 | 10 | 4 | 11.5h |
| Day 4: 课堂 + AI | 6 | 4 | 10.5h |
| Day 5: 徽章 + 成长 | 5 | 3 | 7h |
| Day 6: 首页 + 报告 + 其他页 | 6 | 5 | 8.5h |
| Day 7: 测试 + 优化 + 部署 | 7 | 2 | 9h |
| **合计** | **57** | **34** | **~69.5h** |

---

## MVP 范围确认

MVP 必须交付（对标 feature.json + PRD v2.0）：

- [x] 游客模式（localStorage 全基础功能）
- [x] 手机号登录 + 渐进注册 + 数据迁移
- [x] 底部 7-Tab Dock（3+1+3 对称 + Hero CTA）
- [x] 花园场景（3 层 CSS 视差 + Lottie 角色 + food @dnd-kit 拖拽投喂）
- [x] 5 主项每日打卡（探索花园(复合)/健康饮食/优质睡眠/补充水分/活力运动）
- [x] 便便记录双模式（图标选择默认 local-first + 拍照上传注册用户）
- [x] 便便报告→打卡联动（3 层：横幅/卡片文案/确认提醒）
- [x] 探索课堂（5 大知识模块 + S 型路径地图 + 卡片翻转 + 3 种题型问答）
- [x] 徽章体系（21 枚图标 + 3 种边框 CSS 叠加 + 6 阶段主线 + 4 类支线）
- [x] 花园 6 阶段成长（种子→幼苗→成长→丰收→大师→终极）
- [x] AI 导览（7 条风格指南 + SSE 流式 + FAQ 降级兜底）
- [x] 成长报告（周/月 + 12 指标，家长视图）
- [x] 新用户引导（4 步遮罩）
- [x] 我的主页（个人档案 + 成就 + 历史记录）
- [x] 设置页面（儿童档案 + 时长限制 + 隐私）
- [x] 装饰密度梯度（4 级：高/中/低/极低）
- [x] 4 级头部固定标准（返回/中心/用户/控制）
- [x] 双阅读层级（≥18px 儿童 / 14-15px 家长）

MVP 可延后：

- [ ] 风车蘑菇 / 云角马 / 虎宝角色
- [ ] 好友系统 / 社交功能
- [ ] Redis 缓存层
- [ ] WebSocket 实时推送
- [ ] Apple Health 数据同步
- [ ] 节庆限定徽章（春节彩蛋除外）
- [ ] WeChat 小程序 / 移动 App 端
- [ ] 3D 角色（Three.js）
