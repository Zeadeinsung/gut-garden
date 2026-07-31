<#
.SYNOPSIS
  肠道花园宣传视频 - ComfyUI 批量生成脚本
.DESCRIPTION
  读取 scene_prompts.json,通过 ComfyUI API 逐个提交生成任务,
  自动保存生成的视频到 output/ 目录
.PARAMETER ServerUrl
  ComfyUI 服务地址 (默认 http://127.0.0.1:8188)
.PARAMETER WorkflowFile
  工作流模板 JSON 文件路径 (默认 workflow_t2v.json)
.PARAMETER PromptsFile
  场景提示词 JSON 文件路径 (默认 scene_prompts.json)
.PARAMETER StartFrom
  从指定场景 ID 开始 (用于断点续传)
.PARAMETER DryRun
  仅打印将要执行的任务,不实际提交
.PARAMETER TimeoutMinutes
  每个任务的超时时间(分钟), 默认 20
.EXAMPLE
  .\batch_generate.ps1 -DryRun
.EXAMPLE
  .\batch_generate.ps1 -StartFrom "scene_08_bubbles"
.EXAMPLE
  .\batch_generate.ps1 -ServerUrl "https://pai-artlab.aliyuncs.com/comfyui" -TimeoutMinutes 30
#>

param(
    [string]$ServerUrl = "http://127.0.0.1:8188",
    [string]$WorkflowFile = "$PSScriptRoot\workflow_t2v.json",
    [string]$PromptsFile = "$PSScriptRoot\scene_prompts.json",
    [string]$StartFrom = "",
    [switch]$DryRun = $false,
    [int]$TimeoutMinutes = 20
)

$ErrorActionPreference = "Stop"
$OutputDir = "$PSScriptRoot\output"
$KeyframesDir = "$PSScriptRoot\keyframes"

# ============================================================
# 1. 初始化
# ============================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  肠道花园视频 - ComfyUI 批量生成" -ForegroundColor Cyan
Write-Host "  Server: $ServerUrl" -ForegroundColor Cyan
Write-Host "  Output: $OutputDir" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "[OK] 创建输出目录: $OutputDir" -ForegroundColor Green
}
if (-not (Test-Path $KeyframesDir)) {
    New-Item -ItemType Directory -Path $KeyframesDir -Force | Out-Null
    Write-Host "[OK] 创建关键帧目录: $KeyframesDir" -ForegroundColor Green
}

# ============================================================
# 2. 加载配置
# ============================================================

Write-Host "[LOADING] 读取提示词文件..." -ForegroundColor Yellow
$config = Get-Content $PromptsFile -Raw -Encoding UTF8 | ConvertFrom-Json
$commonPrefix = $config.common_prefix
$commonNegative = $config.common_negative

Write-Host "[LOADING] 读取工作流模板..." -ForegroundColor Yellow
$workflow = Get-Content $WorkflowFile -Raw -Encoding UTF8 | ConvertFrom-Json

# 收集所有需要生成的场景 (只收集 type=t2v 的, screen_record 跳过)
$tasks = @()
foreach ($act in $config.scenes) {
    foreach ($shot in $act.shots) {
        if ($shot.type -eq "screen_record") {
            Write-Host "[SKIP] $($shot.id) — 需要录屏,跳过AI生成" -ForegroundColor DarkGray
            continue
        }
        $tasks += @{
            id = $shot.id
            act = $act.act
            act_title = $act.act_title
            description = $shot.description
            prompt = $shot.prompt
            frames = $shot.frames
            duration_sec = $shot.duration_sec
        }
    }
}

Write-Host ""
Write-Host "[INFO] 共 $($tasks.Count) 个任务待生成" -ForegroundColor Cyan
Write-Host ""

# 断点续传: 如果指定了 StartFrom, 跳过之前的任务
$skipMode = $false
if ($StartFrom -ne "") {
    $skipMode = $true
    Write-Host "[RESUME] 从 $StartFrom 开始..." -ForegroundColor Yellow
}

# ============================================================
# 3. 辅助函数
# ============================================================

function Get-ComfyUIQueue {
    try {
        $response = Invoke-RestMethod -Uri "$ServerUrl/queue" -Method Get -TimeoutSec 10
        return $response
    } catch {
        Write-Host "[WARN] 无法获取队列状态: $_" -ForegroundColor DarkYellow
        return $null
    }
}

function Submit-ComfyUIPrompt {
    param($WorkflowJson)
    try {
        $body = @{ prompt = $WorkflowJson } | ConvertTo-Json -Depth 20
        $response = Invoke-RestMethod -Uri "$ServerUrl/prompt" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30
        return $response
    } catch {
        Write-Host "[ERROR] 提交任务失败: $_" -ForegroundColor Red
        return $null
    }
}

function Get-ComfyUIHistory {
    param($PromptId)
    try {
        $response = Invoke-RestMethod -Uri "$ServerUrl/history/$PromptId" -Method Get -TimeoutSec 10
        return $response
    } catch {
        return $null
    }
}

function Find-OutputFile {
    param($HistoryEntry)
    # 遍历 history 中的所有 outputs 找到视频文件
    foreach ($nodeId in $HistoryEntry.outputs.PSObject.Properties.Name) {
        $output = $HistoryEntry.outputs.$nodeId
        if ($output.gifs) {
            foreach ($gif in $output.gifs) {
                return @{ filename = $gif.filename; subfolder = $gif.subfolder; type = $gif.type }
            }
        }
        if ($output.videos) {
            foreach ($vid in $output.videos) {
                return @{ filename = $vid.filename; subfolder = $vid.subfolder; type = $vid.type }
            }
        }
        if ($output.images) {
            foreach ($img in $output.images) {
                return @{ filename = $img.filename; subfolder = $img.subfolder; type = $img.type }
            }
        }
    }
    return $null
}

function Wait-ForCompletion {
    param($PromptId, $TimeoutMinutes)
    $startTime = Get-Date
    $timeout = $TimeoutMinutes * 60

    while ($true) {
        $elapsed = ((Get-Date) - $startTime).TotalSeconds
        if ($elapsed -gt $timeout) {
            Write-Host "[TIMEOUT] 任务超时 ($TimeoutMinutes 分钟)" -ForegroundColor Red
            return $null
        }

        # 先检查队列
        $queue = Get-ComfyUIQueue
        if ($queue) {
            $running = $queue.queue_running
            $pending = $queue.queue_pending
            # 检查我们的 prompt_id 是否还在队列中
            $stillInQueue = $false
            foreach ($item in $running) {
                if ($item[1] -eq $PromptId) { $stillInQueue = $true; break }
            }
            foreach ($item in $pending) {
                if ($item[1] -eq $PromptId) { $stillInQueue = $true; break }
            }

            if (-not $stillInQueue) {
                # 可能已完成, 查 history
                $history = Get-ComfyUIHistory -PromptId $PromptId
                if ($history -and $PromptId -in $history.PSObject.Properties.Name) {
                    return $history.$PromptId
                }
            }
        }

        $minutesLeft = [math]::Round(($timeout - $elapsed) / 60, 1)
        Write-Host "`r[WAIT] 等待生成中... 剩余超时: ${minutesLeft}分" -NoNewline
        Start-Sleep -Seconds 5
    }
}

function Update-WorkflowPrompt {
    param($WorkflowObj, $Prompt, $FrameCount)

    $w = $WorkflowObj | ConvertTo-Json -Depth 20 | ConvertFrom-Json

    # 找到 CLIPTextEncode 节点 (properties 中包含 "正向提示词")
    foreach ($node in $w.nodes) {
        if ($node.type -eq "CLIPTextEncode" -and $node.properties.'Node name for S&R' -match "正向") {
            $node.widgets_values[0] = "$commonPrefix. $Prompt"
        }
        if ($node.type -eq "CLIPTextEncode" -and $node.properties.'Node name for S&R' -match "负向") {
            $node.widgets_values[0] = $commonNegative
        }
        # 更新视频参数节点
        if ($node.type -eq "EmptyLatentVideo") {
            $node.widgets_values[2] = $FrameCount
        }
        # 更新输出文件名
        if ($node.type -eq "VHS_VideoCombine") {
            $node.widgets_values[3] = $task.id
        }
    }

    return $w
}

# ============================================================
# 4. 批量生成循环
# ============================================================

$completed = 0
$failed = 0
$results = @()

foreach ($task in $tasks) {
    # 断点续传
    if ($skipMode) {
        if ($task.id -ne $StartFrom) { continue }
        $skipMode = $false
    }

    $actLabel = "Act $($task.act): $($task.act_title)"
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "[$($task.id)] $actLabel" -ForegroundColor Cyan
    Write-Host "  时长: $($task.duration_sec)秒 / $($task.frames)帧" -ForegroundColor DarkGray
    Write-Host "  描述: $($task.description)" -ForegroundColor DarkGray
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    if ($DryRun) {
        Write-Host "  [DRY RUN] 跳过实际生成" -ForegroundColor DarkYellow
        Write-Host "  Prompt: $($task.prompt.Substring(0, [Math]::Min(120, $task.prompt.Length)))..." -ForegroundColor Gray
        continue
    }

    # 更新工作流中的提示词
    $taskWorkflow = Update-WorkflowPrompt -WorkflowObj $workflow -Prompt $task.prompt -FrameCount $task.frames

    # 提交任务
    Write-Host "[SUBMIT] 提交到 ComfyUI..." -ForegroundColor Yellow
    $submitResult = Submit-ComfyUIPrompt -WorkflowJson $taskWorkflow

    if (-not $submitResult -or -not $submitResult.prompt_id) {
        Write-Host "[FAIL] 提交失败, 跳过此任务" -ForegroundColor Red
        $failed++
        $results += @{ id = $task.id; status = "submit_failed" }
        continue
    }

    $promptId = $submitResult.prompt_id
    Write-Host "[QUEUED] Prompt ID: $promptId" -ForegroundColor Green

    # 等待完成
    $history = Wait-ForCompletion -PromptId $promptId -TimeoutMinutes $TimeoutMinutes

    if (-not $history) {
        Write-Host ""
        Write-Host "[FAIL] 任务未在超时时间内完成" -ForegroundColor Red
        $failed++
        $results += @{ id = $task.id; status = "timeout"; prompt_id = $promptId }
        continue
    }

    # 查找输出文件
    $outputFile = Find-OutputFile -HistoryEntry $history
    if (-not $outputFile) {
        Write-Host ""
        Write-Host "[FAIL] 生成完成但找不到输出文件" -ForegroundColor Red
        $failed++
        $results += @{ id = $task.id; status = "no_output"; prompt_id = $promptId }
        continue
    }

    Write-Host ""
    Write-Host "[DONE] $($task.id) → $($outputFile.filename)" -ForegroundColor Green
    $completed++
    $results += @{
        id = $task.id
        status = "completed"
        prompt_id = $promptId
        output_file = $outputFile.filename
    }
}

# ============================================================
# 5. 汇总报告
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  批量生成完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  成功: $completed" -ForegroundColor Green
Write-Host "  失败: $failed" -ForegroundColor Red
Write-Host "  总计: $($tasks.Count)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  输出目录: $OutputDir" -ForegroundColor Cyan
Write-Host "  ComfyUI 默认输出也在其 output/ 目录下" -ForegroundColor DarkGray
Write-Host ""

# 输出结果列表
$results | ForEach-Object {
    $color = if ($_.status -eq "completed") { "Green" } else { "Red" }
    Write-Host "  [$($_.status)] $($_.id) -> $($_.output_file)" -ForegroundColor $color
}

# 如果全部成功，提示后期制作
if ($failed -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  所有视频片段已生成!" -ForegroundColor Green
    Write-Host "  下一步:" -ForegroundColor Green
    Write-Host "  1. 使用剪映/DaVinci Resolve 拼接片段" -ForegroundColor Green
    Write-Host "  2. 添加字幕、旁白、音效、背景音乐" -ForegroundColor Green
    Write-Host "  3. scene_15_web_recording 需单独用 OBS 录制" -ForegroundColor Green
    Write-Host "  4. 参考 视频制作指南.md 的后期清单" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}
