#!/usr/bin/env bash
# track_skill_mcp.sh
# PostToolUse hook — 记录每次 Skill / MCP 调用，写 JSONL 日志
# 查看日志: cat .claude/logs/tool-usage.jsonl | python3 -m json.tool

LOG_DIR="${CLAUDE_PROJECT_DIR}/.claude/logs"
LOG_FILE="${LOG_DIR}/tool-usage.jsonl"
mkdir -p "$LOG_DIR"

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-{}}"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 判断是否是 Skill 或 MCP 调用
is_skill=false
is_mcp=false

[[ "$TOOL_NAME" == Skill ]] && is_skill=true
[[ "$TOOL_NAME" == mcp__* ]] && is_mcp=true

if $is_skill; then
  skill=$(echo "$TOOL_INPUT" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('skill','?'))" 2>/dev/null || echo "?")
  args=$(echo "$TOOL_INPUT"  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('args',''))" 2>/dev/null || echo "")
  python3 -c "
import json
with open('$LOG_FILE','a',encoding='utf-8') as f:
  json.dump({'ts':'$TS','type':'Skill','name':'$skill','args':'$args'},f,ensure_ascii=False)
  f.write('\n')
" 2>/dev/null

elif $is_mcp; then
  server="${TOOL_NAME#mcp__}"
  server="${server%%__*}"
  action="${TOOL_NAME#mcp__${server}__}"
  python3 -c "
import json
with open('$LOG_FILE','a',encoding='utf-8') as f:
  json.dump({'ts':'$TS','type':'MCP','server':'$server','action':'$action'},f,ensure_ascii=False)
  f.write('\n')
" 2>/dev/null
fi
