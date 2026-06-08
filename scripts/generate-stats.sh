#!/usr/bin/env bash
# generate-stats.sh — 读取 tool-usage.jsonl，生成每日统计（含命中率/漏报）
# 用法: bash scripts/generate-stats.sh [天数]
# 输出: data/stats.json

set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/.claude/logs/tool-usage.jsonl"
STATS_FILE="$PROJECT_DIR/data/stats.json"
DAYS=${1:-14}

mkdir -p "$PROJECT_DIR/data"
cd "$PROJECT_DIR"

if [ ! -f "$LOG_FILE" ]; then
  echo '{"updated":"","total_days":0,"days":[],"skills":{},"mcps":{},"misses":{},"summary":{"total_skills":0,"total_mcps":0,"total_misses":0,"hit_rate":0,"total_estimated_tokens":0,"wasted_tokens":0}}' > "$STATS_FILE"
  echo "[stats] No log data yet"
  exit 0
fi

python3 << PYEOF
import json, os
from collections import defaultdict
from datetime import datetime, timedelta, timezone

LOG_FILE = ".claude/logs/tool-usage.jsonl"
STATS_FILE = "data/stats.json"
DAYS = $DAYS

entries = []
with open(LOG_FILE, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            try:
                entries.append(json.loads(line))
            except:
                pass

now = datetime.now(timezone.utc)

# Per-day aggregation
days_map = defaultdict(lambda: {
    "skills": [], "mcps": [], "misses": [],
    "total_skills": 0, "total_mcps": 0, "total_misses": 0, "waste_tokens": 0
})

for e in entries:
    ts = e.get("ts", "")
    if not ts: continue
    date = ts[:10]
    t = e.get("type", "")
    if t == "Skill":
        days_map[date]["skills"].append(e.get("name", "?"))
        days_map[date]["total_skills"] += 1
    elif t == "MCP":
        days_map[date]["mcps"].append(f"{e.get('server','?')}::{e.get('action','?')}")
        days_map[date]["total_mcps"] += 1
    elif t == "miss":
        days_map[date]["misses"].append({"task": e.get("task","?"), "skill": e.get("skill","?"), "reason": e.get("reason","")})
        days_map[date]["total_misses"] += 1
        days_map[date]["waste_tokens"] += e.get("est_waste", 0)

# Recent days
recent_days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(DAYS - 1, -1, -1)]

days_list = []
for d in recent_days:
    dd = days_map.get(d, {"skills": [], "mcps": [], "misses": [], "total_skills": 0, "total_mcps": 0, "total_misses": 0, "waste_tokens": 0})
    h = dd["total_skills"]
    m = dd["total_misses"]
    days_list.append({
        "date": d,
        "hits": h,
        "misses": m,
        "mcp_count": dd["total_mcps"],
        "hit_rate": round(h / (h + m) * 100) if (h + m) > 0 else 0,
        "skills_used": list(set(dd["skills"])),
        "mcps_used": list(set(dd["mcps"])),
        "miss_details": dd["misses"],
        "waste_tokens": dd["waste_tokens"]
    })

# Frequencies
skill_freq = defaultdict(int)
mcp_freq = defaultdict(int)
miss_freq = defaultdict(list)  # skill -> [reasons]
for e in entries:
    t = e.get("type", "")
    if t == "Skill":
        skill_freq[e.get("name", "?")] += 1
    elif t == "MCP":
        mcp_freq[f"{e.get('server','?')}::{e.get('action','?')}"] += 1
    elif t == "miss":
        sn = e.get("skill", "?")
        miss_freq[sn].append({"task": e.get("task",""), "reason": e.get("reason",""), "waste": e.get("est_waste",0)})

total_skills = sum(skill_freq.values())
total_mcps = sum(mcp_freq.values())
total_misses = sum(len(v) for v in miss_freq.values())
total_waste = sum(e.get("est_waste", 0) for e in entries if e.get("type") == "miss")
hit_rate = round(total_skills / (total_skills + total_misses) * 100) if (total_skills + total_misses) > 0 else 0

est_skill_tokens = total_skills * 350
est_mcp_tokens = total_mcps * 100

# Miss summary
miss_summary = {}
for sn, items in sorted(miss_freq.items(), key=lambda x: -len(x[1])):
    miss_summary[sn] = {
        "count": len(items),
        "total_waste": sum(it["waste"] for it in items),
        "reasons": [it["reason"] for it in items]
    }

output = {
    "updated": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "total_days": len([d for d in days_list if d["hits"] > 0 or d["misses"] > 0]),
    "days": days_list,
    "skills": {k: v for k, v in sorted(skill_freq.items(), key=lambda x: -x[1])},
    "mcps": {k: v for k, v in sorted(mcp_freq.items(), key=lambda x: -x[1])},
    "misses": miss_summary,
    "summary": {
        "total_skills": total_skills,
        "total_mcps": total_mcps,
        "total_misses": total_misses,
        "hit_rate": hit_rate,
        "total_estimated_tokens": est_skill_tokens + est_mcp_tokens,
        "skill_tokens": est_skill_tokens,
        "mcp_tokens": est_mcp_tokens,
        "wasted_tokens": total_waste
    }
}

with open(STATS_FILE, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"[stats] Hits:{total_skills} Misses:{total_misses} HitRate:{hit_rate}% Waste:{total_waste:,}tokens")
PYEOF
