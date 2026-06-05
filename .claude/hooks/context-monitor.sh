#!/bin/bash
# ============================================================
# AI-architecture — Context 膨胀监控
# 触发时机：PostToolUse (Read)
# 作用：检测主 Context 中读取大型规范文件的操作，发出警告
# 返回值：exit 0 = 放行（仅警告）, exit 2 = 阻断（明确违规）
# ============================================================

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

[[ -z "$FILE_PATH" ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

WARNINGS=()
BLOCKED=false

# ============================================================
# 禁止在主 Context 中 Read 的重文件列表
# 项目尚未识别重文件 — 待项目结构确定后填充
# 格式：["相对路径"]="应委托的 subagent"
# ============================================================
declare -A HEAVY_FILES=(
    # 示例：["docs/large-spec.md"]="universal-analyzer"
)

# 检查是否命中了重文件
for heavy_file in "${!HEAVY_FILES[@]}"; do
    if echo "$FILE_PATH" | grep -qF "$heavy_file"; then
        DELEGATE_TO="${HEAVY_FILES[$heavy_file]}"
        LINE_COUNT=$(wc -l < "$FILE_PATH" 2>/dev/null || echo 0)

        if [ "$LINE_COUNT" -gt 100 ]; then
            WARNINGS+=("⛔ Context 膨胀警告：读取了重文件「$heavy_file」（$LINE_COUNT 行）")
            WARNINGS+=("   该文件应委托 $DELEGATE_TO subagent 处理，不应在主 Context 中直接读取")
            WARNINGS+=("   请改用：Agent 工具 → 调用 $DELEGATE_TO subagent")
            BLOCKED=true
        fi
    fi
done

# ============================================================
# 模板文件监控 — 项目尚未定义模板目录，已禁用
# 启用时取消注释并替换 TEMPLATE_DIR_PATTERN
# ============================================================

# ============================================================
# 项目特定文件监控 — 暂无
# ============================================================

# ============================================================
# 输出结果
# ============================================================
if [ "$BLOCKED" = true ]; then
    echo "" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "⚠️  Context 膨胀监控拦截" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    for warn in "${WARNINGS[@]}"; do
        echo "  $warn" >&2
    done
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "主 Context 应保持轻量（只收摘要，不收原始数据）" >&2
    echo "请使用 Agent 工具将操作委托给合适的 subagent" >&2
    exit 2
fi

exit 0
