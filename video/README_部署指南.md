# 本地 ComfyUI + 百炼 API 部署指南

## 架构

```
┌─────────────────────────────────────────────────────┐
│  你的 Windows 电脑                                    │
│  ┌───────────────┐    ┌──────────────────────────┐  │
│  │ ComfyUI       │    │ ComfyUI_BailianWan       │  │
│  │ (本地轻量)     │───→│ 自定义节点                │  │
│  │ 管理提示词     │    │ 调用 DashScope API        │  │
│  │ 视觉效果预览   │    │                          │  │
│  └───────────────┘    └─────────┬────────────────┘  │
│                                  │                    │
└──────────────────────────────────┼────────────────────┘
                                   │ HTTPS
                                   ▼
                    ┌─────────────────────────┐
                    │  阿里云百炼 DashScope    │
                    │  Wan2.7 模型 (云端)      │
                    │  生成视频 → 返回下载URL  │
                    └─────────────────────────┘
```

**模型全部在云端，本地零模型下载，ComfyUI 只当界面用。**

---

## 一、安装 ComfyUI (Windows)

### 方式 A: 一键安装包（推荐）

1. 下载 [ComfyUI_windows_portable](https://github.com/comfyanonymous/ComfyUI/releases)
2. 解压到 `D:\ComfyUI_windows_portable`
3. 双击 `run_nvidia_gpu.bat` (N卡) 或 `run_cpu.bat` (CPU模式)
4. 浏览器打开 `http://127.0.0.1:8188`

> **CPU 模式也能跑** — 我们只生成图片预览帧,不跑大模型,不需要 GPU。

### 方式 B: Stability Matrix（更简单）

1. 下载 [Stability Matrix](https://github.com/LykosAI/StabilityMatrix/releases)
2. 安装后一键添加 ComfyUI 包
3. 自动管理 Python 环境和依赖

---

## 二、获取百炼 API Key

1. 登录 [百炼控制台](https://bailian.console.aliyun.com/)
2. 左侧菜单 → **API-KEY 管理**
3. 创建新的 API Key，复制备用

---

## 三、安装自定义节点

### 自动化安装：
```
双击运行 video/ComfyUI_BailianWan/install.bat
按提示输入 ComfyUI 安装目录路径
```

### 手动安装：
```powershell
# 1. 安装 dashscope SDK
pip install dashscope

# 2. 复制节点文件夹到 ComfyUI custom_nodes
xcopy /e /i "D:\GutGardenBeta\video\ComfyUI_BailianWan" "D:\ComfyUI_windows_portable\ComfyUI\custom_nodes\ComfyUI_BailianWan"

# 3. 设置 API Key 环境变量
setx DASHSCOPE_API_KEY "sk-xxxxxxxxxxxxxxxx"

# 4. 重启 ComfyUI
```

---

## 四、使用流程

### 1. 启动 ComfyUI
```powershell
# 启动后浏览器打开 http://127.0.0.1:8188
```

### 2. 导入工作流
- 在 ComfyUI 界面点击 **Load** → 选择 `workflow_bailian_api.json`
- 或在右侧面板拖入该文件

### 3. 选择镜头
- 在 **Bailian Prompt Preset** 节点的下拉框中
- 选择你要生成的镜头（自动加载 scene_prompts.json 中的提示词）

### 4. 点击 Queue Prompt 生成
- 节点会自动：
  1. 拼接风格前缀到提示词
  2. 调用百炼 Wan2.7 API 提交任务
  3. 轮询等待生成完成（通常 30-90 秒）
  4. 下载视频到 `video/output/`
  5. 提取预览帧显示在 ComfyUI 中

### 5. 批量生成
逐个选择不同镜头 → 点击 Queue Prompt → 视频逐个出现在 `output/` 目录

---

## 五、成本预估

| 项目 | 单价 | 你的用量 | 费用 |
|------|------|----------|------|
| Wan2.7 T2V 1080p | 1 元/秒 | ~73 秒 | ~73 元 |
| 废片/重试 (30%) | — | ~22 秒 | ~22 元 |
| **预估总费用** | | | **~95 元** |
| 新用户免费额度 | — | — | 可抵部分 |

---

## 六、文件清单

```
video/
├── ComfyUI_BailianWan/     ← 自定义节点 (复制到 ComfyUI)
│   ├── __init__.py
│   ├── nodes.py            ← 核心: 3个节点
│   └── install.bat
├── workflow_bailian_api.json  ← ComfyUI 工作流 (导入用)
├── scene_prompts.json         ← 17个镜头的提示词
├── output/                    ← 生成视频输出
└── GutGarden_视频制作指南.md   ← 完整制作手册
```

---

## 七、三个自定义节点说明

| 节点 | 功能 |
|------|------|
| **Bailian Prompt Preset** | 下拉选择镜头号，自动加载提示词+时长 |
| **BailianWanT2V** | 文生视频：调百炼 Wan2.7 API 生成视频 |
| **BailianWanI2V** | 图生视频：传入关键帧 + API 生成 (需 OSS) |

---

## 八、常见问题

**Q: 提示 "请设置 API Key"**
A: 运行 `setx DASHSCOPE_API_KEY "你的Key"` 后**重启终端**，环境变量才生效。

**Q: 生成速度多快？**
A: 单次 5 秒视频约 30-90 秒（排队 + 生成 + 下载）。

**Q: 图生视频 (I2V) 怎么用？**
A: 需要先把关键帧上传到 OSS 获得公网 URL，然后调用 I2V API。当前 V1 版本暂不支持自动上传，建议主要用 T2V 文生视频。

**Q: 本地 ComfyUI 需要显卡吗？**
A: 不需要。我们只做提示词管理和预览，不跑任何本地模型。CPU 模式即可。
