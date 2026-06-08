#!/usr/bin/env bash
# generate-stats.sh — 读取 tool-usage.jsonl，生成每日统计 JSON
# 用法: bash scripts/generate-stats.sh [天数]
# 输出: data/stats.json

set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/.claude/logs/tool-usage.jsonl"
STATS_FILE="$PROJECT_DIR/data/stats.json"
DAYS=${1:-14}

mkdir -p "$PROJECT_DIR/data"

if [ ! -f "$LOG_FILE" ]; then
  echo '{"updated":"","total_days":0,"days":[],"skills":{},"mcps":{},"summary":{"total_skills":0,"total_mcps":0,"total_estimated_tokens":0}}' > "$STATS_FILE"
  echo "[stats] No log data yet: $LOG_FILE"
  exit 0
fi

python3 << PYEOF
import json, os, sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone

LOG_FILE = os.environ.get('LOG_FILE_OVERRIDE', r"$LOG_FILE")
STATS_FILE = r"$STATS_FILE"
DAYS = int(os.environ.get('DAYS_OVERRIDE', $DAYS))

entries = []
with open(LOG_FILE, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            try:
                entries.append(json.loads(line))
            except:
                pass

# Group by date
days_map = defaultdict(lambda: {"skills": [], "mcps": [], "total_skills": 0, "total_mcps": 0})
for e in entries:
    ts = e.get("ts", "")
    if not ts:
        continue
    date = ts[:10]
    if e.get("type") == "Skill":
        days_map[date]["skills"].append(e.get("name", "?"))
        days_map[date]["total_skills"] += 1
    elif e.get("type") == "MCP":
        days_map[date]["mcps"].append({"server": e.get("server", "?"), "action": e.get("action", "?")})
        days_map[date]["total_mcps"] += 1

# Recent days range
now = datetime.now(timezone.utc)
recent_days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(DAYS - 1, -1, -1)]

days_list = []
for d in recent_days:
    dd = days_map.get(d, {"skills": [], "mcps": [], "total_skills": 0, "total_mcps": 0})
    days_list.append({
        "date": d,
        "skill_count": dd["total_skills"],
        "mcp_count": dd["total_mcps"],
        "skills_used": list(set(dd["skills"])),
        "mcps_used": [f"{m['server']}::{m['action']}" for m in dd["mcps"]]
    })

# Frequency
skill_freq = defaultdict(int)
mcp_freq = defaultdict(int)
for e in entries:
    if e.get("type") == "Skill":
        skill_freq[e.get("name", "?")] += 1
    elif e.get("type") == "MCP":
        mcp_freq[f"{e.get('server','?')}::{e.get('action','?')}"] += 1

total_skills = sum(skill_freq.values())
total_mcps = sum(mcp_freq.values())
est_skill_tokens = total_skills * 350
est_mcp_tokens = total_mcps * 100

output = {
    "updated": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
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

with open(STATS_FILE, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"[stats] Generated: {total_skills} Skills + {total_mcps} MCPs, {output['total_days']} active days, ~{est_skill_tokens + est_mcp_tokens:,} tokens")
PYEOF
