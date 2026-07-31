# 任务看板 — 肠道花园（Gut Garden）

> **版本**: v3.0 | **日期**: 2026-07-31 | **团队**: 1 工程师 + 1 美工 | **周期**: 7 天
> **仓库**: `https://github.com/Zeadeinsung/gut-garden`
> **素材目录**: `web/public/assets/`

---

## 看板使用说明

- 🎨 = 美工任务 | 💻 = 工程师任务
- 每个卡片 = 一个 GitHub Issue，可独立执行、独立验收
- 美工卡片包含：**要画什么 → 画多大 → 存什么格式 → 怎么命名 → 放哪个文件夹 → 上传方法**

---

## 📋 Sprint 1（D1-D3）：核心闭环 — 花园 + 打卡 + 便便

---

### 🎨 A01 — 菌小园角色：静态立绘

**优先级**: P0 | **预估**: 3h | **依赖**: 无

**你要交付**：1 个 PNG 文件

| 项目 | 内容 |
|------|------|
| **文件名** | `char_xiaoyuan.png` |
| **格式** | PNG-24，**透明背景**（必须！不要白底） |
| **画布尺寸** | 512×512 px |
| **分辨率** | 72 DPI |
| **文件大小** | ≤ 200KB |
| **放在哪个文件夹** | `web/public/assets/characters/png/` |
| **上传步骤** | 打开 GitHub → 进入 `web/public/assets/characters/png/` → Add file → Upload files → 拖入 `char_xiaoyuan.png` → Commit |

**画面要求**：
- 菌小园是肠道花园的小导游精灵，外形像一颗可爱的益生菌
- 2D 手绘童话风，圆润可爱，假3D着色（多层渐变+柔和投影模拟立体感）
- 主色调：森林绿 `#4E6A3E` + 奶油米 `#FFF9EF` + 珊瑚粉 `#F38D83`
- 表情开心友善，站姿正面朝向观众
- 身体比例 Q 版（头身比约 1:2）
- 画布内角色居中，四周留 10% padding

**参考风格**：儿童绘本插图，有机曲线，避免尖锐棱角

**验收标准**：
- [ ] 透明底 PNG，无白边
- [ ] 512×512px，≤200KB
- [ ] 风格符合色板（森林绿/奶油米/珊瑚粉）
- [ ] 已上传到 `web/public/assets/characters/png/`

---

### 🎨 A02 — 菌小园角色：Lottie 待机动画（idle）

**优先级**: P0 | **预估**: 2h | **依赖**: A01 的 PNG 完成后参考

**你要交付**：1 个 JSON 文件

| 项目 | 内容 |
|------|------|
| **文件名** | `char_xiaoyuan_idle.json` |
| **格式** | Lottie JSON（After Effects → Bodymovin 插件导出） |
| **画布尺寸** | 512×512 px |
| **帧率** | 30fps |
| **时长** | 循环播放（2-3 秒一个循环） |
| **文件大小** | ≤ 100KB |
| **放在哪个文件夹** | `web/public/assets/characters/lottie/` |
| **上传步骤** | 进入 `web/public/assets/characters/lottie/` → Upload files → 拖入 `char_xiaoyuan_idle.json` → Commit |

**动画内容**：
- 菌小园微微上下浮动（幅度约 5-10px），模拟呼吸感
- 身体有轻微缩放（scale 1.0 → 1.03 → 1.0）
- 眼睛偶尔眨一下（每 2 秒眨一次）
- **必须是循环动画**（loop: true），首尾帧平滑衔接
- 不用做位移/旋转等大动作

**Bodymovin 导出设置**：
- ✅ 勾选 "Glyphs"（如果有文字）
- ✅ 勾选 "Hidden"（隐藏图层也导出）
- ❌ 不勾选 "Compress"（压缩由前端处理）
- Assets 设置为 "Inline"（图片内嵌为 base64）

**验收标准**：
- [ ] Lottie JSON 可在 `lottiefiles.com/preview` 拖入预览
- [ ] 循环播放无跳跃（首尾帧连贯）
- [ ] ≤ 100KB
- [ ] 已上传到 `web/public/assets/characters/lottie/`

---

### 🎨 A03 — 菌小园角色：Lottie 开心动画（happy）

**优先级**: P0 | **预估**: 1.5h | **依赖**: A01

| 项目 | 内容 |
|------|------|
| **文件名** | `char_xiaoyuan_happy.json` |
| **格式** | Lottie JSON（AE + Bodymovin） |
| **画布** | 512×512px，30fps |
| **时长** | ~1.5 秒，播放 1 次（不循环） |
| **文件大小** | ≤ 80KB |
| **放在哪个文件夹** | `web/public/assets/characters/lottie/` |

**动画内容**：
- 菌小园跳起来一下（弹跳），手臂/触角上举
- 眼睛变成弯弯的笑眼（^^ 形状）
- 身体周围冒出 2-3 颗小星星或小花（1 秒后淡出消失）
- 最后停在开心的 pose（终帧），不循环

**验收标准**：
- [ ] 可在 lottiefiles.com 预览
- [ ] ≤ 80KB
- [ ] 播放 1 次后停在终帧（`loop: false`）
- [ ] 已上传到 `web/public/assets/characters/lottie/`

---

### 🎨 A04 — 菌小园角色：Lottie 担心动画（worry）

**优先级**: P0 | **预估**: 1.5h | **依赖**: A01

| 项目 | 内容 |
|------|------|
| **文件名** | `char_xiaoyuan_worry.json` |
| **格式** | Lottie JSON |
| **画布** | 512×512px，30fps |
| **时长** | ~1.5 秒，播放 1 次 |
| **文件大小** | ≤ 80KB |
| **放在哪个文件夹** | `web/public/assets/characters/lottie/` |

**动画内容**：
- 菌小园微微低头，眉毛下垂（八字眉）
- 身体左右微微摇晃 1-2 次
- 头顶冒出一颗小汗滴 💧
- 最后停在担心的 pose（终帧）

**验收标准**：
- [ ] 同上 A03 标准
- [ ] 已上传到 `web/public/assets/characters/lottie/`

---

### 🎨 A05 — 纤纤种子角色：静态立绘

**优先级**: P0 | **预估**: 2h | **依赖**: 无

| 项目 | 内容 |
|------|------|
| **文件名** | `char_xianxian.png` |
| **格式** | PNG-24，透明背景 |
| **画布尺寸** | 512×512 px，72 DPI |
| **文件大小** | ≤ 200KB |
| **放在哪个文件夹** | `web/public/assets/characters/png/` |

**画面要求**：
- 纤纤种子是膳食纤维的化身，外形像一颗可爱的种子精灵
- 身体圆润像一粒米/种子，有小小的芽从头顶冒出
- 颜色：浅绿色 + 暖黄色，与主色板协调
- Q 版比例，正面朝向

**验收标准**：
- [ ] 透明底 PNG，512×512px，≤200KB
- [ ] 已上传到 `web/public/assets/characters/png/`

---

### 🎨 A06 — 纤纤种子：Lottie 待机动画（idle）

**优先级**: P0 | **预估**: 1.5h | **依赖**: A05

| 项目 | 内容 |
|------|------|
| **文件名** | `char_xianxian_idle.json` |
| **格式** | Lottie JSON |
| **画布** | 512×512px，30fps，循环 2-3s |
| **文件大小** | ≤ 80KB |
| **放在哪个文件夹** | `web/public/assets/characters/lottie/` |

**动画内容**：
- 头顶的小芽微微摆动（像被风吹）
- 身体轻微上下浮动
- 循环播放

---

### 🎨 A07 — 纤纤种子：Lottie 难过动画（sad）

**优先级**: P0 | **预估**: 1h | **依赖**: A05

| 项目 | 内容 |
|------|------|
| **文件名** | `char_xianxian_sad.json` |
| **格式** | Lottie JSON |
| **画布** | 512×512px，30fps，~1.5s 播放 1 次 |
| **文件大小** | ≤ 70KB |
| **放在哪个文件夹** | `web/public/assets/characters/lottie/` |

**动画内容**：
- 头顶小芽耷拉下来
- 身体缩小一点 + 颜色变暗淡
- 终帧保持难过状态

---

### 🎨 A08 — 探索花园场景：Sky+Far 层

**优先级**: P0（最高） | **预估**: 3h | **依赖**: 无 — 这是项目最核心的视觉资产

| 项目 | 内容 |
|------|------|
| **文件名** | `scene_garden_sky.png` |
| **格式** | PNG-24，**必须透明通道**（天空渐变用 PNG 透明度，透过到页面奶油米底色 `#FFF9EF`） |
| **画布尺寸** | 1920×1080 px，72 DPI |
| **文件大小** | ≤ 500KB |
| **放在哪个文件夹** | `web/public/assets/scenes/` |

**这一层画什么**（远景层，离用户最远，移动最慢）：
- 画面顶部：柔和天空渐变（浅蓝→奶油米白），用透明度过渡而非纯色填充
- 画面中部：远山轮廓剪影（3-4 层叠山，浅绿色调，越远越淡）
- 画面中上部：远云朵（3-5 朵，柔和蓬松，低透明度，不要太抢眼）
- 太阳/月亮（画面左上角或右上角，暖黄色小圆形 + 柔和光晕）
- **不需要画**：任何建筑、角色、树木（那是中景层的事）
- **不需要画**：前景花草（那是近景层的事）

**UI 避让注意**：
- 画面顶部 y=0~72 会被 Header 覆盖 → 简化
- 画面左右两侧会被面板覆盖 → 天空渐变为主即可

**重要！** 因为要做 CSS 视差，这一层在代码里会被缩小（`scale(1.17)` 补偿 translateZ: -200px），所以画面边缘的内容可能被裁切。**核心视觉元素不要紧贴画面边缘**，至少留 100px 安全边距。

**验收标准**：
- [ ] 透明底 PNG，1920×1080px
- [ ] 远山/云朵/太阳元素完整，风格统一
- [ ] 已上传到 `web/public/assets/scenes/`

---

### 🎨 A09 — 探索花园场景：Mid 层（花园主体）

**优先级**: P0（最高） | **预估**: 8h | **依赖**: 无 — 项目最核心、最耗时的视觉资产

| 项目 | 内容 |
|------|------|
| **文件名** | `scene_garden_mid.png` |
| **格式** | PNG-24，**必须透明通道** |
| **画布尺寸** | 1920×1080 px，72 DPI |
| **文件大小** | ≤ 800KB |
| **放在哪个文件夹** | `web/public/assets/scenes/` |

**这一层画什么**（中景层，花园主体，CSS translateZ: 0，正常大小）：
这是一个肠道微生态的童话花园，要画以下元素：

1. **蘑菇房**（画面中偏左，x≈300-500, y≈300-500）：菌居民的家，蘑菇形状的小房子，有门有窗，烟囱飘出小烟雾。2-3 个蘑菇房聚在一起。
2. **风车塔**（画面中偏右，x≈1100-1300, y≈250-400）：木结构风车，叶片 CSS 旋转动画
3. **肠道溪流**（画面中央蜿蜒穿过，y≈400-550）：弯曲的蓝色小溪，从左上流到右下。溪流旁边可以有码头小木桥。
4. **生命之树**（画面中上部）：一棵大树，树冠茂密，树下有发光的小果实
5. **酸酸喷泉**（溪流旁边）：小喷泉，喷出金色水花（短链脂肪酸的隐喻）
6. **屏障城堡**（画面偏右下）：小城堡/城墙，保护花园边界
7. **菌居民之家**（蘑菇房附近）：几个小房子/洞穴，门口有小菌菌居民的剪影
8. **生态观察站**（画面偏左）：小瞭望塔/望远镜台
9. **树木 + 灌木**（散布画面各处，森林绿 #4E6A3E 色调）
10. **石板小路**（蜿蜒连接各个建筑）

**UI 避让注意**：
- 画面顶部 y=0~72（Header）→ 简化，不要放重要建筑
- 画面左侧 x=0~248（侧边栏）→ 可以有些树木/花草，但不要放关键 POI
- 画面右侧 x=1032~1280（AI 面板）→ 同上，次要装饰即可
- 画面底部 y=616~720（工具栏）→ 简化
- **核心绘制区**（最需要精细画的区域）：x=248~1032, y=72~616

**验收标准**：
- [ ] 透明底 PNG，1920×1080px，≤800KB
- [ ] 包含上述至少 8 个 POI 元素
- [ ] 2D 手绘童话风，配色协调
- [ ] 已上传到 `web/public/assets/scenes/`

---

### 🎨 A10 — 探索花园场景：Front 层（近景）

**优先级**: P0 | **预估**: 2h | **依赖**: A09 完成后调色更准

| 项目 | 内容 |
|------|------|
| **文件名** | `scene_garden_front.png` |
| **格式** | PNG-24，**大量透明区域**（这一层是镂空的，只有前景物体） |
| **画布尺寸** | 1920×1080 px，72 DPI |
| **文件大小** | ≤ 400KB |
| **放在哪个文件夹** | `web/public/assets/scenes/` |

**这一层画什么**（近景层，CSS translateZ: 150px，离用户最近，移动最快）：
- 画面底部：前排高草丛（只画画面底部 1/4，上半部分是透明的！）
- 左下角：几块小石头 + 野花
- 右下角：小栅栏（2-3 根木桩 + 绳子）
- 左右边缘：伸出的树枝/树叶（做前景框效果）
- **重要**：90% 的画面区域应该是**完全透明的**，只有底部和边缘有物体

**验收标准**：
- [ ] 大量透明区域（非全幅填充）
- [ ] 前排物体风格与中景层一致
- [ ] 已上传到 `web/public/assets/scenes/`

---

### 🎨 A11 — 花园场景状态变体：高糖状态

**优先级**: P0 | **预估**: 1.5h | **依赖**: A09 完成

| 项目 | 内容 |
|------|------|
| **文件名** | `scene_garden_mid_high_sugar.png` |
| **格式** | PNG-24，透明背景 |
| **画布** | 1920×1080 px |
| **放在哪个文件夹** | `web/public/assets/scenes/` |

**怎么画**：基于 A09 的 `scene_garden_mid.png`，做以下颜色调整：
- 整体色调偏暗黄（色相偏移 -10°，饱和度 +5%）
- 溪流变油污浑浊色（蓝色→灰棕色）
- 植被出现暗斑（局部加深）
- 坏菌膨胀（菌居民之家附近有一些紫色/暗色斑点）

> 提示：在 Photoshop 里打开 A09 → 新建调整图层（色相/饱和度）→ 导出

---

### 🎨 A12 — 花园场景状态变体：干旱状态

**优先级**: P0 | **预估**: 1h | **依赖**: A09 完成

| 项目 | 内容 |
|------|------|
| **文件名** | `scene_garden_mid_dry.png` |
| **格式** | PNG-24，透明背景 |
| **画布** | 1920×1080 px |
| **放在哪个文件夹** | `web/public/assets/scenes/` |

**怎么画**：基于 A09 调整：
- 整体饱和度降低 40%（saturation -40%）
- 溪流干涸露河床（局部改为土黄色/龟裂纹理）
- 植被偏灰偏黄
- 土地龟裂纹理（可以在溪流区域加一些裂纹笔刷）

---

### 🎨 A13 — 7 种便便图标（全量，一版出完）

**优先级**: P0 | **预估**: 3.5h（每张 30min） | **依赖**: 无

**你要交付**：7 个 PNG 文件。每个都是儿童友好的卡通便便，不要写实/恶心。

| # | 文件名 | Bristol | 童趣名称 | 画面描述 |
|---|--------|---------|----------|----------|
| 1 | `stool_type1_rabbit.png` | Type 1 | 🐰 兔子便便 | 分散的小硬块，像兔子粪便，浅棕色，排列松散 |
| 2 | `stool_type2_grape.png` | Type 2 | 🍇 葡萄串 | 香肠状但表面凹凸不平，像一串葡萄连在一起，深棕色 |
| 3 | `stool_type3_corn.png` | Type 3 | 🌽 玉米肠 | 香肠状表面有裂缝，像玉米表面纹路，浅棕色 |
| 4 | `stool_type4_banana.png` | Type 4 | 🍌 香蕉宝宝 | 光滑柔软蛇形，理想便便！像剥开的香蕉，金黄色/暖棕色 |
| 5 | `stool_type5_icecream.png` | Type 5 | 🍦 软冰淇淋 | 软块状边缘清晰，像一坨软冰淇淋，浅棕黄色 |
| 6 | `stool_type6_marshmallow.png` | Type 6 | ☁️ 棉花糖 | 糊状/蓬松边缘不齐，像撕开的棉花糖，浅棕色 |
| 7 | `stool_type7_water.png` | Type 7 | 💧 水水 | 完全水样/一滩液体，无固体形状，浅黄色水渍状 |

**所有文件通用规格**：
- **格式**: PNG-24，**透明背景**
- **画布**: 160×160 px，72 DPI
- **文件大小**: 每个 ≤ 50KB
- **放在哪个文件夹**: `web/public/assets/stools/`

**画面风格要求**：
- 可爱的卡通画风，不是医学教科书风格！
- 圆润线条，柔和阴影
- 每个图标都有可爱的"小表情"（小眼睛/小嘴巴），像是在微笑
- Type 4（香蕉宝宝）应该看起来最开心最健康（金色光泽 ✨）
- 颜色温暖，不要用灰暗色调
- 每个图标下方可以有一个迷你标签（如 "Type 1" 小字，但不是必须的）

**验收标准**：
- [ ] 7 个 PNG，透明底，160×160px
- [ ] 儿童友好，不写实不恶心
- [ ] 已全部上传到 `web/public/assets/stools/`

---

### 🎨 A14 — 7 种食物道具图标

**优先级**: P0 | **预估**: 2h | **依赖**: 无

| # | 文件名 | 食物 | 画布 | 触发花园状态 |
|---|--------|------|------|-------------|
| 1 | `food_broccoli.png` | 🥦 西兰花 | 120×120px | → healthy（+健康） |
| 2 | `food_carrot.png` | 🥕 胡萝卜 | 120×120px | → healthy（+健康） |
| 3 | `food_yogurt.png` | 🫙 酸奶 | 100×100px | → healthy（+健康） |
| 4 | `food_apple.png` | 🍎 苹果 | 100×100px | → healthy（+健康） |
| 5 | `food_corn.png` | 🌽 玉米 | 120×120px | → healthy（+健康） |
| 6 | `food_candy.png` | 🍬 糖果 | 120×120px | → high_sugar（+高糖警告） |
| 7 | `food_cake.png` | 🍰 蛋糕 | 120×120px | → high_sugar（+高糖警告） |

**所有文件通用规格**：
- **格式**: PNG-24，**透明背景**
- **分辨率**: 72 DPI
- **文件大小**: 每个 ≤ 30KB
- **放在哪个文件夹**: `web/public/assets/foods/`

**画面要求**：Q 版可爱食物，有光泽感，像游戏道具一样精致。2D 手绘风，与花园场景风格统一。

**验收标准**：
- [ ] 7 个 PNG，透明底，各自尺寸正确
- [ ] 风格统一，Q 版可爱
- [ ] 已全部上传到 `web/public/assets/foods/`

---

### 🎨 A15 — 5 张知识模块卡片插画

**优先级**: P0 | **预估**: 5h（每张 1h） | **依赖**: 无

| # | 文件名 | 模块名称（童趣） | 画面内容 |
|---|--------|-----------------|----------|
| 1 | `card_fiber_square.png` | 膳食纤维广场 | 纤维食物（蔬菜水果）+ 小菌菌们在餐桌旁聚餐的欢乐场景 |
| 2 | `card_ferment_workshop.png` | 发酵工坊 | 微生物工厂车间，小菌菌们在加工纤维食物，有齿轮/传送带 |
| 3 | `card_scfa_spring.png` | 短链脂肪酸泉 | 金色泉水从地下涌出，浇灌周围的花草，彩虹光晕 |
| 4 | `card_barrier_wall.png` | 肠道屏障城墙 | 坚固的城墙保护着花园，城墙上站着巡逻的小菌菌哨兵 |
| 5 | `card_eco_station.png` | 生态平衡观测站 | 瞭望塔/观测台俯瞰整个花园，有望远镜/仪表盘/图表 |

**所有文件通用规格**：
- **格式**: PNG-24（可以不需要透明底，因为卡片是矩形的）
- **画布尺寸**: 600×400 px，72 DPI
- **文件大小**: 每个 ≤ 200KB
- **放在哪个文件夹**: `web/public/assets/cards/`

**画面要求**：每张卡片是矩形插画，用于知识卡片正面。画面饱满丰富，适合儿童阅读理解。风格与花园场景统一（2D 手绘童话风）。正面中央写有童趣标题（中文，≥24px 等效大小）。

**验收标准**：
- [ ] 5 张 PNG，600×400px，≤200KB
- [ ] 每张画面内容与描述匹配
- [ ] 已全部上传到 `web/public/assets/cards/`

---

### 🎨 A16 — 3 个 Lottie 庆祝特效

**优先级**: P0 | **预估**: 3h | **依赖**: 无

| # | 文件名 | 说明 | 触发时机 | 画布 | 时长 |
|---|--------|------|----------|------|------|
| 1 | `fx_celebration_stars.json` | 星星爆炸 + 花园花粉粒子散落 | 5 项打卡全部完成 | 800×600px | ~1.5s，播 1 次停终帧 |
| 2 | `fx_badge_reveal.json` | 金光闪过 + 徽章从模糊旋转到清晰 | 新徽章获得 | 800×600px | ~2s，播 1 次停终帧 |
| 3 | `fx_level_up.json` | 光芒中心扩散 + 植物生长破土 | 花园成长阶段升级 | 800×600px | ~2s，播 1 次停终帧 |

**所有文件通用规格**：
- **格式**: Lottie JSON（AE + Bodymovin 导出）
- **帧率**: 30fps
- **放在哪个文件夹**: `web/public/assets/lottie/effects/`

**Bodymovin 导出设置**：
- ✅ Inline assets（图片内嵌）
- ❌ 不压缩
- `loop: false`（播放 1 次后停在终帧）

**验收标准**：
- [ ] 3 个 JSON，可在 lottiefiles.com 预览
- [ ] 播放 1 次后停终帧
- [ ] 已上传到 `web/public/assets/lottie/effects/`

---

### 🎨 A17 — 6 枚速赢徽章中央图标（Sprint 1 优先级）

**优先级**: P0 | **预估**: 3h（每张 30min） | **依赖**: 无

> 说明：这 6 枚是用户最早能获得的徽章，必须 Sprint 1 交付。剩余 15 枚可以 Sprint 2。

| # | 文件名 | 名称 | 画面描述 |
|---|--------|------|----------|
| 1 | `badge_first_checkin_icon.png` | 初来乍到 | 一只小脚丫踩在花园土地上，旁边有小芽冒出 |
| 2 | `badge_persist_3d_icon.png` | 初露锋芒 | 一颗小星星在花园上方闪烁，星光照到一朵小花 |
| 3 | `badge_persist_7d_icon.png` | 一周之星 | 7 颗小星星排列成环形，中央是发光的大星 |
| 4 | `badge_first_feed_icon.png` | 初次投喂 | 一只手（或小爪子）拿着一片叶子，递向花园 |
| 5 | `badge_first_quiz_icon.png` | 好奇宝宝 | 一个放大镜 + 问号，问号在放大镜下变大看清 |
| 6 | `badge_first_stool_icon.png` | 便便观察员 | 可爱的香蕉便（Type 4）坐在观察台上，旁边有笔记本 |

**通用规格**：
- **格式**: PNG-24，**透明背景**（圆形图标，圆圈外透明）
- **画布尺寸**: 512×512 px，72 DPI，≤200KB
- **放在哪个文件夹**: `web/public/assets/badges/icons/`

> **重要提示**：徽章采用两层分离架构！你只画**中央图标**（徽章里面的插画）。外面的铜/银/金边框是 3 个通用 PNG（A18 任务），前端用 CSS 叠加。同一枚徽章升级时**图标不换，只换边框**。

**画面要求**：
- 圆形构图的插画图标（想象成一个圆形徽章的中央部分）
- 风格与花园场景统一，Q 版可爱
- 图标在 512×512 画布内居中，实际图标内容约占中央 350×350 区域（周围透明留给边框叠加）

**验收标准**：
- [ ] 6 个 PNG，透明底，512×512px
- [ ] 圆形构图，图标居中
- [ ] 已上传到 `web/public/assets/badges/icons/`

---

### 🎨 A18 — 3 种徽章通用边框

**优先级**: P0 | **预估**: 1.5h | **依赖**: 无

| # | 文件名 | 稀有度 | 视觉效果 |
|---|--------|--------|----------|
| 1 | `ui_badge_frame_bronze.png` | 🥉 铜 | 古铜色圆形边框，单色无光效，简洁 |
| 2 | `ui_badge_frame_silver.png` | 🥈 银 | 银色圆形边框，有轻微金属光泽 |
| 3 | `ui_badge_frame_gold.png` | 🥇 金 | 金色圆形边框，金光闪闪，有小光芒射线 |

**通用规格**：
- **格式**: PNG-24，**透明背景，圆形镂空**（中央是透明的洞，露出下面的徽章图标！）
- **画布尺寸**: 512×512 px，72 DPI，≤100KB
- **放在哪个文件夹**: `web/public/assets/badges/frames/`

**怎么画**：
- 画布中央有一个圆形镂空区域（直径约 350-380px），这是用来露出徽章图标的
- 圆形边框本身宽度约 20-30px
- 边框外侧可以有装饰（如齿轮纹、月桂叶、小星星等）
- 铜框：简洁低调
- 银框：有光泽感，小钻石点缀
- 金框：华丽，放射光芒

**验收标准**：
- [ ] 3 个 PNG，透明底，512×512px
- [ ] 中央圆形镂空透明（能透出下层图标）
- [ ] 三种稀有度视觉差异明显
- [ ] 已上传到 `web/public/assets/badges/frames/`

---

### 🎨 A19 — 导航栏图标：底部 Dock（7 个 SVG）

**优先级**: P0 | **预估**: 1.5h | **依赖**: 无

| # | 文件名 | 说明 | 格式 | 尺寸 |
|---|--------|------|------|------|
| 1 | `ui_dock_home.svg` | 底部导航-首页（苗页）图标 | SVG | 48×48px |
| 2 | `ui_dock_garden.svg` | 底部导航-探索花园图标 | SVG | 48×48px |
| 3 | `ui_dock_checkin.svg` | 底部导航-每日打卡图标 | SVG | 48×48px |
| 4 | `ui_dock_hero.svg` | 底部导航-拍便便分析 Hero CTA 图标（📷 相机） | SVG | 64×64px |
| 5 | `ui_dock_class.svg` | 底部导航-探索课堂图标 | SVG | 48×48px |
| 6 | `ui_dock_badges.svg` | 底部导航-成长徽章图标 | SVG | 48×48px |
| 7 | `ui_dock_profile.svg` | 底部导航-我的主页图标 | SVG | 48×48px |

**通用规格**：
- **格式**: SVG（矢量），`viewBox="0 0 48 48"`（Hero 用 64×64）
- **放在哪个文件夹**: `web/public/assets/ui/`

**风格要求**：线性图标（outline style），2px 描边，圆角端点，与整体童话风协调。选中态会变成实心填充 + 主题色，所以图标设计要能同时支持 outline 和 filled 两种形态。

**验收标准**：
- [ ] 7 个 SVG，尺寸正确
- [ ] outline 风格，圆角
- [ ] 已上传到 `web/public/assets/ui/`

---

### 🎨 A20 — 首页金刚区图标（4 个 SVG）

**优先级**: P0 | **预估**: 1h | **依赖**: 无

| # | 文件名 | 说明 | 格式 | 尺寸 |
|---|--------|------|------|------|
| 1 | `ui_kingkong_garden.svg` | 首页金刚区-探索花园 | SVG | 80×80px |
| 2 | `ui_kingkong_checkin.svg` | 首页金刚区-每日打卡 | SVG | 80×80px |
| 3 | `ui_kingkong_class.svg` | 首页金刚区-知识课堂 | SVG | 80×80px |
| 4 | `ui_kingkong_badges.svg` | 首页金刚区-成长徽章 | SVG | 80×80px |

**通用规格**：
- **格式**: SVG，`viewBox="0 0 80 80"`
- **放在哪个文件夹**: `web/public/assets/ui/`

**风格要求**：比 Dock 图标更精致丰富，因为这些是首页最大的入口按钮。可以有轻微的色彩渐变和细节装饰。偏"游戏化按钮"风格。

---

### 🎨 A21 — 打卡页 5 主项任务图标

**优先级**: P0 | **预估**: 1.5h | **依赖**: 无

| # | 文件名 | 说明 | 格式 | 尺寸 |
|---|--------|------|------|------|
| 1 | `ui_task_explore.svg` | 探索花园（复合关卡：游戏+视频+常识题） | SVG | 64×64px |
| 2 | `ui_task_eat.svg` | 健康饮食 | SVG | 64×64px |
| 3 | `ui_task_sleep.svg` | 优质睡眠 | SVG | 64×64px |
| 4 | `ui_task_water.svg` | 补充水分 | SVG | 64×64px |
| 5 | `ui_task_sport.svg` | 活力运动 | SVG | 64×64px |

**通用规格**：
- **格式**: SVG，`viewBox="0 0 64 64"`
- **放在哪个文件夹**: `web/public/assets/ui/`

---

### 🎨 A22 — 通用 UI 小图标（16 个）

**优先级**: P1 | **预估**: 2h | **依赖**: 无

| # | 文件名 | 说明 | 格式 | 尺寸 |
|---|--------|------|------|------|
| 1 | `ui_icon_settings.svg` | 设置齿轮 ⚙️ | SVG | 24×24px |
| 2 | `ui_icon_sound_on.svg` | 音效开 🔊 | SVG | 24×24px |
| 3 | `ui_icon_sound_off.svg` | 音效关 🔇 | SVG | 24×24px |
| 4 | `ui_icon_reading_level.svg` | 双阅读层级切换 📖 | SVG | 20×20px |
| 5 | `ui_icon_streak_fire.svg` | 连续天数火焰 🔥 | SVG | 32×32px |
| 6 | `ui_icon_xp_star.svg` | 经验值星星 ⭐ | SVG | 24×24px |
| 7 | `ui_icon_lock.svg` | 锁定图标 🔒 | SVG | 24×24px |
| 8 | `ui_icon_check.svg` | 完成勾选 ✅ | SVG | 24×24px |
| 9 | `ui_icon_chevron_right.svg` | 右箭头 → | SVG | 16×16px |
| 10 | `ui_icon_info.svg` | 信息提示 ℹ️ | SVG | 20×20px |
| 11 | `ui_tool_water.svg` | 花园工具栏-浇水 💧 | SVG | 48×48px |
| 12 | `ui_tool_clean.svg` | 花园工具栏-清理 🧹 | SVG | 48×48px |
| 13 | `ui_tool_plant.svg` | 花园工具栏-种植 🌱 | SVG | 48×48px |
| 14 | `ui_tool_magnifier.svg` | 花园工具栏-放大镜 🔍 | SVG | 48×48px |
| 15 | `ui_tool_camera.svg` | 花园工具栏-拍照 📸 | SVG | 48×48px |
| 16 | `ui_reward_water.svg` | 奖励掉落物-水分 💧 | SVG | 48×48px |
| 17 | `ui_reward_leaf.svg` | 奖励掉落物-能量 🍃 | SVG | 48×48px |
| 18 | `ui_reward_sun.svg` | 奖励掉落物-阳光 ☀️ | SVG | 48×48px |

**通用规格**：
- **格式**: SVG，各自尺寸如表格所示
- **放在哪个文件夹**: `web/public/assets/ui/`

---

### 🎨 A23 — 品牌 Logo + 默认头像等杂项素材

**优先级**: P1 | **预估**: 1h | **依赖**: 无

| # | 文件名 | 说明 | 格式 | 尺寸 | 文件夹 |
|---|--------|------|------|------|--------|
| 1 | `ui_logo.png` | 品牌 Logo（图标+文字"肠道花园"） | PNG | 220×48px | `ui/` |
| 2 | `ui_logo_icon.svg` | 纯图标（无文字），favicon 用 | SVG | 48×48px | `ui/` |
| 3 | `ui_avatar_default_child.png` | 儿童默认头像 | PNG | 128×128px | `ui/` |
| 4 | `ui_avatar_default_parent.png` | 家长默认头像 | PNG | 128×128px | `ui/` |
| 5 | `ui_empty_badge_slot.png` | 空徽章槽位（灰色圆形+问号） | PNG | 128×128px | `ui/` |
| 6 | `ui_empty_state_garden.png` | 花园空状态插画（引导用） | PNG | 400×300px | `ui/` |
| 7 | `ui_stool_upload_placeholder.png` | 便便拍照上传占位图 | PNG | 560×100px | `ui/` |

---

## 📋 Sprint 2（D4-D7）：完整体验 — 课堂 + 徽章 + 报告 + 剩余角色

---

### 🎨 A24 — 杂草坏菌角色：静态立绘 + 2 Lottie

**优先级**: P0 | **预估**: 3h | **依赖**: 无

| 文件 | 文件名 | 说明 |
|------|--------|------|
| PNG | `char_zaicao.png` | 杂草坏菌立绘，512×512px，透明底，≤200KB |
| Lottie | `char_zaicao_idle.json` | 待机动画（循环 2-3s），512×512px，≤80KB |
| Lottie | `char_zaicao_rampant.json` | 猖獗动画（膨胀变大+紫色气焰，~1.5s），512×512px，≤80KB |

**画面要求**：杂草坏菌是"反派"角色，外形像带刺的杂草 + 坏菌混合体，紫色/暗绿色调。不要太恐怖，保持儿童友好的"淘气反派"感。

**文件夹**: PNG → `web/public/assets/characters/png/` | Lottie → `web/public/assets/characters/lottie/`

---

### 🎨 A25 — 丁丁泉灵角色：静态立绘 + 2 Lottie

**优先级**: P0 | **预估**: 3h | **依赖**: 无

| 文件 | 文件名 | 说明 |
|------|--------|------|
| PNG | `char_dingding.png` | 丁丁泉灵立绘，512×512px，透明底，≤200KB |
| Lottie | `char_dingding_idle.json` | 待机动画（循环 2-3s），≤80KB |
| Lottie | `char_dingding_golden.json` | 金色发光动画（泉水涌出+金光，~1.5s），≤80KB |

**画面要求**：丁丁泉灵是短链脂肪酸泉的守护精灵，外形像水滴精灵，半透明质感，金色/浅蓝色调。温柔优雅。

**文件夹**: PNG → `web/public/assets/characters/png/` | Lottie → `web/public/assets/characters/lottie/`

---

### 🎨 A26 — 香蕉小船角色：静态立绘 + 2 Lottie

**优先级**: P0 | **预估**: 3h | **依赖**: 无

| 文件 | 文件名 | 说明 |
|------|--------|------|
| PNG | `char_xiangjiao.png` | 香蕉小船立绘，512×512px，透明底 |
| Lottie | `char_xiangjiao_idle.json` | 待机动画（左右摇晃像船在飘），≤80KB |
| Lottie | `char_xiangjiao_sail.json` | 航行动画（加速摇摆+水花，~1.5s），≤80KB |

**画面要求**：香蕉小船是肠道溪流的渡船，外形像半根香蕉做的小船，上面有帆。黄色/棕色暖色调。

**文件夹**: PNG → `web/public/assets/characters/png/` | Lottie → `web/public/assets/characters/lottie/`

---

### 🎨 A27 — 剩余 15 枚徽章中央图标

**优先级**: P0 | **预估**: 4h（每张约 16min） | **依赖**: 无

遵循 A17 的规格（512×512px，透明底，圆形构图），画剩余 15 枚：

**坚持之星类**（3 枚）：
| 文件名 | 名称 | 画面描述 |
|--------|------|----------|
| `badge_persist_30d_icon.png` | 月度冠军 | 日历翻页动画感，30 天标记 |
| `badge_persist_100d_icon.png` | 百日守护 | 100 天里程碑，盾牌+100 标记 |
| `badge_all_sub_7d_icon.png` | 全能小冠军 | 皇冠+5 个小星星（代表 5 项打卡） |

**探索达人类**（4 枚）：
| 文件名 | 名称 | 画面描述 |
|--------|------|----------|
| `badge_feed_50_icon.png` | 小小农夫 | 草帽+50 次标记，田园感 |
| `badge_first_magnifier_icon.png` | 小小科学家 | 放大镜对准一片叶子 |
| `badge_magnifier_20_icon.png` | 放大镜专家 | 高级放大镜+显微镜 |
| `badge_garden_doctor_icon.png` | 花园医生 | 医疗包+花园 |

**科普小学者类**（5 枚）：
| 文件名 | 名称 | 画面描述 |
|--------|------|----------|
| `badge_quiz_10_icon.png` | 答题小能手 | 灯泡+答题板 |
| `badge_stool_streak_7_icon.png` | 持续观察 | 7 天便便记录链 |
| `badge_module_fiber_icon.png` | 纤维专家 | 膳食纤维广场徽章 |
| `badge_module_all_5_icon.png` | 知识全能王 | 5 模块完成徽章 |

**特殊成就类**（3 枚）：
| 文件名 | 名称 | 画面描述 |
|--------|------|----------|
| `badge_perfect_week_icon.png` | 完美一周 | 7/7 完美标记 |
| `badge_type4_streak_5_icon.png` | 超级便便 | 5 次 Type 4 香蕉便 |
| `badge_birthday_icon.png` | 花园生日 | 生日蛋糕+花园 |
| `badge_spring_festival_icon.png` | 春节彩蛋 | 红包+灯笼 |

**所有文件规格**：PNG-24，透明底，512×512px，≤200KB
**文件夹**: `web/public/assets/badges/icons/`

---

### 🎨 A28 — 场景背景图：首页 + 课堂 + 打卡 + 登录

**优先级**: P0 | **预估**: 4h | **依赖**: 无

| # | 文件名 | 用在哪 | 画布 | 说明 |
|---|--------|--------|------|------|
| 1 | `scene_home_bg.png` | 首页 `/` | 1920×1080px | 轻量花园氛围壁纸。有花园花草/小径/阳光，比花园页简洁。CTA 是视觉焦点不要抢。**透明底** |
| 2 | `scene_classroom_map.png` | 探索课堂 `/classroom` | 1920×1080px | S 型蜿蜒小路/水流串联 5 个知识模块节点（小建筑图标）。比花园页更"有序"的学术感。**透明底** |
| 3 | `scene_checkin_bg.png` | 每日打卡 `/checkin` | 1920×1080px | 轻量花纹壁纸，作为 5 张打卡卡片背后的氛围装饰。**透明底** |
| 4 | `scene_login_bg.png` | 登录页 `/login` | 1920×1080px | 简洁的登录页背景，居中留白给表单，边缘有花园元素装饰 |

**文件夹**: `web/public/assets/scenes/`

---

### 🎨 A29 — 新用户引导 4 步插画

**优先级**: P1 | **预估**: 2h | **依赖**: 无

| # | 文件名 | 说明 | 格式 | 尺寸 |
|---|--------|------|------|------|
| 1 | `ui_onboarding_step1.png` | 引导第1步 — "认识你的花园" | PNG | 400×200px |
| 2 | `ui_onboarding_step2.png` | 引导第2步 — "逛逛知识花园" | PNG | 400×200px |
| 3 | `ui_onboarding_step3.png` | 引导第3步 — "记录便便观察" | PNG | 400×200px |
| 4 | `ui_onboarding_step4.png` | 引导第4步 — "收集成长星星" | PNG | 400×200px |

**文件夹**: `web/public/assets/onboarding/`

---

### 🎨 A30 — 环境动效 Lottie（花粉漂浮）

**优先级**: P1 | **预估**: 1h | **依赖**: 无

| 文件名 | 说明 | 尺寸 | 格式 |
|--------|------|------|------|
| `fx_pollen_float.json` | 花园花粉漂浮粒子（小圆点、随机缓动、循环） | 200×200px | Lottie JSON |

**文件夹**: `web/public/assets/lottie/effects/`

---

## 💻 工程师任务清单

---

### 💻 D01 — 项目脚手架搭建

**优先级**: P0 | **预估**: 2h | **依赖**: 无

**任务内容**：
1. 使用 Vite 创建 React 18 + TypeScript 项目于 `web/`
2. 安装全部依赖：react-router-dom, framer-motion, zustand, @dnd-kit/core, lottie-web, howler, radix-ui（Dialog/Popover/Tooltip/Slider）, tailwindcss v4
3. 配置 Tailwind v4 `@theme` 自定义颜色变量（森林绿/奶油米/珊瑚粉/Hero粉紫）
4. 创建全局样式 `web/src/index.css` + `web/src/styles/animations.css`
5. 配置 10 条路由骨架 + `Layout` 组件 + `ProtectedRoute` 路由守卫
6. 初始化 Fastify + TypeScript 后端于 `server/`
7. 执行数据库建表 SQL（12 张表 + 21 条徽章种子数据）
8. 配置 Drizzle ORM + 生成所有 Schema 定义

**验收标准**：
- [ ] `npm run dev` 前端启动成功（localhost:5173）
- [ ] `npm run dev` 后端启动成功（localhost:3001）
- [ ] 10 条路由均可访问（显示占位组件）
- [ ] 12 张数据库表存在，`SELECT * FROM badge_defs` 返回 21 行

**输出文件**：`web/src/App.tsx`, `web/src/index.css`, `web/src/styles/animations.css`, `server/src/app.ts`, `server/src/db/schema/*.ts`

---

### 💻 D02 — TypeScript 类型定义 + 6 个 Zustand Store

**优先级**: P0 | **预估**: 2h | **依赖**: D01

**任务内容**：
1. 创建 5 个类型文件：`garden.ts`, `checkin.ts`, `badges.ts`, `classroom.ts`, `user.ts`（覆盖全部数据模型，5 主项打卡结构，7 种便便类型）
2. 创建 6 个 Zustand Store：authStore, gardenStore, checkinStore, badgeStore, classroomStore, uiStore
3. 每个 Store 配置 `persist` middleware（游客模式 localStorage 自动持久化）
4. 实现 localStorage 工具库 + API 客户端封装（fetch 封装 + JWT 自动附带 + 401 处理）

**验收标准**：
- [ ] TypeScript 编译无报错
- [ ] 6 个 Store 在浏览器 DevTools 可查看初始值
- [ ] 游客数据关闭浏览器后重新打开仍保留

**输出文件**：`web/src/types/*.ts`, `web/src/stores/*.ts`, `web/src/lib/localStorage.ts`, `web/src/lib/api.ts`

---

### 💻 D03 — 通用 UI 组件库 + 底部 Dock 导航

**优先级**: P0 | **预估**: 3h | **依赖**: D02

**任务内容**：
1. 实现 6 个基础 UI 组件：Button, Modal, Toast, ProgressBar, Spinner, DualText（双阅读层级）
2. 实现 7-Tab 底部 Dock 导航（3+1+3 对称布局，中央 Hero CTA 凸起按钮）
3. 实现 AuthProvider + ReadingLevelProvider

**验收标准**：
- [ ] 6 个 UI 组件可交互，DualText 切换阅读层级生效
- [ ] 7 个 Tab 点击切换路由，Hero CTA 点击弹出便便弹窗（当前可为占位）
- [ ] 首次访问自动进入游客模式

**输出文件**：`web/src/components/ui/*.tsx`, `web/src/components/navigation/*.tsx`, `web/src/providers/*.tsx`

---

### 💻 D04 — 认证系统（登录 + 注册 + 游客迁移）

**优先级**: P0 | **预估**: 3h | **依赖**: D01, D02

**任务内容**：
1. 实现 `POST /api/auth/send-code` + `POST /api/auth/login`（验证码登录）
2. 实现 `POST /api/auth/migrate`（游客数据迁移，5 类数据批量 INSERT，事务保护）
3. 实现 `GET/POST/PUT /api/children`（儿童档案 CRUD，age CHECK 3-10）
4. 实现登录页面 UI + 验证码输入组件（6 位数字格）
5. 实现前端 AuthProvider（JWT + 游客上下文）

**验收标准**：
- [ ] 手机号验证码登录成功 → 返回 JWT token pair
- [ ] 游客数据迁移后全部在数据库可见
- [ ] 年龄 2 或 11 创建被拒（CHECK 约束）

**输出文件**：`server/src/modules/auth/*.ts`, `server/src/modules/children/*.ts`, `web/src/pages/LoginPage.tsx`

---

### 💻 D05 — 3 层 CSS 视差花园场景

**优先级**: P0 | **预估**: 3h | **依赖**: A08 A09 A10（美工场景图层交付）

**任务内容**：
1. 实现 `GardenStage`（CSS `perspective: 1200px` 容器）
2. 实现 `ParallaxLayer`（接收 translateZ + speed 参数，3 层配置）
3. 实现 `useParallax` hook（mousemove → 各层偏移，最大位移 5% 视口宽度防晕动）
4. 实现 `useGardenScene` hook（根据 gardenStore.currentState 切换中景图层 healthy/dry/high_sugar）
5. 实现 FPS 监控 + 低端降级（FPS < 30 → 关闭视差，静态图层）

**验收标准**：
- [ ] 鼠标移动 → 3 层以不同速度偏移
- [ ] 花园状态切换 → 场景变体过渡 800ms
- [ ] `prefers-reduced-motion` → 视差停止

**输出文件**：`web/src/components/garden/GardenStage.tsx`, `web/src/components/garden/ParallaxLayer.tsx`, `web/src/hooks/useParallax.ts`, `web/src/hooks/useGardenScene.ts`

---

### 💻 D06 — Lottie 角色系统 + 食物拖拽投喂

**优先级**: P0 | **预估**: 3h | **依赖**: A01-A07（角色素材）, D05

**任务内容**：
1. 实现 `LottiePlayer`（封装 lottie-web，支持 play/stop/switch，IntersectionObserver 懒加载）
2. 实现 `Character` 组件（PNG + Lottie 动效叠加，Framer Motion 入场动画）
3. 实现 `useCharacterState` hook（根据 gardenStore 自动切换 idle/happy/worry）
4. 实现 `FoodToolbar`（底部食物选择栏，@dnd-kit `useDraggable`）
5. 实现 `DropZone`（@dnd-kit `useDroppable`）
6. 实现 `useFeedAnimation`（Framer Motion 抛物线路径，600ms ease-out）
7. 实现 `useFeedLogic`（投喂后更新水分值 + 花园状态 + 交互计数 → 3 次触发打卡 auto_done）

**验收标准**：
- [ ] 菌小园 idle 呼吸动画循环播放
- [ ] 拖拽食物 → 放入花园 → 抛物线飞行 → 水分值变化
- [ ] 投喂 3 次 → 打卡页探索花园自动完成

**输出文件**：`web/src/components/garden/LottiePlayer.tsx`, `web/src/components/garden/Character.tsx`, `web/src/components/garden/FoodToolbar.tsx`, `web/src/components/garden/DropZone.tsx`, `web/src/hooks/useCharacterState.ts`, `web/src/hooks/useFeedAnimation.ts`, `web/src/hooks/useFeedLogic.ts`

---

### 💻 D07 — 花园页面完整组装 + 环境特效

**优先级**: P0 | **预估**: 3h | **依赖**: D05, D06

**任务内容**：
1. 组装 GardenPage（Header 四槽位 + 左栏状态/影响因素 + 中央 3 层视差 + 角色 + POI + 右栏 AI 助手 + 底部工具栏）
2. 实现 `POITag`（悬浮兴趣点标签，悬停高亮 + 弹出简介）
3. 实现 `ParticleLayer`（tsParticles 花园花粉漂浮）
4. 实现 `MagnifierOverlay`（放大镜悬停效果）
5. 实现 CSS 溪流流动 + 风车旋转动画（garden-animations.css）
6. 实现 `GET/POST /api/garden/*`（花园状态 API + 行为日志 API）

**验收标准**：
- [ ] 花园页完整布局，所有坐标与 layout JSON 一致
- [ ] Header 四槽位标准：左(返回+标题) / 中(HUD) / 用户 / 控制
- [ ] 溪流持续流动、风车持续旋转、花粉漂浮粒子可见

**输出文件**：`web/src/pages/GardenPage.tsx`, `web/src/components/garden/*.tsx`, `web/src/styles/garden-animations.css`, `server/src/modules/garden/*.ts`

---

### 💻 D08 — 5 主项打卡页面

**优先级**: P0 | **预估**: 4h | **依赖**: A21（任务图标）, D02

**任务内容**：
1. 实现 5 张任务卡片（`TaskCard` ×5）：探索花园(复合)/健康饮食/优质睡眠/补充水分/活力运动
2. 实现 `CompoundCard`（探索花园专用 — 展开 3 个子任务：小游戏/科普视频/常识问答，问答常驻未锁定）
3. 实现打卡后端 API（`GET today`, `POST confirm-task`, `POST makeup`）
4. 实现打卡日历（`CheckinCalendar`：月视图 + 补签入口 ≤3 次/月 + 今日高亮）
5. 实现今日奖励组件（`TodayRewards`：4 个掉落物图标 + 浮动动画）
6. 实现打卡庆祝弹窗（`CelebrationModal`：Lottie + 连续天数 + XP）
7. 实现正向强化连续天数计算（取历史最高，中断不惩罚）
8. 实现 `GET/POST /api/checkin/*` 全部接口

**验收标准**：
- [ ] 5 张卡片按 layout JSON 坐标精确定位
- [ ] 探索花园卡片展开 3 个子任务，常识问答始终可点击
- [ ] 全部 5 项完成 → 庆祝弹窗出现
- [ ] 连续中断不标红，最高记录保留
- [ ] 补签 ≤3 次/月，第 4 次被拒绝

**输出文件**：`web/src/pages/CheckinPage.tsx`, `web/src/components/checkin/*.tsx`, `server/src/modules/checkin/*.ts`

---

### 💻 D09 — 便便记录双模式 + 报告联动

**优先级**: P0 | **预估**: 3h | **依赖**: A13（便便图标）, D08

**任务内容**：
1. 实现 `StoolRecordModal`（全局弹窗：默认图标选择 + 注册用户可选拍照上传）
2. 实现 `StoolIconSelector`（7 种便便图标展示，选中态高亮）
3. 实现 `StoolUpload`（拖拽上传 + 预览 + 进度 + 游客引导注册）
4. 实现便便报告联动机制（3 层：banner/卡片文案/确认提醒）
5. 实现后端 API（`POST select-icon`, `POST upload`, `GET analysis/:id`, `GET latest`）
6. 实现布里斯托 7 型预设文案映射

**验收标准**：
- [ ] 选择 Type 4 图标 → 记录成功 → 打卡页 banner 显示 "非常健康！"
- [ ] 拍照上传 → 分析中 → 结果展示（bristol_type + diagnosis）
- [ ] 便便分析后 task_eat/task_water 卡片文案联动更新
- [ ] 结果 3 天过期后自动恢复默认文案

**输出文件**：`web/src/components/stool/*.tsx`, `server/src/modules/stool/*.ts`

---

### 💻 D10 — 探索课堂页面

**优先级**: P0 | **预估**: 4h | **依赖**: A15（知识卡片插画）

**任务内容**：
1. 实现 `ModuleFlowPath`（S 型路径地图 + 5 个 `MapWaypoint` 模块节点 + 进度环 + 星级收集度）
2. 实现 `KnowledgeCard`（CSS 3D 翻转 + 双阅读层级 + "给家长的注释" 折叠）
3. 实现 `QuizModal`（3 种题型：单选题/配对题/排序题 + 正确/错误动画反馈）
4. 实现课堂后端 API（`GET modules`, `GET modules/:code/cards`, `POST quiz/answer`）
5. 实现 `AICompanionWidget` + `QuickFAQList` + `RecommendationList`（右侧伴学面板）
6. 实现 `MilestoneRewardTrack`（底部宝箱进度条）

**验收标准**：
- [ ] 5 个模块节点 S 型排列，已解锁可点击，未解锁灰度+🔒
- [ ] 知识卡片 600ms 3D 翻转 → 背面双阅读层级
- [ ] 单选题选对→绿色+星星特效，选错→红色+正确答案
- [ ] 配对题/排序题交互正确

**输出文件**：`web/src/pages/ClassroomPage.tsx`, `web/src/components/classroom/*.tsx`, `server/src/modules/classroom/*.ts`

---

### 💻 D11 — AI 导览（SSE 流式 + FAQ 兜底）

**优先级**: P0 | **预估**: 3h | **依赖**: D01

**任务内容**：
1. 实现 `POST /api/ai/chat`（SSE 流式 + 7 条风格指南注入 system prompt）
2. 实现 `GET /api/ai/faq`（预设 FAQ 列表 10 个常见问题）
3. 实现错误降级：AI API 不可用 → 自动匹配 FAQ → 返回静态答案
4. 实现 `AISidebar`（菌小园待机 + 快捷提问 + 今日观察 + 场景自适应 FAQ 列表）
5. 实现 `AIChatbot`（全屏聊天窗口 + SSE 逐字渲染 + 建议标签引导 + 对话历史）

**验收标准**：
- [ ] SSE 流式逐字返回（菌小园语气，≤80 字/条）
- [ ] AI 不可用时自动切换 FAQ 模式，不报错
- [ ] 首页/花园/课堂切换时快捷提问列表变化

**输出文件**：`server/src/modules/ai/ai.routes.ts`, `server/src/config/ai-style-guide.ts`, `server/src/config/faq-presets.json`, `web/src/components/ai/*.tsx`

---

### 💻 D12 — 徽章系统 + 花园 6 阶段成长

**优先级**: P0 | **预估**: 4h | **依赖**: A17 A18 A27（徽章图标+边框）, D08

**任务内容**：
1. 实现事件驱动徽章条件引擎（11 种条件类型，event_id 防重，正向强化取历史最高）
2. 实现徽章升级逻辑（铜→银→金，保留低级记录，garden_xp 累积）
3. 将徽章检测钩子挂载到所有触发事件点（打卡/花园行为/问答/便便记录/模块完成）
4. 实现花园 6 阶段成长系统（经验值曲线 + 阶段升级条件 + 解锁触发）
5. 实现徽章页面（`BadgeShelf` ×4 分类木质陈列架 + 两层分离渲染 + 横向滑动）
6. 实现 `BadgeRevealModal`（新徽章揭晓全屏动画）
7. 实现 `GardenStageBar`（6 阶段横向进度条）
8. 实现后端 API（`GET awarded`, `GET pending`, `GET defs`）

**验收标准**：
- [ ] 首次打卡 → 自动获得 "初来乍到" 徽章
- [ ] 徽章图标 + 边框 CSS 叠加正确
- [ ] 累计 7 天打卡 → "一周之星" 铜徽章 + garden_xp +20
- [ ] 满足 6 阶段升级条件 → 自动升级 + 解锁功能

**输出文件**：`server/src/modules/badges/*.ts`, `server/src/modules/garden/garden-stage.service.ts`, `web/src/pages/BadgePage.tsx`, `web/src/components/badges/*.tsx`

---

### 💻 D13 — 成长报告 + 首页 + 设置 + 我的主页 + 新用户引导

**优先级**: P0 | **预估**: 6h | **依赖**: 前面所有模块

**任务内容**：
1. **成长报告**：`GET /api/report/weekly` + `GET /api/report/monthly`（12 指标快照）+ ReportPage（4 维度 12 MetricCard + 周/月切换 + 无数据降级引导）
2. **首页**：HomePage（金刚区 4 按钮 + 菌小园角色 CTA + 左侧任务摘要 + 右侧 AI 面板 + 底部 6 阶段进度条）
3. **设置**：SettingsPage（儿童档案编辑 + 时长限制滑块 + 隐私偏好 + 退出登录）
4. **我的主页**：ProfilePage（成就统计 + 历史记录 Tab + 当前目标进度）
5. **新用户引导**：OnboardingOverlay（4 步遮罩 + 高亮区域 + localStorage 完成标记）
6. **每日 cron**：凌晨重置 + 过期便便清理 + 报告快照生成

**验收标准**：
- [ ] 首页完整布局与 layout JSON 一致
- [ ] 报告页 4 维度 12 指标，无数据时显示引导
- [ ] 引导遮罩首次访问出现，完成/跳过后不再出现
- [ ] 设置页编辑档案 → 保存 → 后端更新

**输出文件**：`web/src/pages/*.tsx`（首页/报告/设置/主页）, `web/src/components/home/*.tsx`, `web/src/components/report/*.tsx`, `web/src/components/settings/*.tsx`, `web/src/components/profile/*.tsx`, `web/src/components/onboarding/*.tsx`, `server/src/modules/report/*.ts`, `server/src/cron/*.ts`

---

### 💻 D14 — 集成测试 + 性能优化 + Docker 部署

**优先级**: P0 | **预估**: 4h | **依赖**: D13

**任务内容**：
1. E2E 全流程测试（游客浏览→投喂→打卡→便便→注册→数据迁移→课堂→徽章→报告，14 步）
2. 异常/边界场景全覆盖（12 项）
3. 性能优化（Lottie 懒加载、场景预加载、CSS GPU 合成层、路由懒加载）
4. 低端降级（FPS < 30 → 静态模式，`prefers-reduced-motion` 支持）
5. 装饰密度梯度实现（4 级：高/中/低/极低，页面切换过渡 300ms）
6. Docker Compose（web + server + postgres + nginx）+ Nginx 配置（gzip + API 代理 + SSE 长连接 + SPA fallback）

**验收标准**：
- [ ] E2E 14 步全部通过
- [ ] Lighthouse 性能 ≥ 80
- [ ] 花园 FPS ≥ 30
- [ ] `docker compose up -d` → `curl http://localhost` 返回首页
- [ ] 无 JS 报错

**输出文件**：`web/e2e/`, `docker-compose.yml`, `nginx.conf`, `web/src/lib/assetLoader.ts`, `web/src/lib/performanceDetector.ts`

---

## 美工交付里程碑

| 里程碑 | 截止 | 包含任务 | 素材数 |
|--------|------|----------|--------|
| **M1 — 核心角色+场景** | D3 | A01-A12 | ~18 项 |
| **M2 — 便便+食物+卡片+UI** | D5 | A13-A23 | ~45 项 |
| **M3 — 剩余角色+徽章+场景** | D7 | A24-A30 | ~60 项 |
| **总计** | D7 | | **123 项** |

## 工程师交付里程碑

| 里程碑 | 截止 | 包含任务 | 功能 |
|--------|------|----------|------|
| **M1 — 脚手架+花园** | D2 | D01-D07 | 项目跑起来，花园可浏览交互 |
| **M2 — 打卡+便便** | D3 | D08-D09 | 5 卡片打卡闭环，便便双模式 |
| **M3 — 课堂+AI** | D4 | D10-D11 | 知识学习+AI 对话 |
| **M4 — 徽章+成长** | D5 | D12 | 徽章引擎+6 阶段 |
| **M5 — 全部页面** | D6 | D13 | 首页/报告/设置/主页/引导 |
| **M6 — 测试+部署** | D7 | D14 | MVP Release |

---

> **看板同步说明**: 将此文件中的每个 `### 🎨` 和 `### 💻` 卡片作为 GitHub Issue 创建，标签用 `art` / `dev`，Milestone 用 M1-M6，即可在 GitHub Projects 中形成完整看板。
