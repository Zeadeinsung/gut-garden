"""
ComfyUI Custom Node: Bailian Wan Video Generation
通过阿里云百炼 DashScope API 调用 Wan2.7 文生视频/图生视频

安装依赖: pip install dashscope
API Key 设置: 环境变量 DASHSCOPE_API_KEY 或在节点中输入
"""

import os
import time
import json
import tempfile
import shutil
import numpy as np
from pathlib import Path
from PIL import Image

try:
    import dashscope
    from dashscope import VideoGeneration
except ImportError:
    raise ImportError("请先安装 dashscope: pip install dashscope")


# ============================================================
# 可用模型列表
# ============================================================
T2V_MODELS = [
    "wan2.7-t2v-2026-06-12",   # Wan2.7 文生视频 (推荐, 1080P 有声)
    "wan2.6-t2v",               # Wan2.6 文生视频
    "happyhorse-1.1-t2v",       # HappyHorse 文生视频 (1080P 有声)
]

I2V_MODELS = [
    "wan2.7-i2v-2026-04-25",   # Wan2.7 图生视频 (推荐, 1080P 有声)
    "wan2.6-i2v",               # Wan2.6 图生视频
    "happyhorse-1.1-i2v",       # HappyHorse 图生视频
]

RESOLUTIONS = [
    "1080p:1920x1080",
    "720p:1280x720",
]

DURATIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]


# ============================================================
# 工具函数
# ============================================================

def get_api_key(api_key_input=""):
    """优先使用节点输入的 key，否则读环境变量"""
    key = api_key_input.strip() if api_key_input else os.getenv("DASHSCOPE_API_KEY", "")
    if not key:
        raise ValueError(
            "请设置百炼 API Key:\n"
            "  方法1: 设置环境变量 DASHSCOPE_API_KEY\n"
            "  方法2: 在节点 api_key 参数中直接输入\n"
            "  获取 Key: https://bailian.console.aliyun.com/"
        )
    return key


def submit_video_task(api_key, model, prompt, negative_prompt="", duration=5,
                      resolution="1080p:1920x1080", seed=None, image_url=None):
    """提交视频生成任务，返回 task_id"""
    resolution_parts = resolution.split(":")
    size = resolution_parts[1] if len(resolution_parts) > 1 else "1920x1080"

    params = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "duration": duration,
        "api_key": api_key,
    }

    if negative_prompt:
        params["negative_prompt"] = negative_prompt

    if seed is not None and seed > 0:
        params["seed"] = seed

    if image_url:
        params["image_url"] = image_url

    response = VideoGeneration.async_call(**params)

    if response.status_code != 200:
        raise RuntimeError(
            f"API 调用失败 (HTTP {response.status_code}):\n"
            f"  code={response.code}, message={response.message}"
        )

    return response.output.task_id


def poll_task(api_key, task_id, model, poll_interval=5, timeout=600):
    """轮询任务状态，返回视频 URL"""
    start = time.time()
    last_status = ""

    while True:
        elapsed = time.time() - start
        if elapsed > timeout:
            raise TimeoutError(f"任务 {task_id} 超时 ({timeout}秒)")

        result = VideoGeneration.async_fetch(task_id=task_id, api_key=api_key, model=model)

        if result.status_code != 200:
            raise RuntimeError(f"查询任务失败: {result.message}")

        status = result.output.task_status
        if status != last_status:
            print(f"[BailianWan] 状态: {status}")
            last_status = status

        if status == "SUCCEEDED":
            video_url = result.output.video_url
            print(f"[BailianWan] 生成完成: {video_url[:80]}...")
            return video_url

        elif status == "FAILED":
            raise RuntimeError(f"任务失败: {result.output.message}")

        elif status == "CANCELED":
            raise RuntimeError("任务被取消")

        time.sleep(poll_interval)


def download_video(video_url, output_dir):
    """下载视频到本地目录"""
    import urllib.request

    os.makedirs(output_dir, exist_ok=True)

    filename = f"wan_{int(time.time())}.mp4"
    filepath = os.path.join(output_dir, filename)

    print(f"[BailianWan] 下载视频到 {filepath}...")
    urllib.request.urlretrieve(video_url, filepath)
    print(f"[BailianWan] 下载完成: {filepath}")

    return filepath


def video_to_preview_frames(video_path, max_frames=8):
    """提取视频帧作为预览图 (返回 numpy array batch)"""
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            cap.release()
            return None

        indices = np.linspace(0, total_frames - 1, min(max_frames, total_frames), dtype=int)
        frames = []
        for i in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if ret:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb.astype(np.float32) / 255.0)
        cap.release()

        if frames:
            return np.stack(frames, axis=0)
        return None
    except ImportError:
        return None


# ============================================================
# 自定义节点 1: BailianWan T2V (文生视频)
# ============================================================

class BailianWanT2V:
    """
    百炼 Wan2.7 文生视频节点
    输入提示词 → 调用百炼 API → 输出视频
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "prompt": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "描述你想要的视频画面和动态..."
                }),
                "model": (T2V_MODELS, {"default": T2V_MODELS[0]}),
                "duration_sec": ("INT", {"default": 5, "min": 3, "max": 15, "step": 1}),
                "resolution": (RESOLUTIONS, {"default": RESOLUTIONS[0]}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 2147483647, "step": 1,
                                  "tooltip": "相同 seed 保持风格一致, 0=随机"}),
            },
            "optional": {
                "api_key": ("STRING", {
                    "multiline": False,
                    "default": "",
                    "placeholder": "留空则使用环境变量 DASHSCOPE_API_KEY"
                }),
                "negative_prompt": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "不想要的元素..."
                }),
            },
            "hidden": {
                "prompt_id": "UNIQUE_ID",
            }
        }

    RETURN_TYPES = ("STRING", "IMAGE")
    RETURN_NAMES = ("video_path", "preview")
    OUTPUT_NODE = True
    FUNCTION = "generate"
    CATEGORY = "BailianWan"

    def generate(self, prompt, model, duration_sec, resolution, seed,
                 api_key="", negative_prompt="", prompt_id=None):
        if not prompt.strip():
            raise ValueError("提示词不能为空")

        api_key = get_api_key(api_key)
        print(f"\n{'='*60}")
        print(f"[BailianWan T2V] 提交文生视频任务")
        print(f"  模型: {model}")
        print(f"  时长: {duration_sec}s")
        print(f"  分辨率: {resolution}")
        print(f"  提示词: {prompt[:100]}...")
        print(f"{'='*60}\n")

        # 提交任务
        task_id = submit_video_task(
            api_key=api_key,
            model=model,
            prompt=prompt,
            negative_prompt=negative_prompt,
            duration=duration_sec,
            resolution=resolution,
            seed=seed if seed > 0 else None,
        )
        print(f"[BailianWan] 任务已提交: {task_id}")

        # 轮询等待
        video_url = poll_task(api_key, task_id, model)

        # 下载到本地
        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "output")
        output_dir = os.path.abspath(output_dir)
        video_path = download_video(video_url, output_dir)

        # 提取预览帧
        preview = video_to_preview_frames(video_path)
        if preview is None:
            preview = np.zeros((1, 512, 512, 3), dtype=np.float32)

        print(f"[BailianWan] ✅ 完成! {video_path}\n")
        return (video_path, preview)


# ============================================================
# 自定义节点 2: BailianWan I2V (图生视频)
# ============================================================

class BailianWanI2V:
    """
    百炼 Wan2.7 图生视频节点
    输入关键帧图片 + 提示词 → 调用百炼 API → 输出视频
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "prompt": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "描述希望的动态变化..."
                }),
                "model": (I2V_MODELS, {"default": I2V_MODELS[0]}),
                "duration_sec": ("INT", {"default": 5, "min": 3, "max": 15, "step": 1}),
                "motion_strength": ("FLOAT", {
                    "default": 0.5, "min": 0.0, "max": 1.0, "step": 0.05,
                    "tooltip": "动态幅度: 0=几乎静止, 1=大幅运动"
                }),
            },
            "optional": {
                "api_key": ("STRING", {
                    "multiline": False,
                    "default": "",
                    "placeholder": "留空则使用环境变量 DASHSCOPE_API_KEY"
                }),
                "negative_prompt": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "不想要的元素..."
                }),
            },
            "hidden": {
                "prompt_id": "UNIQUE_ID",
            }
        }

    RETURN_TYPES = ("STRING", "IMAGE")
    RETURN_NAMES = ("video_path", "preview")
    OUTPUT_NODE = True
    FUNCTION = "generate"
    CATEGORY = "BailianWan"

    def generate(self, image, prompt, model, duration_sec, motion_strength,
                 api_key="", negative_prompt="", prompt_id=None):
        if not prompt.strip():
            raise ValueError("提示词不能为空")

        api_key = get_api_key(api_key)

        # 将 ComfyUI IMAGE tensor 保存为临时 PNG 并转为可访问的 URL
        # ComfyUI 的 IMAGE 格式: [B, H, W, C], float32, range [0,1]
        img_np = (image[0].cpu().numpy() * 255).astype(np.uint8)
        pil_img = Image.fromarray(img_np)

        # 保存到临时目录（百炼 API 需要可访问的 URL，这里我们假设
        # 用户已配置 OSS 或使用内网上传。在实际使用中，推荐先用
        # 本地 keyframe → 上传 OSS → 传 URL 给 API）
        temp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "keyframes")
        temp_dir = os.path.abspath(temp_dir)
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"keyframe_{int(time.time())}.png")
        pil_img.save(temp_path)
        print(f"[BailianWan I2V] 关键帧已保存: {temp_path}")
        print(f"[BailianWan I2V] ⚠️ 图生视频需要将图片上传到 OSS 后提供 URL")
        print(f"[BailianWan I2V] 当前暂不支持自动上传 OSS，请手动上传后使用")

        # 注意: Bailian I2V API 需要 image_url 参数
        # 这里先抛出友好提示，后续可以集成 OSS 上传
        raise NotImplementedError(
            "图生视频需要将关键帧图片上传到 OSS 并提供 URL。\n"
            f"关键帧已保存到: {temp_path}\n"
            "请你将该图片上传到 OSS，然后使用文生视频节点并在提示词中描述动态。\n"
            "或者等待我们集成 OSS 自动上传功能。\n"
            "\n"
            "临时方案：使用文生视频 (T2V) 节点，在提示词中详细描述画面。"
        )


# ============================================================
# 自定义节点 3: Bailian Prompt Preset (快捷提示词)
# ============================================================

class BailianPromptPreset:
    """
    预设提示词加载器 — 从 scene_prompts.json 中加载指定场景的提示词
    一键填入完整提示词，自动拼接风格前缀和负向词
    """

    @classmethod
    def INPUT_TYPES(cls):
        presets_file = os.path.join(os.path.dirname(__file__), "..", "scene_prompts.json")
        scene_choices = ["custom"]

        if os.path.exists(presets_file):
            try:
                with open(presets_file, "r", encoding="utf-8") as f:
                    config = json.load(f)
                for act in config.get("scenes", []):
                    for shot in act.get("shots", []):
                        if shot.get("type") != "screen_record" and shot.get("prompt"):
                            label = f"[Act{shot['act']}] {shot['description'][:40]}"
                            scene_choices.append(f"{shot['id']}|{label}")
            except Exception:
                pass

        return {
            "required": {
                "scene": (scene_choices, {"default": "custom"}),
            },
            "optional": {
                "custom_prompt": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "placeholder": "场景=自定义时在此输入提示词..."
                }),
            }
        }

    RETURN_TYPES = ("STRING", "STRING", "INT")
    RETURN_NAMES = ("prompt", "negative_prompt", "duration_sec")
    FUNCTION = "load"
    CATEGORY = "BailianWan"

    def load(self, scene, custom_prompt=""):
        if scene == "custom":
            return (custom_prompt, "", 5)

        scene_id = scene.split("|")[0]
        presets_file = os.path.join(os.path.dirname(__file__), "..", "scene_prompts.json")

        with open(presets_file, "r", encoding="utf-8") as f:
            config = json.load(f)

        common_prefix = config.get("common_prefix", "")
        common_negative = config.get("common_negative", "")

        for act in config.get("scenes", []):
            for shot in act.get("shots", []):
                if shot["id"] == scene_id:
                    full_prompt = f"{common_prefix}. {shot['prompt']}"
                    neg = shot.get("negative_prompt", common_negative)
                    dur = shot.get("duration_sec", 5)
                    return (full_prompt, neg, dur)

        return (custom_prompt, "", 5)


# ============================================================
# 节点映射 (ComfyUI 发现机制)
# ============================================================

NODE_CLASS_MAPPINGS = {
    "BailianWanT2V": BailianWanT2V,
    "BailianWanI2V": BailianWanI2V,
    "BailianPromptPreset": BailianPromptPreset,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "BailianWanT2V": "Bailian Wan T2V (百炼文生视频)",
    "BailianWanI2V": "Bailian Wan I2V (百炼图生视频)",
    "BailianPromptPreset": "Bailian Prompt Preset (场景预设)",
}
