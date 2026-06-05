#!/bin/bash
# ============================================================
# AI-architecture — Compact 后上下文重注入
# 触发时机：SessionStart (matcher: compact)
# 作用：当 Context Compact 触发后，自动将关键上下文重新注入
# 返回值：exit 0 = 正常
# ============================================================

PROJECT_DIR="$CLAUDE_PROJECT_DIR"

echo "🔄 Compact 检测到，正在重注入上下文..." >&2
echo "" >&2

# ============================================================
# 1. 重注入当前迭代状态（从 CLAUDE.md 提取）
# ============================================================
echo "--- 📌 当前迭代状态 ---" >&2
if [ -f "$PROJECT_DIR/CLAUDE.md" ]; then
    grep -A 50 '## 当前迭代状态' "$PROJECT_DIR/CLAUDE.md" | head -30 >&2
else
    echo "⚠️  CLAUDE.md 未找到" >&2
fi

# ============================================================
# 2. 重注入项目记忆索引（从 Memory 提取）
# ============================================================
MEMORY_DIR="$CLAUDE_PROJECT_DIR/.claude/projects"
if [ -d "$MEMORY_DIR" ]; then
    echo "" >&2
    echo "--- 🧠 项目记忆 ---" >&2
    MEMORY_INDEX=$(find "$MEMORY_DIR" -name "MEMORY.md" -type f 2>/dev/null | head -1)
    if [ -f "$MEMORY_INDEX" ]; then
        cat "$MEMORY_INDEX" >&2
    fi
fi

# ============================================================
# 3. 提示当前分支和状态
# ============================================================
echo "" >&2
echo "--- 🌿 Git 状态 ---" >&2
cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null >&2
cd "$PROJECT_DIR" && git status --short 2>/dev/null | head -10 >&2

echo "" >&2
echo "✅ 上下文重注入完成，可继续工作" >&2

exit 0
