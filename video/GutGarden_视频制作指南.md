# 肠道花园宣传视频 — ComfyUI 制作指南

> **平台**: 阿里云百炼 ComfyUI
> **视频时长**: ~90 秒
> **目标风格**: 3D 玩具粘土 + 绒布质感，粉/蓝/绿色调，子供向卡通

---

## 一、前置准备

### 1.1 模型推荐（百炼平台可用）

| 用途 | 推荐模型 | 说明 |
|------|---------|------|
| 文生图（关键帧） | FLUX.1-dev / SDXL | 生成高质量关键帧，风格控制强 |
| 图生视频 | AnimateDiff / SVD (Stable Video Diffusion) | 图片转短视频片段 |
| 风格控制 | IP-Adapter + 风格参考图 | 保持角色和场景一致性 |
| 放大 | 4x-UltraSharp / R-ESRGAN | 关键帧超分辨率 |

### 1.2 风格参考（必须准备）

在开始生成前，收集 5-10 张风格参考图，关键词：
- **粘土质感**: polymer clay art, stop motion style, claymation
- **绒布质感**: felt texture, plush toy, soft fabric material
- **色调参考**: pastel pink blue green, soft warm lighting, children's illustration

将参考图上传到百炼，用于 IP-Adapter 的风格注入。

### 1.3 画幅与帧率

- 画幅: **1920×1080** (横屏 16:9)
- 帧率: **24fps**
- 每段视频: 2-3 秒（共约 30-40 个镜头片段）
- 最终由各片段拼接 + 后期配音

---

## 二、通用 Prompt 模板

所有镜头的通用前缀和后缀，确保风格一致：

**正向提示词前缀:**
```
(claymation style:1.3), (polymer clay texture:1.2), (stop motion aesthetic:1.1),
soft felt fabric texture, cute cartoon, children's book illustration,
warm soft lighting, pastel colors, pink blue green palette,
3D rendered, Cinema 4D style, adorable character design,
shallow depth of field, macro photography,
```

**负向提示词:**
```
photorealistic, hyper-realistic, dark, horror, scary, sharp edges,
metallic, glossy, cold lighting, neon, adult, complex background,
text, watermark, signature, low quality, blurry, distorted,
```

---

## 三、分镜脚本 + 生成方案

---

### 第一幕：看不见的世界（0–10 秒）

#### 镜头 1.1 — 餐桌俯拍（0–4 秒）
- **画面**: 普通人吃燕麦/豆类/水果，明亮温馨的厨房餐桌
- **生成方式**: 文生图 → 图生视频（慢速推镜 zoom in）
- **Prompt**:
```
A cute claymation top-down view of a breakfast table with a bowl of oatmeal,
fresh berries, sliced banana, and a glass of water. Warm morning sunlight
from window. Soft felt placemat texture. Polymer clay food items with
rounded edges. Pastel color palette. Cozy kitchen atmosphere.
```
- **视频动效**: 从静止画面开始，缓慢 zoom in ×1.1 倍，持续 4 秒

#### 镜头 1.2 — 镜头推进人体内部（4–10 秒）
- **画面**: 镜头从口腔向下沉入食道，进入温暖的粉色通道
- **生成方式**: 两张关键帧 → 过渡动画
- **关键帧 A Prompt**:
```
Inside a cute cartoon mouth, soft pink cave-like entrance, rounded teeth
like marshmallows, warm lighting from deep inside, clay texture walls,
child-friendly anatomy style, no scary details.
```
- **关键帧 B Prompt**:
```
A magical tunnel made of soft pink folded fabric, warm glowing light at
the end, fiber particles floating like tiny stars, cotton candy texture
walls, gentle peristaltic wave patterns, journey inward feeling.
```
- **视频动效**: A→B 过渡 + 缓慢推进

---

### 第二幕：进入肠道花园（10–25 秒）

#### 镜头 2.1 — 肠道花园全景（10–16 秒）
- **画面**: 穿过通道后眼前豁然开朗，绚丽温暖的肠道花园
- **生成方式**: 文生图（全景关键帧）→ 图生视频（缓慢右摇 pan right）
- **Prompt**:
```
A magnificent cute garden inside an intestine, pink folded walls like
rolling hills, a winding blue stream flowing through, mushroom houses with
tiny windmills, soft felt trees, fluffy clouds in pastel sky, warm golden
sunlight, polymer clay buildings and landscape, miniature world, childlike
wonder, Cinematic wide shot, establishing shot.
```
- **画幅**: 可生成 2432×1080 宽幅用于平移

#### 镜头 2.2 — 食物种子落入广场（16–19 秒）
- **画面**: 食物颗粒化作「纤纤种子」角色，飘落至花园中央小广场
- **生成方式**: 分层生成（背景 + 角色）→ 合成
- **背景 Prompt**: 同 2.1 的中央广场区域特写
- **角色 Prompt**:
```
A cute tiny seed character with soft green leaves as hair, round body made
of felt fabric, small sparkly eyes, floating downward gently, parachuting
with a tiny leaf, polymer clay toy style, isolated on transparent background,
character design sheet style, multiple angles.
```

#### 镜头 2.3 — 菌小园出场挥手（19–22 秒）
- **画面**: 菌小园从蘑菇房旁跃出，挥舞科学灯，微笑
- **角色 Prompt**:
```
A cute mushroom fairy guide character named "Jun Xiaoyuan", round chubby
body, wearing a tiny lab coat made of felt, holding a glowing science lamp
on a wand, soft pink and cream colors, friendly smile, waving excitedly,
polymer clay stop motion style, isolated character on plain background.
```
- **视频**: 角色单独生成 → 后期合成到场景中

#### 镜头 2.4 — 花园地图亮起（22–25 秒）
- **画面**: 俯瞰花园，地图上各区域逐一亮起（酸酸温泉 → 绒毛平原 → 发酵工坊 → 回收营地）
- **生成方式**: 一张大地图 + 后期用蒙版逐帧点亮
- **Prompt**:
```
A cute treasure map of a garden inside intestines, top-down view,
illustrated with soft colors, marked zones: hot spring at top (pink),
fuzzy plains in middle (light green), workshop area (golden), recycling
camp at bottom (brown), dotted path connecting them, cartoon map markers,
felt fabric border, storybook illustration style.
```

---

### 第三幕：一粒纤维的旅程（25–45 秒）

#### 镜头 3.1 — 纤纤种子进入发酵工坊（25–30 秒）
- **画面**: 纤纤种子顺流而下，漂入发酵工坊区域。工坊由带风车的蘑菇房组成，管道连接
- **Prompt**:
```
A cute claymation workshop inside a garden, mushroom houses with spinning
windmills on top, connected by soft tubes like play-doh pipes, a blue stream
flows through carrying a tiny green seed, warm amber lighting, steam puffs
from chimneys like cotton balls, busy microbe workers made of felt, cozy
industrial fantasy, children's book aesthetic.
```

#### 镜头 3.2 — 发酵工匠工作，泡泡产生（30–35 秒）
- **画面**: 发酵工匠（微生物角色）忙碌工作，泡泡产生
- **Prompt**:
```
Cute microbe worker characters in a workshop, round chubby felt bodies
with tiny hard hats, stirring a big cauldron that bubbles, colorful foam
bubbles floating up - golden, orange, purple, soft bioluminescent glow,
polymer clay tools and equipment, warm magical atmosphere, macro close-up
on the cauldron.
```

#### 镜头 3.3 — 丁丁泉灵出现，泉水流动（35–40 秒）
- **画面**: 金色/橙色/紫色的泉水从管道流出，形成小溪，丁丁泉灵（水精灵）跃出
- **Prompt**:
```
A magical spring of glowing golden orange and purple liquid flowing from
a mushroom pipe into a stream, a cute water sprite character made of
transparent blue felt with sparkles inside, jumping joyfully out of the
water, crystal clear stream with golden particles, magical whimsical
atmosphere, soft focus on water surface.
```

#### 镜头 3.4 — 河流流向肠道城墙（40–45 秒）
- **画面**: 泉水河流蜿蜒流向远处的城墙（肠道屏障），屏障守卫站岗
- **Prompt**:
```
A winding golden stream flowing toward a castle wall made of pink blocks
like building bricks, cute guard characters standing on the wall with
shields that glow with golden light, soft felt castle architecture,
protective warm feeling, the stream flows through a gate in the wall,
cinematic landscape shot.
```

---

### 第四幕：花园也会变化（45–58 秒）

这一幕用**同一构图 + 不同状态**来表现变化，是 ComfyUI 的强项（img2img + prompt 变化）

#### 基础构图（所有变体共用）
先用镜头 2.1 的全景图作为**基础图**，然后做 img2img 变体：

#### 变体 A — 饮食单一（45–48 秒）
- **变化**: 植物减少，颜色变灰暗
- **生成**: 基础图 + img2img(denoise 0.4-0.6)
- **Prompt addition**: `fewer plants, wilting flowers, muted colors, less vibrant, slightly gray tone, some empty patches in garden`

#### 变体 B — 熬夜/压力（48–51 秒）
- **变化**: 天空变暗，乌云出现
- **Prompt addition**: `dark clouds gathering, tired drooping plants, dim lighting, crescent moon replacing sun, sleepy atmosphere, dark blue gray sky`

#### 变体 C — 抗生素短期风暴（51–54 秒）
- **变化**: 局部雷雨，部分区域受影响但可控
- **Prompt addition**: `small localized rainstorm in one corner of garden, gentle rain, some microbes hiding under mushroom umbrellas, but garden mostly intact, temporary weather passing through`

#### 变体 D — 多样饮食 + 规律生活（54–58 秒）
- **变化**: 阳光回归，花园恢复活力，比基础图更美
- **Prompt addition**: `rainbow after rain, flowers blooming everywhere, extra vibrant colors, golden sunshine, garden at its most beautiful, butterflies, sparkles in the air, celebration atmosphere`

---

### 第五幕：AI 导览与互动网页（58–75 秒）

这一幕从动画切换到**真实网页录屏**，不需要 AI 生成。
- 用 OBS 录制 Gut Garden Web 的实际操作
- 路径: 点击地图 → 拖拽食物 → AI 对话 → 科学卡片弹出

---

### 第六幕：结尾（75–90 秒）

#### 镜头 6.1 — 花园全景 + 角色看向镜头（75–82 秒）
- **画面**: 所有主要角色聚集在花园中，微笑看向镜头
- **Prompt**:
```
All cute characters gathered together in the garden for a group photo,
mushroom fairy guide in center holding science lamp, seed character on
left, water sprite floating on right, worker microbes in front, guard
characters in back, all waving and smiling at camera, warm golden hour
lighting, soft clay and felt textures, pastel colors, heartwarming scene,
cinematic wide shot.
```

#### 镜头 6.2 — 拉远回到餐桌（82–90 秒）
- **画面**: 镜头从花园拉远，穿过层层画面，回到现实餐桌
- **生成方式**: 这是一个反向的镜头 1.2，可以从花园关键帧做反向 zoom out
- **最终定格 Prompt**:
```
Same breakfast table from the beginning, but now with a warm understanding
glow, the bowl of oatmeal, fresh fruits and vegetables arranged beautifully,
sunlight streaming through window, claymation style, cozy and inviting,
full circle moment, satisfying conclusion.
```

---

## 四、ComfyUI 工作流建议

### 4.1 关键帧生成工作流（文生图）

```
[Load Checkpoint: FLUX.1-dev]
    ↓
[CLIP Text Encode: 正向Prompt]
    ↓
[CLIP Text Encode: 负向Prompt]
    ↓
[KSampler: steps=30, cfg=7, sampler=dpmpp_2m, scheduler=karras]
    ↓
[VAE Decode]
    ↓
[Save Image / Preview]
```

### 4.2 图生视频工作流（关键帧 → 短视频）

```
[Load Image: 关键帧]
    ↓
[Load Checkpoint: SVD img2vid 或 AnimateDiff]
    ↓
[Video Linear CFG Guidance]
    ↓
[SVD Sampler: frames=48-72 (2-3秒), motion_bucket_id=40-80]
    ↓
[Save Video / Preview]
```

### 4.3 风格一致性保持工作流

```
[Load Style Reference Image(s)]
    ↓
[IP-Adapter: style injection]
    ↓
[Load Checkpoint]
    ↓
[CLIP Text Encode]
    ↓
[KSampler + IP-Adapter conditioning]
    ↓
[VAE Decode]
```

### 4.4 角色一致性技巧

1. **先出角色设定图**: 每个主要角色先生成 4-6 张不同角度的设定图
2. **用 IP-Adapter Face ID**: 后续角色出现时，把设定图注入 IP-Adapter 保持长相一致
3. **固定 seed 范围**: 同角色同场景用相邻 seed 值（如 seed=42, 43, 44）

---

## 五、后期制作清单

| 步骤 | 工具 | 说明 |
|------|------|------|
| 视频剪辑 | 剪映 / DaVinci Resolve | 拼接 ~35 个片段，加转场 |
| 中文字幕 | 剪映 自动字幕 | 匹配脚本字幕时间点 |
| 音效 | 剪映 音效库 / Artlist | 气泡声、泉水声、翻书声等 |
| 旁白配音 | 剪映 TTS / 专业配音 | 温柔女声，子供向语速 |
| 背景音乐 | 轻快管弦/木琴小曲 | 持续贯穿全片 |
| 后期调色 | DaVinci Resolve | 统一色调，提亮粉蓝绿 |

---

## 六、时间估算

| 阶段 | 工作量 | 预估时间 |
|------|--------|----------|
| 风格测试 + Prompt 调优 | 生成 20-30 张测试图 | 1-2 天 |
| 关键帧生成 | ~40 张关键帧 | 2-3 天 |
| 图生视频 | ~35 个视频片段 | 2-3 天 |
| 后期剪辑 + 音效字幕 | 完整后期流程 | 3-5 天 |
| **合计** | | **8-13 天**（单人） |

---

## 七、注意事项

1. **百炼 ComfyUI 配额**: 视频生成消耗大量 GPU 资源，确认账户余额和并发限制
2. **一致性 > 完美**: 不要追求每帧都完美，整体风格统一、角色可辨识即可
3. **优先出角色设定**: 角色定型后再做场景，否则后面返工成本高
4. **分段迭代**: 先完成第一幕做全流程验证，再铺开做后续
5. **备份工作流**: 每个成功的 ComfyUI 工作流导出 JSON 备份
