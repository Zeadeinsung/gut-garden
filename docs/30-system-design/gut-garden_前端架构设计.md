# 前端架构设计：肠道花园（Gut Garden）

> **版本**: v1.0
> **日期**: 2026-07-31
> **来源**: PRD v1.0 + 系统设计 v2.0 + 视觉审查报告 + 页面布局草图（各页面布局.txt）
> **技术栈**: React 19 + TypeScript + Vite + Tailwind v4 + Framer Motion + Zustand + @dnd-kit + Lottie
> **平台**: Phase 1 — Web 桌面端（平板兼容）

---

## §1 全局导航架构

### 1.1 底部 7-Tab Dock

采用"3+1+3"对称式底部导航栏，中央 Hero CTA 凸起打破水平边界。

```
┌─────────┬─────────┬─────────┬───────────────┬─────────┬─────────┬─────────┐
│   苗页   │ 探索花园 │ 每日打卡 │  🎯 拍便便分析  │ 探索课堂 │ 成长徽章 │ 我的主页 │
│  (首页)  │         │         │  (Hero CTA)   │         │         │  (新增)  │
└─────────┴─────────┴─────────┴───────────────┴─────────┴─────────┴─────────┘
                              ↑ 粉紫渐变色 + 相机 Icon
                              ↑ 弧形拱顶突破 TabBar 顶部切线
```

| 位置 | Tab | 路由 | 说明 |
|------|-----|------|------|
| 左1 | 苗页 | `/` | 首页 |
| 左2 | 探索花园 | `/garden` | 花园交互主场景 |
| 左3 | 每日打卡 | `/checkin` | 3 主项 + 子项 + 便便 |
| **中** | **拍便便分析** | — | **Hero CTA，唤起拍照/图标选择弹窗** |
| 右1 | 探索课堂 | `/classroom` | 5 大知识模块 |
| 右2 | 成长徽章 | `/badges` | 6 阶段主线 + 4 类支线 |
| 右3 | 我的主页 | `/profile` | 个人档案 + 成就 + 好友（新增） |

**交互规范**:
- 选中态：胶囊型高亮容器（Pill Container），主题色高亮
- 未选中态：低亮度暗色系图文
- 图标：上图下文，圆润拟物轻量化风格
- 触控最小尺寸：48×48px

---

## §2 逐页布局设计

### 2.1 首页（苗页 — `/`）

**布局**: 左-中-右-底四分栏

```
┌──────────────────────────────────────────────────────────┐
│ 左上: 品牌 Logo          欢迎语           右上: 设置⚙️ 音效🔊 │
│ 用户档案卡(头像+昵称+Lv)    "欢迎回来，小主人！👋"    (FAB)     │
├────────────┬──────────────────────────┬───────────────────┤
│ 左侧栏     │     视觉中心区            │  右侧 AI 面板      │
│            │                          │                   │
│ 📋 今日任务 │    🧸 菌小园 3D 角色      │  🤖 菌小园助手     │
│ · 探索花园  │    💬 "今天一起照顾       │  快捷提问:         │
│ · 吃好     │       小居民吧！"         │  · 今天吃了什么？   │
│ · 睡好     │                          │  · 酸奶有好处吗？   │
│            │    ⭕ 今日肠道扫描 ⭕       │  · 为什么放屁会臭？ │
│ 💧 水分充足 │    (核心 CTA 按钮)        │                   │
│ 🦠 菌群活跃 │    "推荐每日一次"         │  [和我聊天]       │
│ 🛡️ 屏障稳固 │                          │                   │
│            │                          │  📊 今日观察       │
│ 💡 今日贴士 │                          │  · ✅ 水分达标     │
│ "多吃纤维   │                          │  · ⚠️ 纤维偏少     │
│  喂养好菌"  │                          │  · ✅ 按时入睡     │
│            │                          │  → 查看完整报告    │
├────────────┴──────────────────────────┴───────────────────┤
│ 金刚区: [探索花园] [每日打卡] [知识课堂] [成长徽章]          │
├──────────────────────────────────────────────────────────┤
│ 底部进度条: 🌱 种子 → 🌿 幼苗 → 🌻 成长 → 🍎 丰收 → ...    │
│            已成长 12 天              下一阶段: 神秘菌屋 🎁   │
└──────────────────────────────────────────────────────────┘
```

**组件清单**:
| 区域 | 组件 | 说明 |
|------|------|------|
| 顶部 | `BrandLogo`, `UserProfileCard`, `WelcomeGreeting`, `GlobalControls` | 品牌 + 身份 + 设置入口 |
| 左侧 | `TodayTasksCard`, `StatusChips`, `DailyTipCard` | 今日任务摘要 + 状态 + 贴士 |
| 中心 | `MascotAvatar`, `HeroCTA` | 菌小园 + 肠道扫描主按钮 |
| 右侧 | `AISidebar`, `QuickQuestions`, `DailyObservation` | AI 对话面板常驻 |
| 中下 | `KingKongZone` | 4 金刚按钮跳转 |
| 底部 | `GrowthProgressBar` | 6 阶段进度 + 下一奖励预告 |

**关键交互**:
- Hero CTA 点击 → 弹出便便记录弹窗（默认图标选择 / 注册用户可选拍照）
- 金刚区按钮 → 各自页面路由
- AI 面板常驻，快捷问题一键发起对话

---

### 2.2 探索花园（`/garden`）

**布局**: 全屏 2.5D 等距画布 + 悬浮 HUD 面板

```
┌──────────────────────────────────────────────────────────┐
│ ← 返回  探索花园 / 我的肠道生态世界   [生态Lv.4] [繁荣度 85%] [居民×8] [连续12天] 🔔 │
├──────────┬────────────────────────────────┬──────────────┤
│ 左侧面板  │      中央 2.5D 交互画布         │  右侧面板     │
│          │                                │              │
│ 🌿 花园状态│   🏷️ 生命之树                  │  🧸 菌小园    │
│  ┌──────┐ │   Lv.3 花园的核心               │  💬 "花园     │
│  │  😊   │ │                                 │   状态良好！" │
│  │ 生态  │ │   🏷️ 菌居民之家                 │              │
│  │ 平衡  │ │   Lv.2 8位居民的家              │  📋 我观察到: │
│  │ 良好  │ │                                 │  · 水分充足   │
│  └──────┘ │   🏷️ 发酵实验室                 │  · 纤维充足   │
│  [查看详情]│   Lv.1 食物变身工坊              │  · 睡眠规律   │
│          │                                │              │
│ ⚡ 影响因素│   🏷️ 风车蘑菇田                  │  💡 今日建议  │
│  · 水分+10│   Lv.2 绒毛平原                 │  "多投喂纤维  │
│  · 纤维+15│                                │   食物吧～"   │
│  · 高糖-8 │   🏷️ 短链脂肪酸泉               │              │
│  [查看全部]│   金色泉水涌出                   │  [和我聊天]   │
│          │                                │              │
├──────────┴────────────────────────────────┴──────────────┤
│ 🌍 花园地图    [💧浇水] [🧹清理×3] [🌱种植] [🔬放大镜] [📸拍照] │
│ (FAB)           ↑ 快捷工具栏（红色角标提示待办）              │
├──────────────────────────────────────────────────────────┤
│                        📋 今日任务                         │
│  ☑ 探索花园 1/1   ☐ 吃好 0/1   ☐ 睡好 0/1     🎁 完成奖励   │
└──────────────────────────────────────────────────────────┘
```

**组件清单**:
| 区域 | 组件 | 说明 |
|------|------|------|
| 顶部 HUD | `GardenHUD` | 返回 + 标题 + 4 项核心指标（等级/繁荣度/居民数/连续天数） |
| 左侧 | `GardenStatusCard`, `ImpactFactorsList` | 生态状态 + 实时影响因素（正负增量） |
| 中央画布 | `IsometricCanvas`, `POITags` | 2.5D 插画地图 + 悬浮兴趣点标签（可点击进入子场景） |
| 右侧 | `AssistantPanel`, `ObservationList`, `TipCard` | AI 助手 + 观察洞察 + 建议 |
| 左下 FAB | `GardenMapButton` | 全局地图切换 |
| 底部工具栏 | `QuickActionToolbar` | 浇水/清理/种植/放大镜/拍照，角标提示待办 |
| 底部任务 | `TaskChecklist` | 3 项主任务 + 完成奖励 |

**关键交互**:
- 鼠标悬停 POI 标签 → 高亮 + 弹出简介
- 点击 POI 标签 → 进入子场景或弹窗
- 快捷工具栏按钮 → 触发花园状态变化 + 粒子特效
- 食物拖拽（@dnd-kit）→ 投入花园 → 角色反应 + 状态更新

**花园场景技术方案（3 层 CSS 视差）**:

| 图层 | translateZ | 速度系数 | 内容 |
|------|-----------|---------|------|
| Sky + Far | -200px | 0.15x | 天空渐变 + 远山（合并原 4 层） |
| Mid | 0px | 0.5x | 花园主体 + Lottie 角色 + 建筑 + 溪流 |
| Front | 150px | 0.8x | 前排花草/栅栏，风车 CSS 旋转 |

- 最大位移：视口宽度 5%（儿童防晕动）
- 低端降级：FPS < 30 → 2 层静态图 + 角色静态 PNG 替代 Lottie

---

### 2.3 探索课堂（`/classroom`）

**布局**: S 型等距地图画布 + 右侧伴学面板

```
┌──────────────────────────────────────────────────────────┐
│ 👤 小明 Lv.3 知识探索者    🪵 探索课堂 / 探索肠道生命的秘密   知识树 🌳🌳🌳🌱  已探索12个 │
├──────────────────────────────────┬───────────────────────┤
│                                  │  🤖 菌小园老师         │
│   🗺️ S 型探索路径地图             │  💬 "今天想探索哪个    │
│                                  │      知识区域呢？"     │
│   ① 膳食纤维广场  ─────────→ ② 发酵工坊                   │
│   🏛️ [⭐⭐⭐ 3/6]      🏭 [⭐⭐ 2/6]     │  📚 快捷 FAQ         │
│         │                        │  · 食物的秘密  →      │
│         │  (小溪蜿蜒连接)          │  · 健康好习惯  →      │
│         ▼                        │  · 身体小信号  →      │
│   ③ 短链脂肪酸泉 ←────── ④ 肠道屏障城墙                   │
│   ⛲ [⭐ 1/6]          🧱 [⭐⭐⭐ 3/6]     │                       │
│         │                        │  [🎲 随机探索]        │
│         ▼                        │                       │
│   ⑤ 生态平衡观测站                │  📰 推荐内容           │
│   🔭 [未解锁]                    │  · 纤维食物清单  +10  │
│                                  │  · 肠道冷知识    +5   │
│                                  │  [换一换]             │
├──────────────────────────────────┴───────────────────────┤
│ 🎯 今日任务: 学习1个知识点    │ 里程碑宝箱: ①✅ ②✅ ③✅ ④🔓 ⑤🔒 ⑥🔒 │
│ [查看任务]                   │  已收集 12 知识点          │
└──────────────────────────────────────────────────────────┘
```

**组件清单**:
| 区域 | 组件 | 说明 |
|------|------|------|
| 顶部 | `UserProfileWidget`, `PageTitleBanner`, `KnowledgeTreeProgress` | 身份 + 挂牌标题 + 知识树可视化 |
| 中央地图 | `ModuleFlowPath` | S 型路径 + 5 个知识模块节点（建筑/场景） |
| 节点 | `MapWaypoint` | 模块名称 + 星级收集度（如 3/6）+ 点击进入 |
| 顶部引导 | `ContextualNudge` | 悬浮气泡提示 "今天想探索哪个知识区域呢？" |
| 右侧 | `AICompanionWidget`, `QuickFAQList`, `RecommendationList` | 伴学助手 + 快捷提问 + 个性化推荐 |
| 底部 | `DailyTaskCard`, `MilestoneRewardTrack` | 今日学习任务 + 知识点收集宝箱 |

**知识卡片交互**（进入模块后）:
- 正面：插画 + 标题 + 一句话摘要
- 翻转：详细解释（双阅读层级：儿童简版 + 家长深版）
- 底部按钮："加入今日打卡" / "问问AI"

**问答弹窗**（3 种题型）:
- 知识巩固：单选 4 选项
- 生活场景：情境判断
- 行为引导：正向行为强化

---

### 2.4 每日打卡（`/checkin`）

**布局**: 左侧任务清单 + 右侧日历/奖励

```
┌──────────────────────────────────────────────────────────┐
│ ← 返回  每日打卡  [生态Lv.4]   今日花园能量: ████████░░ 85/100   🏞️ 花园预览 → │
├────────────────────────────────────┬──────────────────────┤
│                                    │  🧸 菌小园            │
│  📋 今日照顾清单                    │  💬 "今天也要好好      │
│  ┌──────────┬──────────┐           │      照顾花园哦！"    │
│  │  探索花园  │   吃好    │           │                      │
│  │  角色插画  │  角色插画  │           │  💡 今日小建议         │
│  │  ✅ 已自动 │ [去确认]  │           │  "记得多喝水～"       │
│  │  能量 +10 │  点击确认  │           │                      │
│  ├──────────┼──────────┤           │  📚 今日小知识         │
│  │   睡好    │          │           │  "膳食纤维是肠道       │
│  │  角色插画  │          │           │   居民的食物"         │
│  │ [去确认]  │          │           │  [去知识课堂看看]      │
│  │  能量 +10 │          │           │                      │
│  └──────────┴──────────┘           │  🔗 快捷入口           │
│                                    │  [知识课堂] [成长徽章]  │
├────────────────────────────────────┴──────────────────────┤
│  📅 打卡日历 (月视图)            │  🎁 今日奖励               │
│  日 一 二 三 四 五 六            │  💧+5  🍃+10  ⭐+5  ☀️+10 │
│  ·  ·  ✅  ✅  ✅  ·  ·            │                          │
│  连续打卡 12 天  │  🎁 再坚持2天解锁奖励                       │
└──────────────────────────────────────────────────────────┘
```

**核心交互流程**:

```
页面加载 → 显示 3 张任务卡片
              │
              ├── 探索花园: 系统自动检测 (≥3次花园交互) → 自动完成 ✅
              │
              ├── 吃好: 点击 [去确认] → 弹出子项选择面板
              │         ┌─────────────────────────┐
              │         │ ✅ 今天吃好了吗？         │
              │         │                          │
              │         │ 可选加分:                 │
              │         │ □ 🥗 吃了蔬菜    +15     │
              │         │ □ 🍎 吃了水果    +10     │
              │         │ □ 💧 喝了足够水   +10     │
              │         │                          │
              │         │  [确认完成]  [稍后再说]    │
              │         └─────────────────────────┘
              │
              └── 睡好: 点击 [去确认] → 弹出子项选择面板
                        ┌─────────────────────────┐
                        │ ✅ 今天睡好了吗？         │
                        │                          │
                        │ 可选加分:                 │
                        │ □ 🏃 户外活动≥30分钟 +10 │
                        │ □ 🌙 合理时间入睡   +10  │
                        │                          │
                        │  [确认完成]  [稍后再说]    │
                        └─────────────────────────┘

全部完成 → 🎉 庆祝动画 + 奖励弹出 + 徽章检测
```

**组件清单**:
| 区域 | 组件 | 说明 |
|------|------|------|
| 顶部 | `CheckinHeader`, `EnergyProgressBar`, `GardenPreview` | 标题 + 今日能量 + 花园快捷入口 |
| 左侧主区 | `TaskCardList` | 3 张任务卡片，自适应拉伸 |
| 任务卡片 | `TaskCard` | 角色插画 + 状态按钮 + 奖励值 |
| 子项弹窗 | `SubItemPicker` | 吃好/睡好确认后弹出，可选勾选加分 |
| 右侧 | `AssistantCard`, `TipCard`, `KnowledgeCard`, `QuickLinks` | 助手 + 建议 + 知识 + 快捷入口 |
| 左下 | `CheckinCalendar` | 月视图 + 连续天数 + 奖励预告 |
| 右下 | `TodayRewards` | 4 个资源掉落物图标 + 数值 |

**打卡日历**:
- 月视图网格，已打卡日期绿色圆点 + 花园小图标
- 今日高亮边框
- 点击历史日期查看当日详情
- 补签入口（≤3 次/月）

**便便记录弹窗**（Hero CTA 触发）:
```
┌─────────────────────────────────────┐
│  📸 今日便便观察                      │
│                                      │
│  默认模式：选择便便图标                │
│  🐰 兔子便便  🍇 葡萄串  🍌 香蕉宝宝  │
│  🍦 软冰淇淋  💧 水水                 │
│                                      │
│  ── 或 ──                            │
│                                      │
│  高级模式：拍照分析 (需注册)            │
│  [📷 上传便便照片]                    │
│                                      │
│  数据仅存本地 · 不构成医疗建议          │
└─────────────────────────────────────┘
```

---

### 2.5 成长徽章（`/badges`）

**布局**: 拟物化木质陈列架 + 右侧辅助组件

```
┌──────────────────────────────────────────────────────────┐
│ ← 返回  🏆 成长徽章馆 / 每一枚徽章，都是你照顾花园的证明    [徽章说明] │
├──────────────────────────────────────────────────────────┤
│  👤 用户状态卡                           │  右侧组件        │
│  🧸 Lv.4 肠道小园丁                      │                 │
│  ████████████░░░ 720/1000  距升级差280    │  🧸 助手提示     │
│  已获得 18/60 枚  [徽章总览]              │  "再收集2枚      │
├──────────────────────────────────────────┤   解锁新等级！"  │
│                                          │                 │
│  🏷️ 1 健康习惯徽章                        │  📈 成长路径     │
│  ┌──────────────────────────────────┐    │  Lv.1 ✅        │
│  │ 🥉 水滴守护者  🥈 纤维之友  🥉 晨光鸟  →│  │  Lv.2 ✅        │
│  │ 连续喝水7天    吃蔬菜14天   早睡7天    │  │  Lv.3 ✅        │
│  │ [已获得]      [已获得]    [已获得]   │  │  Lv.4 ● 当前   │
│  └──────────────────────────────────┘    │  Lv.5 🔒        │
│                                          │                 │
│  🏷️ 2 探索达人徽章                        │  🎁 解锁预告     │
│  ┌──────────────────────────────────┐    │  ┌──────────┐  │
│  │ 🥇 花园农夫  🥉 放大镜专家  🔒 ？  →│  │  │    ？    │  │
│  │ 投喂100次    观察20次    未解锁     │  │  │  神秘徽章 │  │
│  │ [已获得]      [已获得]    [未解锁]  │  │  └──────────┘  │
│  └──────────────────────────────────┘    │  还差 2 枚徽章  │
│                                          │  [去探索]      │
│  ... (4 个分类依次排列，支持横向滑动)       │                 │
├──────────────────────────────────────────┴─────────────────┤
│  📌 最近获得: 🥇 花园农夫 NEW!  累计投喂100次 +50XP 2026-07-31 │
│  📖 收集册 18/60                          [分享我的徽章墙]    │
└──────────────────────────────────────────────────────────┘
```

**组件清单**:
| 区域 | 组件 | 说明 |
|------|------|------|
| 顶部 | `BadgeHeader`, `BadgeInfoButton` | 标题 + 徽章说明入口 |
| 用户卡 | `UserStatusCard` | 虚拟形象 + 等级 + 进度条 + 徽章统计 |
| 主内容 | `BadgeShelf` ×4 | 4 个分类木质层架，横向滑动 |
| 徽章项 | `BadgeItem` | 铜/银/金视觉 + 状态标签（已获得/未解锁）+ 锁定态灰度 |
| 分类标签 | `CategoryTab` | 药丸形标签 + 序号 |
| 右侧 | `AssistantDialog`, `ProgressionTimeline`, `UnlockTeaser` | 助手 + 成长路径时间轴 + 解锁预告 |
| 底部 | `RecentHighlight` | 最近获得徽章 + NEW 角标 + 收集册进度 + 分享按钮 |

**徽章状态视觉**:
- 已获得：彩色 + 铜/银/金边框 + 对应光效
- 未解锁：灰度 + 🔒 图标 + 解锁条件提示
- 点击已获得徽章 → 弹窗：获得日期 + 当前稀有度 + 升级进度

---

### 2.6 我的主页（`/profile` — 新增）

**布局**: 个人档案 + 成就展示 + 好友互动

```
┌──────────────────────────────────────────────────────────┐
│ ← 返回  我的主页                                          │
├────────────────────────────────────┬──────────────────────┤
│                                    │                      │
│  🧸 头像 (可编辑)                   │  📊 本周统计          │
│  小明  Lv.4 肠道小园丁              │  · 打卡 5/7 天       │
│  加入于 2026-07-01  已照顾花园 30 天 │  · 获得 3 枚新徽章    │
│                                    │  · 学习 8 个知识点    │
│  ─────────────────────────────     │                      │
│  🏆 成就展示                        │  🎯 当前目标          │
│  ┌──────────────────────────┐      │  达成「花朵使者」     │
│  │ 最长连续: 15天            │      │  ████████░░ 7/10天   │
│  │ 徽章收集: 18/60          │      │                      │
│  │ 知识探索: 12个知识点       │      │  👥 好友              │
│  │ 便便记录: 25次            │      │  (V2 开放)            │
│  │ 6阶段: 🌻 成长(第3阶段)    │      │                      │
│  └──────────────────────────┘      │                      │
│                                    │                      │
│  📋 历史记录                        │                      │
│  · 打卡记录  · 便便记录  · 学习记录  │                      │
│                                    │                      │
└────────────────────────────────────┴──────────────────────┘
```

**组件清单**:
| 区域 | 组件 | 说明 |
|------|------|------|
| 头像区 | `AvatarEditor` | 可编辑头像 + 昵称 + 等级 + 加入日期 |
| 成就区 | `AchievementStats` | 最长连续 / 徽章收集 / 知识探索 / 便便记录 / 当前阶段 |
| 统计区 | `WeeklyStats` | 本周打卡 / 徽章 / 学习概览 |
| 目标区 | `CurrentGoal` | 阶段目标进度条 |
| 好友区 | `FriendsList` | V2 开放，MVP 显示占位 |
| 历史区 | `HistoryTabs` | 打卡/便便/学习 历史记录列表 |

---

### 2.7 其他页面

#### 成长报告（`/report` — 需注册）

```
┌──────────────────────────────────────────────────────────┐
│ 周期切换: [周报] [月报]  ← →                             │
├──────────────────────────────────────────────────────────┤
│  📊 打卡坚持        │  🎮 花园互动        │  🧠 科普学习    │
│  累计 30天          │  累计投喂 120次      │  答对 15题      │
│  当前连续 12天      │  累计探索 30天       │  完成 3模块     │
│  最长连续 15天      │                    │  徽章 8枚       │
├────────────────────┼────────────────────┼────────────────┤
│  💩 消化健康                            │  🌱 总体成长     │
│  Type 1-2: 3次  Type 3-5: 18次  Type 6-7: 4次           │
│  饮食建议采纳率: 65%                     │  🌻 第3阶段     │
│                                         │  徽章 18/60     │
└──────────────────────────────────────────────────────────┘
```

#### 设置（`/settings` — 需注册）

- 儿童档案编辑（昵称/年龄/头像）
- 每日使用时长限制（滑块）
- 隐私偏好
- 数据导出/删除
- 账号管理

#### 新用户引导（首次访问触发）

4 步遮罩引导，30 秒内完成：
1. "认识你的花园" → 指向首页花园状态看板
2. "逛逛知识花园" → 指向探索课堂
3. "记录便便观察" → 指向便便记录
4. "收集成长星星" → 指向成长徽章

---

## §3 设计系统

### 3.1 色彩体系

| 角色 | 色值 | 用途 |
|------|------|------|
| 主色 — 森林绿 | `#4E6A3E` | 头部、按钮、植被元素 |
| 背景 — 奶油米 | `#FFF9EF` | 大面积底色 |
| 点缀 — 珊瑚粉 | `#F38D83` | 徽章、按钮强调、庆祝元素 |
| Hero CTA | 粉紫渐变 | 导航栏中央凸起按钮 |
| 选中态 | 主题紫色 | 胶囊高亮容器 |

**Tailwind v4 @theme**:
```css
@import "tailwindcss";
@theme {
  --color-garden-forest: #4E6A3E;
  --color-garden-cream: #FFF9EF;
  --color-garden-coral: #F38D83;
  --color-garden-hero: #B06AB3;    /* Hero CTA 紫色 */
  --font-size-child-base: 18px;
  --font-size-parent-base: 14px;
  --spacing-touch-target: 48px;
}
```

### 3.4 装饰密度梯度

不同页面类型采用不同的装饰密度，确保用户在不同模式间切换时有清晰的视觉节奏变化。

| 密度等级 | 填充度 | 适用页面 | 背景规范 | 说明 |
|---------|--------|---------|---------|------|
| 高密度（沉浸式） | 80-90% | 探索花园 `/garden` | 2.5D 花园场景插画全屏覆盖 | 视觉重心在中央画布，UI 面板用毛玻璃半透明覆盖 |
| 中密度（引导式） | 50-70% | 首页 `/`、探索课堂 `/classroom`、每日打卡 `/checkin` | 场景插画作为背景，UI 卡片占主导 | 花园元素作为环境氛围，主交互区为不透明卡片 |
| 低密度（系统式） | ≤ 40% | 成长徽章 `/badges`、我的主页 `/profile` | 奶油米 #FFF9EF 纯色底色 + 少量角落装饰 | 接近标准 Web 应用，聚焦数据展示与列表操作 |
| 极低密度（工具式） | ≤ 20% | 成长报告 `/report`、设置 `/settings`、登录 `/login` | 纯色底色，无场景装饰 | 扁平 UI，信息密度高，操作效率优先 |

**实现方式**：
- 高/中密度页面：背景层使用 CSS `background-image` + `opacity` 控制场景插画可见度
- 低/极低密度页面：背景设为 `bg-garden-cream`，仅保留页面四角微型装饰元素（如藤蔓、叶片）
- 页面切换时装饰密度渐变过渡（Framer Motion `animate={{ opacity }}` 300ms）

### 3.2 字体层级

| 层级 | 字号 | 行高 | 字体 | 适用 |
|------|------|------|------|------|
| 儿童标题 | ≥ 24px | 1.6x | ZCOOL KuaiLe / Comic Neue | 页面主标题 |
| 儿童正文 | ≥ 18px | 1.6x | ZCOOL KuaiLe / Comic Neue | 知识卡片、任务文案 |
| 家长正文 | 14-15px | 1.4x | Noto Serif SC | 科学注释、报告 |
| 家长小字 | 12px | 1.3x | Noto Serif SC | 免责声明、辅助信息 |

### 3.3 双阅读层级

```
┌─────────────────────────────────────────┐
│  标题（儿童层）                           │
│  🌟 膳食纤维是什么？                      │
│  「纤维是肠道花园里小菌菌的食物！」        │
│  ┌───────────────────────────────────┐   │
│  │         主插画 / 动画              │   │
│  │         (占画面 55-60%)            │   │
│  └───────────────────────────────────┘   │
│  [试一试] [下一步] ← 大按钮（≥48px）      │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│  📖 给家长的注释 [+ 展开]                │
│  (默认折叠，字体更小，色值更浅)            │
└─────────────────────────────────────────┘
```

- `ReadingLevelProvider` + `DualText` 组件实现
- 切换入口：Header 角落半透明 📖 图标（20×20px），儿童不易发现

---

## §4 路由架构

| Route | Page | Guest | Lazy Load | 说明 |
|-------|------|-------|-----------|------|
| `/` | HomePage | ✅ | — | 首页（金刚区 + AI 边栏） |
| `/garden` | GardenPage | ✅ | ✅ | 探索花园 |
| `/classroom` | ClassroomPage | ✅ | ✅ | 探索课堂 |
| `/checkin` | CheckinPage | ✅ | ✅ | 每日打卡 |
| `/badges` | BadgePage | ✅ | ✅ | 成长徽章 |
| `/profile` | ProfilePage | ✅ | ✅ | 我的主页（新增） |
| `/report` | ReportPage | ❌ | ✅ | 成长报告（需注册） |
| `/settings` | SettingsPage | ❌ | ✅ | 设置（需注册） |
| `/login` | LoginPage | ✅ | ✅ | 手机号验证码登录 |
| `/onboarding` | OnboardingPage | ✅ | ✅ | 4 步引导遮罩 |

- **路由守卫**: `<ProtectedRoute>` 包裹 `/report` `/settings`（检查 `authStore.isGuest`）
- **Onboarding**: App 层 `position:fixed z-index:9999`，首次访问自动触发

---

## §5 组件树

```
App
├── OnboardingOverlay (4步引导，首次触发)
├── AuthProvider + ReadingLevelProvider
├── BottomDock (7-Tab 底部导航，全页面常驻)
│   ├── DockTab ×6 (左3 + 右3)
│   └── HeroCTAButton (中央凸起 — 便便记录)
├── Routes
│   └── Layout
│       ├── Header (设置 + 音效 + 阅读层级切换)
│       └── Outlet
│           ├── HomePage
│           │   ├── BrandLogo + UserProfileCard + WelcomeGreeting
│           │   ├── TodayTasksCard + StatusChips + DailyTipCard
│           │   ├── MascotAvatar + HeroCTA
│           │   ├── AISidebar (QuickQuestions + DailyObservation)
│           │   ├── KingKongZone (4金刚按钮)
│           │   └── GrowthProgressBar (6阶段进度条)
│           ├── GardenPage
│           │   ├── GardenHUD (返回 + 4核心指标)
│           │   ├── GardenStatusCard + ImpactFactorsList
│           │   ├── IsometricCanvas (3层CSS视差)
│           │   │   ├── ParallaxLayer-SkyFar (translateZ: -200px)
│           │   │   ├── ParallaxLayer-Mid (translateZ: 0, Lottie角色)
│           │   │   └── ParallaxLayer-Front (translateZ: 150px)
│           │   ├── POITags (悬浮兴趣点标签)
│           │   ├── AssistantPanel + ObservationList + TipCard
│           │   ├── GardenMapButton (FAB)
│           │   ├── QuickActionToolbar (浇水/清理/种植/放大镜/拍照)
│           │   └── TaskChecklist (3主项 + 奖励)
│           ├── ClassroomPage
│           │   ├── UserProfileWidget + PageTitleBanner + KnowledgeTree
│           │   ├── ModuleFlowPath (S型路径)
│           │   │   └── MapWaypoint ×5 (模块节点 + 星级收集度)
│           │   ├── AICompanionWidget + QuickFAQList + RecommendationList
│           │   ├── KnowledgeCard (翻转交互，双阅读层级)
│           │   ├── QuizModal (3题型：单选/场景/行为)
│           │   ├── DailyTaskCard
│           │   └── MilestoneRewardTrack (宝箱进度)
│           ├── CheckinPage
│           │   ├── CheckinHeader + EnergyProgressBar + GardenPreview
│           │   ├── TaskCardList
│           │   │   └── TaskCard ×3 (探索花园/吃好/睡好)
│           │   ├── SubItemPicker (吃好子项/睡好子项)
│           │   ├── AssistantCard + TipCard + KnowledgeCard + QuickLinks
│           │   ├── CheckinCalendar (月视图 + 补签)
│           │   ├── TodayRewards
│           │   └── CelebrationModal (打卡完成庆祝)
│           ├── BadgePage
│           │   ├── BadgeHeader + BadgeInfoButton
│           │   ├── UserStatusCard (等级 + 进度条 + 徽章统计)
│           │   ├── BadgeShelf ×4 (分类木质层架，横向滑动)
│           │   │   └── BadgeItem (铜/银/金 + 锁定态灰度)
│           │   ├── AssistantDialog + ProgressionTimeline + UnlockTeaser
│           │   ├── RecentHighlight (最近获得 + NEW角标)
│           │   └── BadgeRevealModal (新徽章揭晓动画)
│           ├── ProfilePage
│           │   ├── AvatarEditor + AchievementStats
│           │   ├── WeeklyStats + CurrentGoal
│           │   ├── FriendsList (V2占位)
│           │   └── HistoryTabs
│           ├── ReportPage
│           │   ├── PeriodSwitcher
│           │   └── MetricSection ×4 + MetricCard ×12
│           └── SettingsPage
│               ├── ChildProfileEditor
│               ├── TimeLimitSlider
│               └── PrivacyPreferences
└── StoolRecordModal (全局弹窗：图标选择 / 拍照上传)
```

---

## §6 状态管理（Zustand Stores）

| Store | Key State | Persist (游客) |
|-------|-----------|----------------|
| `authStore` | user, token, isGuest, guestId | token only |
| `gardenStore` | currentState, moistureLevel, growthStage(1-6), xp, interactionCount | Full |
| `checkinStore` | today(tasks+subItems+poopMode), streak, longestStreak, calendar | today, streak |
| `badgeStore` | awarded[], pending[], currentStage | awarded[], currentStage |
| `classroomStore` | modules[5], quizHistory | Full |
| `uiStore` | onboardingComplete, sidebarOpen, fps, deviceTier, readingLevel, activeModal | onboardingComplete only |

**游客模式**: Component 层统一读写 Zustand。Store 内部 `isGuest ? localStorage : API`，组件无需分支。

---

## §7 动画体系

| Tier | 技术 | 触发 | 约束 |
|------|------|------|------|
| Ambient（环境） | CSS `@keyframes` | 常驻 | `prefers-reduced-motion` 时暂停 |
| Interactive（交互） | Framer Motion | 用户操作 | stiffness ≤ 100, damping ≥ 20 |
| Celebratory（庆祝） | Lottie | 事件触发 | 单次 ≤ 2s，降级显示静态终帧 |

**动画规范**:
- 入场：淡入 + 小幅上移，800-1000ms ease-out
- 翻转：CSS 3D flip，600ms ease-in-out
- 徽章获得：缩放 1→1.15→1（三次呼吸），配合金色粒子
- 按钮悬停：scale 1.05 + box-shadow 增强
- 可交互元素：微呼吸动画（上下浮动 0.8-1.2s cycle）+ 2px 半透明发光边缘
- **禁止**：旋转、抖动、频闪（WCAG 2.3.1）

---

## §8 资产加载策略

| Tier | 内容 | 触发时机 | 预算 |
|------|------|---------|------|
| Critical | 3 张场景 WebP + 菌小园 idle Lottie | `<link rel="preload">` | ≤ 400KB |
| Above-fold | UI 图标 + 食物 PNG + 徽章分类图标 | Critical 完成后 | ≤ 200KB |
| Deferred | 徽章全量 PNG + 非 idle Lottie + 科普视频 | `requestIdleCallback` | 无硬上限 |

加载中显示 CSS-only 动画："花园正在生长中..."

---

## §9 目录结构（新建）

```
web/src/
  main.tsx                        # React 19 createRoot
  index.css                       # Tailwind v4 @theme tokens
  styles/
    animations.css                # 全局动画
    garden-animations.css         # 花园场景动画
  providers/
    AuthProvider.tsx              # JWT + 游客上下文
    GuestDataProvider.tsx         # localStorage 读写封装
    ReadingLevelProvider.tsx      # 儿童/家长双层级
  lib/
    localStorage.ts               # 游客数据工具
    assetLoader.ts                # 分级加载
    performanceDetector.ts        # FPS 监控 + 降级
  stores/
    authStore.ts
    gardenStore.ts
    checkinStore.ts
    badgeStore.ts
    classroomStore.ts
    uiStore.ts
  hooks/
    useParallax.ts
    useGardenScene.ts
    useCharacterState.ts
    useFeedAnimation.ts
    useFeedLogic.ts
    useStreak.ts
    useDualReading.ts
  components/
    ui/                           # Button, Modal, Toast, ProgressBar, Spinner, DualText
    navigation/
      BottomDock.tsx              # 7-Tab 底部导航栏
      HeroCTAButton.tsx           # 中央凸起按钮
    home/
      BrandLogo.tsx
      UserProfileCard.tsx
      WelcomeGreeting.tsx
      TodayTasksCard.tsx
      StatusChips.tsx
      DailyTipCard.tsx
      MascotAvatar.tsx
      HeroCTA.tsx
      KingKongZone.tsx
      GrowthProgressBar.tsx
    garden/
      GardenHUD.tsx
      GardenStatusCard.tsx
      ImpactFactorsList.tsx
      IsometricCanvas.tsx         # CSS 3D 透视容器
      ParallaxLayer.tsx
      POITag.tsx
      QuickActionToolbar.tsx
      TaskChecklist.tsx
      GardenMapButton.tsx
      CharacterLayer.tsx          # Lottie 角色层
      ParticleLayer.tsx           # tsParticles
    classroom/
      ModuleFlowPath.tsx          # S 型路径地图
      MapWaypoint.tsx             # 知识模块节点
      KnowledgeCard.tsx           # 翻转交互卡片
      QuizModal.tsx               # 3 题型问答
      AICompanionWidget.tsx
      QuickFAQList.tsx
      RecommendationList.tsx
      MilestoneRewardTrack.tsx
    checkin/
      TaskCardList.tsx
      TaskCard.tsx
      SubItemPicker.tsx           # 子项勾选弹窗
      CheckinCalendar.tsx
      TodayRewards.tsx
      CelebrationModal.tsx
    stool/
      StoolRecordModal.tsx        # 便便记录弹窗（全局）
      StoolIconSelector.tsx       # 图标选择（默认模式）
      StoolUpload.tsx             # 拍照上传（注册用户）
    badges/
      BadgeHeader.tsx
      UserStatusCard.tsx
      BadgeShelf.tsx
      BadgeItem.tsx
      ProgressionTimeline.tsx
      UnlockTeaser.tsx
      RecentHighlight.tsx
      BadgeRevealModal.tsx
    profile/
      AvatarEditor.tsx
      AchievementStats.tsx
      WeeklyStats.tsx
      CurrentGoal.tsx
      HistoryTabs.tsx
    report/
      PeriodSwitcher.tsx
      MetricSection.tsx
      MetricCard.tsx
    settings/
      ChildProfileEditor.tsx
      TimeLimitSlider.tsx
      PrivacyPreferences.tsx
    ai/
      AISidebar.tsx
      AIChatbot.tsx
      QuickQuestions.tsx
      DailyObservation.tsx
    onboarding/
      OnboardingOverlay.tsx
      OnboardingStep.tsx
  pages/
    HomePage.tsx
    GardenPage.tsx
    ClassroomPage.tsx
    CheckinPage.tsx
    BadgePage.tsx
    ProfilePage.tsx
    ReportPage.tsx
    SettingsPage.tsx
    LoginPage.tsx
    OnboardingPage.tsx
  types/
    garden.ts
    checkin.ts
    badges.ts
    classroom.ts
    user.ts
```

---

## §10 实施顺序

### Phase 1: Foundation（第 1 周 D1-D2）
1. `main.tsx` 修复（React 19 createRoot）+ `index.css` Tailwind v4 @theme
2. UI 基础组件（Button, Modal, Toast, ProgressBar, Spinner, DualText）
3. types 全量定义
4. stores 全量实现（含游客 localStorage 持久化）
5. `BottomDock` + `HeroCTAButton`（全局导航就绪）
6. 路由骨架 + Layout 组件

### Phase 2: Core Pages（第 1 周 D3-D7）
1. **HomePage** — 完整首页（金刚区 + AI 边栏 + 进度条）
2. **GardenPage** — CSS 3D 视差场景 + 角色 + POI + 工具栏
3. **CheckinPage** — 3 任务卡片 + 子项弹窗 + 便便图标选择 + 日历
4. **StoolRecordModal** — 便便双模式弹窗
5. **AI** — AISidebar + AIChatbot（SSE 流式）+ FAQ

### Phase 3: Extended Pages（第 2 周 D8-D11）
1. **ClassroomPage** — S 型路径地图 + 知识卡片翻转 + 问答
2. **BadgePage** — 徽章陈列架 + 成长路径 + 揭晓动画
3. **ProfilePage** — 我的主页（新增）
4. **ReportPage** — 成长报告（需注册）
5. **SettingsPage** — 设置（需注册）

### Phase 4: Polish（第 2 周 D12-D14）
1. **OnboardingOverlay** — 4 步引导遮罩
2. 路由懒加载 + 路由守卫
3. 游客数据迁移流程
4. 性能降级（FPS < 30 → 静态背景）
5. 无障碍审计（`prefers-reduced-motion`、色盲模拟验证）
6. 全量联调 + BugFix

---

## §11 与现有设计的关键决策对照

| # | 决策 | 结论 |
|---|------|------|
| D1 | 导航方式 | 底部 7-Tab Dock（3+1+3 对称，中央凸起 Hero CTA） |
| D2 | 花园交互 | 2D 手绘 + CSS 3 层视差 + Lottie 角色，食物 @dnd-kit 拖拽 |
| D3 | 打卡任务 UI | PRD 的 3+5 数据结构 + TXT 的卡片式布局（TaskCard ×3 + SubItemPicker 弹窗） |
| D4 | 首页核心 CTA | 菌小园角色 + "今日肠道扫描" 大按钮 |
| D5 | 课堂布局 | S 型等距路径地图串联 5 模块（纵向流程站点） |
| D6 | 徽章页布局 | 拟物化木质陈列架 + 右侧时间轴 |
| D7 | "我的主页" | 新增页面 — 个人档案 + 成就 + 好友（TXT 原误标为"苗页"） |
| D8 | 色板 | 不改动：#4E6A3E / #FFF9EF / #F38D83 + Hero 粉紫 |
| D9 | 知识卡片 | 纵向流程站点串联，非横向时间轴 |
| D10 | 年龄段 | 3-10 岁，双阅读层级自适应（同一页面，非两套 UI） |
| D11 | 正向强化 | 中断不惩罚/不降级/不标红，里程碑取历史最高 |
| D12 | 游客模式 | localStorage 为基础，触发高级功能时引导注册 |
| D13 | 平台 | Phase 1 桌面 Web 优先，移动端/平板兼容 |
