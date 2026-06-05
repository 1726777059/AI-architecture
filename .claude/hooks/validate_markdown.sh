#!/bin/bash
# ============================================================
# AI-architecture — Markdown 规范自动检查
# 触发时机：PostToolUse (Write / Edit)
# 作用：每次写入 .md 文件后自动检查文档规范
# 返回值：exit 0 = 通过, exit 2 = 阻断（exit 1 不阻断！）
# ============================================================

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

# 只处理 .md 文件
[[ "$FILE_PATH" != *.md ]] && exit 0
[[ -z "$FILE_PATH" ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

# 豁免：.claude/ 目录下的文件（subagent/workflow/memory/rules 使用特殊格式）
if echo "$FILE_PATH" | grep -qE '\.claude/'; then
    exit 0
fi

# 项目特定豁免：无（项目尚未定义具体豁免路径）

CONTENT=$(cat "$FILE_PATH" 2>/dev/null)
[[ -z "$CONTENT" ]] && exit 0

ERRORS=()
WARNINGS=()

# ============================================================
# 规范1：文档必须以一级标题开头
# ============================================================
if ! echo "$CONTENT" | head -1 | grep -qE '^# '; then
    ERRORS+=("[AI-ARCH]-DOC-001: 文档必须以一级标题(# )开头")
fi

# ============================================================
# 规范2：代码块必须指定语言（``` 后面必须有语言标识）
# ============================================================
UNSPEC_LANGS=$(echo "$CONTENT" | grep -cE '^```$')
if [ "$UNSPEC_LANGS" -gt 0 ]; then
    WARNINGS+=("[AI-ARCH]-DOC-002: 发现 $UNSPEC_LANGS 个未指定语言的代码块，建议指定语言类型")
fi

# ============================================================
# 规范3：Mermaid 图不应为空
# ============================================================
if echo "$CONTENT" | grep -qE '```mermaid'; then
    IN_MERMAID=false
    LINE_COUNT=0
    while IFS= read -r line; do
        if [[ "$line" =~ ^\`\`\`mermaid ]]; then
            IN_MERMAID=true
            continue
        fi
        if [[ "$line" =~ ^\`\`\` ]] && [ "$IN_MERMAID" = true ]; then
            if [ "$LINE_COUNT" -eq 0 ]; then
                ERRORS+=("[AI-ARCH]-DOC-003: Mermaid 图块为空，请添加流程图内容")
            fi
            IN_MERMAID=false
            LINE_COUNT=0
            continue
        fi
        if [ "$IN_MERMAID" = true ]; then
            ((LINE_COUNT++))
        fi
    done <<< "$CONTENT"
fi

# ============================================================
# 规范4：表格必须有分隔行
# ============================================================
TABLE_STARTS=$(echo "$CONTENT" | grep -cE '^\|.*\|$')
TABLE_SEPS=$(echo "$CONTENT" | grep -cE '^\|[-| :]+\|$')
if [ "$TABLE_STARTS" -gt 0 ] && [ "$TABLE_SEPS" -eq 0 ]; then
    WARNINGS+=("[AI-ARCH]-DOC-004: 发现表格行但缺少分隔行(|:--|:--|)，表格可能未对齐")
fi

# ============================================================
# 规范5：项目特定检查 — 项目尚未定义具体规则，以下为可启用模板
# 启用时取消注释并替换路径/模式
# ============================================================

# [AI-ARCH-DOC-005] 流程文档建议包含流程图
# [AI-ARCH-DOC-009] 流程文档含设备清单
# [AI-ARCH-DOC-010] 流程文档含异常处理
# [AI-ARCH-DOC-011] 接口文档五要素完整
# [AI-ARCH-DOC-012] 非标准术语检查
# [AI-ARCH-DOC-013] 引用文件路径存在性检查

# ============================================================
# 规范6：文件命名不得包含空格和特殊字符（通用规则）
# ============================================================
FILENAME=$(basename "$FILE_PATH")
if echo "$FILENAME" | grep -qE '[[:space:]~!@#$%^&*()+={}\[\]|\\:;"<>,?]'; then
    ERRORS+=("[AI-ARCH]-DOC-006: 文件名包含空格或特殊字符：$FILENAME（应使用 [-_a-zA-Z0-9一-鿿]）")
fi

# ============================================================
# 输出结果
# ============================================================
if [ ${#ERRORS[@]} -gt 0 ] || [ ${#WARNINGS[@]} -gt 0 ]; then
    echo "=== 📋 文档规范检查: $(basename "$FILE_PATH") ===" >&2
    for err in "${ERRORS[@]}"; do
        echo "  ❌ $err" >&2
    done
    for warn in "${WARNINGS[@]}"; do
        echo "  ⚠️  $warn" >&2
    done
    # 只有 ERROR 阻断，WARNING 提示但放行
    if [ ${#ERRORS[@]} -gt 0 ]; then
        echo "🔴 规范检查失败，请修正后重试" >&2
        exit 2
    fi
    echo "🟡 规范检查有警告，请酌情处理" >&2
fi

echo "✅ 文档规范检查通过: $(basename "$FILE_PATH")" >&2
exit 0
