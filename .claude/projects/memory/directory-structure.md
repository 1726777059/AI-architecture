---
name: directory-structure
description: AI-architecture 目录结构约定
metadata:
  type: project
---

# 目录结构

```
.
├── CLAUDE.md              # 项目指令（AI 入口）
├── src/                   # 源码（待创建）
├── docs/                  # 文档（待创建）
├── .claude/
│   ├── hooks/             # 质量门禁
│   ├── agents/            # Subagent 定义
│   ├── rules/             # 路径规则
│   └── projects/          # Memory 持久化
└── harness-tasks.json     # 任务列表
```

**Why:** 为 AI 提供目录导航，知道什么文件在什么位置。
**How to apply:** 目录结构变更时同步更新此文件。
