#!/usr/bin/env bash
# generate-stats.sh — 读取 tool-usage.jsonl，生成每日统计 JSON
# 用法: bash scripts/generate-stats.sh
# 输出: data/stats.json

set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}"

LOG_FILE=".claude/logs/tool-usage.jsonl"
STATS_FILE="data/stats.json"
DAYS=${1:-14}  # 默认最近 14 天

mkdir -p data

if [ ! -f "$LOG_FILE" ]; then
  echo '{"updated":"","total_days":0,"days":[],"skills":{},"mcps":{},"summary":{"total_skills":0,"total_mcps":0,"total_estimated_tokens":0}}' > "$STATS_FILE"
  echo "⚠️  暂无日志数据 ($LOG_FILE 不存在)"
  exit 0
fi

python3 << PYEOF
import json, os
from collections import defaultdict
from datetime import datetime, timedelta

# 读取日志
entries = []
with open("$LOG_FILE", "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            try:
                entries.append(json.loads(line))
            except:
                pass

# 按日期分组
days_map = defaultdict(lambda: {"skills": [], "mcps": [], "total_skills": 0, "total_mcps": 0})

for e in entries:
    ts = e.get("ts", "")
    if not ts:
        continue
    try:
        date = ts[:10]  # YYYY-MM-DD
    except:
        continue

    if e.get("type") == "Skill":
        days_map[date]["skills"].append(e.get("name", "?"))
        days_map[date]["total_skills"] += 1
    elif e.get("type") == "MCP":
        days_map[date]["mcps"].append({"server": e.get("server", "?"), "action": e.get("action", "?")})
        days_map[date]["total_mcps"] += 1

# 补齐最近 N 天（无数据的日子也显示）
recent_days = []
for i in range($DAYS - 1, -1, -1):
    d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
    recent_days.append(d)

# 构建每日数据
days_list = []
for d in recent_days:
    day_data = days_map.get(d, {"skills": [], "mcps": [], "total_skills": 0, "total_mcps": 0})
    days_list.append({
        "date": d,
        "skill_count": day_data["total_skills"],
        "mcp_count": day_data["total_mcps"],
        "skills_used": list(set(day_data["skills"])),
        "mcps_used": [f"{m['server']}::{m['action']}" for m in day_data["mcps"]]
    })

# 汇总 Skill 频率
skill_freq = defaultdict(int)
for e in entries:
    if e.get("type") == "Skill":
        skill_freq[e.get("name", "?")] += 1

# 汇总 MCP 频率
mcp_freq = defaultdict(int)
for e in entries:
    if e.get("type") == "MCP":
        mcp_freq[f"{e.get('server','?')}::{e.get('action','?')}"] += 1

# Token 估计 (粗略)
# Skill 加载约 200-500 token/次，MCP 调用约 50-200 token/次
total_skills = sum(skill_freq.values())
total_mcps = sum(mcp_freq.values())
est_skill_tokens = total_skills * 350
est_mcp_tokens = total_mcps * 100

output = {
    "updated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "total_days": len([d for d in days_list if d["skill_count"] > 0 or d["mcp_count"] > 0]),
    "days": days_list,
    "skills": {k: v for k, v in sorted(skill_freq.items(), key=lambda x: -x[1])},
    "mcps": {k: v for k, v in sorted(mcp_freq.items(), key=lambda x: -x[1])},
    "summary": {
        "total_skills": total_skills,
        "total_mcps": total_mcps,
        "total_estimated_tokens": est_skill_tokens + est_mcp_tokens,
        "skill_tokens": est_skill_tokens,
        "mcp_tokens": est_mcp_tokens
    }
}

with open("$STATS_FILE", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✅ 统计已生成: $STATS_FILE")
print(f"   {total_skills} 次 Skill + {total_mcps} 次 MCP 调用")
print(f"   覆盖 {output['total_days']} 天, 估算 token 消耗: {est_skill_tokens + est_mcp_tokens:,}")
PYEOF
