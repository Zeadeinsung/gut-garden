@echo off
chcp 65001 >nul
echo ========================================
echo   ComfyUI BailianWan 自定义节点安装
echo ========================================
echo.

:: 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)

:: 安装 dashscope
echo [1/2] 安装 dashscope SDK...
pip install dashscope -q

:: 复制节点到 ComfyUI custom_nodes
echo [2/2] 安装自定义节点...
echo.

:: 请用户输入 ComfyUI 路径
set /p COMFY_DIR="请输入 ComfyUI 安装目录路径 (例如 D:\ComfyUI_windows_portable): "

if not exist "%COMFY_DIR%\custom_nodes" (
    echo [错误] 目录不存在或不是 ComfyUI 目录: %COMFY_DIR%
    pause
    exit /b 1
)

set TARGET=%COMFY_DIR%\custom_nodes\ComfyUI_BailianWan

if exist "%TARGET%" (
    echo [信息] 目标已存在，覆盖安装...
    rmdir /s /q "%TARGET%"
)

xcopy /e /i "%~dp0." "%TARGET%"
echo.
echo [完成] 节点已安装到 %TARGET%
echo.

:: 提示 API Key
echo ========================================
echo   下一步:
echo   1. 获取百炼 API Key: https://bailian.console.aliyun.com/
echo   2. 设置环境变量: setx DASHSCOPE_API_KEY "你的Key"
echo   3. 重启 ComfyUI
echo   4. 在节点菜单 BailianWan 分类下找到节点
echo ========================================
pause
