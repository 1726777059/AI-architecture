#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== AI-architecture 环境健康检查 ==="
echo ""

# 1. 依赖检查
echo "--- 依赖检查 ---"
command -v python >/dev/null 2>&1 && echo "  ✅ Python: $(python --version 2>&1)" || echo "  ⚠️  WARN: Python 未安装"
command -v git >/dev/null 2>&1 && echo "  ✅ Git: $(git --version 2>&1)" || echo "  ❌ ERROR: Git 未安装"
command -v node >/dev/null 2>&1 && echo "  ✅ Node: $(node --version 2>&1)" || echo "  ⚠️  WARN: Node 未安装"
command -v npm >/dev/null 2>&1 && echo "  ✅ npm: $(npm --version 2>&1)" || echo "  ⚠️  WARN: npm 未安装"

# 2. 项目文件完整性
echo ""
echo "--- 项目文件完整性 ---"
[ -f "$PROJECT_DIR/CLAUDE.md" ] && echo "  ✅ CLAUDE.md" || echo "  ⚠️  WARN: CLAUDE.md 缺失"
[ -d "$PROJECT_DIR/.claude/hooks" ] && echo "  ✅ .claude/hooks/ ($(ls -1 "$PROJECT_DIR/.claude/hooks/"*.sh 2>/dev/null | wc -l) 个脚本)" || echo "  ⚠️  WARN: Hooks 目录缺失"
[ -d "$PROJECT_DIR/.claude/agents" ] && echo "  ✅ .claude/agents/ ($(ls -1 "$PROJECT_DIR/.claude/agents/"*.md 2>/dev/null | wc -l) 个 subagent)" || echo "  ⚠️  WARN: Agents 目录缺失"
[ -d "$PROJECT_DIR/.claude/rules" ] && echo "  ✅ .claude/rules/ ($(ls -1 "$PROJECT_DIR/.claude/rules/"*.md 2>/dev/null | wc -l) 个规则)" || echo "  ⚠️  WARN: Rules 目录缺失"
[ -f "$PROJECT_DIR/.claude/settings.json" ] && echo "  ✅ .claude/settings.json" || echo "  ⚠️  WARN: settings.json 缺失"
[ -f "$PROJECT_DIR/.claude/projects/MEMORY.md" ] && echo "  ✅ Memory 系统" || echo "  ⚠️  WARN: Memory 索引缺失"

# 3. Hook 脚本可执行性
echo ""
echo "--- Hook 可执行性 ---"
for hook in "$PROJECT_DIR/.claude/hooks/"*.sh; do
    [ -f "$hook" ] || continue
    if [ -x "$hook" ]; then
        echo "  ✅ $(basename "$hook")"
    else
        echo "  ⚠️  WARN: $(basename "$hook") 不可执行"
    fi
done

# 4. Git 仓库状态
echo ""
echo "--- Git 状态 ---"
if git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
    echo "  ✅ Git 仓库已初始化"
    echo "  当前分支: $(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null || echo '无提交')"
    echo "  未暂存文件: $(git -C "$PROJECT_DIR" status --short 2>/dev/null | wc -l) 个"
else
    echo "  ⚠️  WARN: 未检测到 Git 仓库（建议运行 git init）"
fi

# 5. Smoke test — 运行文档规范检查的语法验证
echo ""
echo "--- Smoke Test ---"
if [ -f "$PROJECT_DIR/.claude/hooks/validate_markdown.sh" ]; then
    bash -n "$PROJECT_DIR/.claude/hooks/validate_markdown.sh" 2>/dev/null && \
        echo "  ✅ validate_markdown.sh 语法正确" || \
        echo "  ❌ validate_markdown.sh 语法错误"
fi

echo ""
echo "=== 环境健康检查完成 ==="
