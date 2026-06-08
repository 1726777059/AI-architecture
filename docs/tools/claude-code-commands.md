# Claude Code 命令完全参考

> [AI-ARCH]-[DOC]-[TOOLS-003] — Claude Code CLI 终端 AI Coding Agent
> 当前会话模型：DeepSeek-V4-Pro

---

## 目录

1. [启动与基础选项](#1-启动与基础选项)
2. [会话管理](#2-会话管理)
3. [权限与安全](#3-权限与安全)
4. [模型与 Agent 配置](#4-模型与-agent-配置)
5. [MCP 管理](#5-mcp-管理)
6. [插件管理 (plugin)](#6-插件管理-plugin)
7. [自定义 Agent](#7-自定义-agent)
8. [Worktree 隔离](#8-worktree-隔离)
9. [调试与诊断](#9-调试与诊断)
10. [认证管理](#10-认证管理)
11. [项目状态管理](#11-项目状态管理)
12. [全部 Slash 命令 (Skills) 速查](#12-全部-slash-命令-skills-速查)
13. [常用工作流](#13-常用工作流)

---

## 1. 启动与基础选项

### 基本用法

```bash
# 交互模式（启动对话）
claude

# 非交互模式（单次输出）
claude -p "解释这个项目是干什么的"

# 指定工作目录
claude --add-dir /path/to/project

# 继续上一次会话
claude -c
claude --continue
```

### 完整启动参数速查

| 参数 | 作用 | 示例 |
|------|------|------|
| `-p`, `--print` | 非交互模式，输出结果后退出 | `claude -p "列举所有 Go 文件"` |
| `-c`, `--continue` | 继续最近的会话 | `claude -c` |
| `-r`, `--resume [id]` | 恢复指定会话（可选搜索词） | `claude -r` / `claude -r abc123` |
| `--session-id <uuid>` | 使用指定的会话 UUID | `claude --session-id xxx-xxx-xxx` |
| `--add-dir <dir>` | 添加允许操作的工具目录 | `claude --add-dir /tmp/other-project` |
| `--fork-session` | 恢复时创建新会话 ID | `claude -r --fork-session` |
| `--brief` | 启用 agent-to-user 通信工具 | `claude --brief` |

### 上下文与 Prompt 控制

| 参数 | 作用 |
|------|------|
| `--system-prompt <prompt>` | 自定义系统提示词 |
| `--append-system-prompt <prompt>` | 追加到默认系统提示词 |
| `--exclude-dynamic-system-prompt-sections` | 从系统提示词中移除动态信息（改善缓存命中） |

### 文件与输入

| 参数 | 作用 |
|------|------|
| `--file <spec>` | 启动时下载文件资源（格式：file_id:relative_path） |

---

## 2. 会话管理

### 核心命令

```bash
# 继续最近会话
claude -c

# 交互式选择要恢复的会话
claude -r

# 搜索并恢复
claude -r "WCS设计"

# 指定会话 ID 恢复
claude -r session_abc123

# Fork 模式：基于旧会话但用新 ID
claude -r --fork-session
```

### Remote Control（远程控制）

```bash
# 开启远程控制（可选命名）
claude --remote-control
claude --remote-control my-dev-session

# 自动命名前缀
claude --remote-control-session-name-prefix dev-machine-01
```

---

## 3. 权限与安全

### 权限模式

```bash
# 完全跳过权限检查（仅限无网络沙箱环境）
claude --dangerously-skip-permissions

# 等价写法
claude --allow-dangerously-skip-permissions
```

### 工具白名单/黑名单

```bash
# 只允许特定工具
claude --allowedTools "Read,Grep,Glob,Bash(git *)"

# 禁止特定工具
claude --disallowedTools "Bash(rm *),Bash(curl *)"

# 禁用所有工具
claude --tools ""

# 使用默认工具集
claude --tools "default"
```

### 权限配置（settings.json）

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Grep",
      "Glob",
      "Bash(git:status,diff,log,add,commit,branch,checkout,push)",
      "Bash(npm:run,test,install)",
      "Bash(pytest:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(git:push --force:*)",
      "Bash(curl:*)"
    ]
  }
}
```

---

## 4. 模型与 Agent 配置

### 模型选择

```bash
# 指定 Agent 类型
claude --agent sonnet
claude --agent opus
claude --agent haiku

# 指定 fallback 模型（仅在 --print 模式下工作）
claude --fallback-model claude-sonnet-4-6

# 设置 effort 级别
claude --effort high       # low / medium / high / xhigh / max
```

### 自定义 Agent（内联定义）

```bash
claude --agents '{
  "reviewer": {
    "description": "Reviews code for bugs",
    "prompt": "You are a senior code reviewer. Focus on correctness, security, and performance."
  }
}'
```

### 配置文件方式

```json
// .claude/settings.json
{
  "model": "claude-sonnet-4-6",
  "agent": "sonnet",
  "effort": "high"
}
```

---

## 5. MCP 管理

### CLI 管理命令

```bash
# 进入 MCP 交互管理
claude mcp

# 使用指定 MCP 配置启动
claude --mcp-config /path/to/mcp.json

# 严格模式：只使用 --mcp-config 指定的，忽略其他配置
claude --strict-mcp-config --mcp-config /path/to/mcp.json
```

### MCP 配置示例

```json
// .claude/settings.json 或 .mcp.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-git"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-filesystem", "/path/to/project"]
    }
  }
}
```

---

## 6. 插件管理 (plugin)

```bash
# 管理插件
claude plugin              # 交互式管理

# 或简写
claude plugins
```

### 当前环境已安装插件

| 插件 | 来源 | 范围 | 用途 |
|------|------|------|------|
| **superpowers** | claude-plugins-official | user | 开发方法论集合（TDD/调试/规划/代码审查） |
| **commit-commands** | claude-plugins-official | project | Git 提交、推送、PR 创建 |
| **session-report** | claude-plugins-official | project | 会话报告生成 |
| **skill-creator** | claude-plugins-official | user | 自定义 Skill 创建工具 |
| **understand-anything** | understand-anything | user | 代码库理解、知识图谱、架构分析 |

---

## 7. 自定义 Agent

```bash
# 管理后台 Agent
claude agents [options]
```

---

## 8. Worktree 隔离

```bash
# 创建 git worktree 并在其中工作
claude -w                    # 自动命名
claude --worktree my-feature # 指定名称

# worktree + tmux 集成
claude -w --tmux             # iTerm2 原生 pane 或 tmux classic
claude -w --tmux=classic     # 强制 classic tmux
```

---

## 9. 调试与诊断

```bash
# 调试模式
claude -d                           # 开启所有调试日志
claude -d "api,hooks"               # 只调试 api 和 hooks
claude --debug "!1p,!file"          # 排除 1p 和 file 类别

# 输出调试日志到文件
claude --debug-file /tmp/claude-debug.log

# 详细模式
claude --verbose

# 系统健康检查
claude doctor

# 查看版本
claude -v
claude --version
```

---

## 10. 认证管理

```bash
# 管理认证
claude auth

# 设置长期有效的认证 token（需要 Claude 订阅）
claude setup-token
```

### 精简模式（跳过所有认证读取）

```bash
claude --bare
```

`--bare` 模式会跳过：Hooks、LSP、插件同步、自动记忆、后台预加载、keychain 读取、CLAUDE.md 自动发现。

---

## 11. 项目状态管理

```bash
# 管理项目状态
claude project

# 管理自动模式分类器
claude auto-mode
```

---

## 12. 全部 Slash 命令 (Skills) 速查

> 在交互会话中输入 `/command` 触发对应 Skill。完整清单见 [skills/README.md](../skills/README.md)。

### 🔍 代码理解与审查

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `/code-review` | 多维度代码审查 | 提交前检查 |
| `/simplify` | 代码简化重构 | 写完代码后优化 |
| `/verify` | 运行验证改动 | 修改后确认生效 |
| `/security-review` | 安全审计 | 敏感项目上线前 |
| `/review` | PR 审查流程 | 团队协作审查 |

### 🧠 设计与规划

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `/brainstorming` | 需求澄清 + 方案对比 | 新功能启动 |
| `/plan` | 创建任务计划（中文版） | 多步骤复杂任务 |
| `/deep-research` | 多源搜索 → 交叉验证 → 报告 | 技术调研 |

### 🚀 自动化

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `/harness` | 多会话自主工作 | 长时间任务 |
| `/loop [间隔] [命令]` | 定时循环执行 | 定期检查/轮询 |
| `/workflow` | 多 Agent 编排工作流 | 大规模并行任务 |

### 🛠️ 工具

| 命令 | 功能 | 使用场景 |
|------|------|---------|
| `/skill-creator` | 创建自定义 Skill | 封装团队最佳实践 |
| `/mcp-builder` | 构建自定义 MCP Server | 集成新工具 |
| `/init` | 初始化项目 Claude Code 配置 | 新项目启动 |
| `/run` | 启动项目应用 | 日常运行测试 |
| `/pptx` | 创建/编辑 PPT | 汇报演示 |
| `/webapp-testing` | Web 应用 E2E 测试 | Web 项目测试 |
| `/update-config` | 管理 settings.json | 调整权限/环境 |

### 🖼️ 设计

| 命令 | 功能 |
|------|------|
| `/design-taste-frontend` | 前端设计品味检查 |
| `/minimalist-ui` | 极简 UI 设计 |
| `/industrial-brutalist-ui` | 工业粗野主义 UI |
| `/high-end-visual-design` | 高端视觉设计 |
| `/image-to-code` | 图片转代码 |
| `/diagram-design` | 图表设计 |
| `/brandkit` | 品牌视觉套件 |

### 📋 开发方法论 (Superpowers 插件)

| 命令 | 功能 |
|------|------|
| `/test-driven-development` | TDD 测试驱动开发 |
| `/systematic-debugging` | 系统性调试流程 |
| `/subagent-driven-development` | 子代理驱动开发 |
| `/dispatching-parallel-agents` | 调度并行代理 |
| `/finishing-a-development-branch` | 完成开发分支 |

### 🧩 代码理解 (Understand-Anything 插件)

| 命令 | 功能 |
|------|------|
| `/understand` | 代码库理解入口 |
| `/understand-domain` | 业务领域分析 |
| `/understand-explain` | 代码解释 |
| `/understand-knowledge` | 知识图谱查询 |

### 📝 Git 工作流 (Commit-Commands 插件)

| 命令 | 功能 |
|------|------|
| `/commit` | 创建规范 git commit |
| `/commit-push-pr` | 提交 + 推送 + 创建 PR |
| `/clean_gone` | 清理已删除分支 |

### 💡 内置非 Skill 的 Slash 命令

| 命令 | 功能 |
|------|------|
| `/help` | 查看帮助 |
| `/clear` | 清除对话上下文 |
| `/compact` | 压缩上下文（释放 token） |
| `/fast` | 切换快速模式 |
| `/config` | 快速配置（模型/主题等） |
| `/plugin` | 插件市场 |
| `/memory` | 打开记忆文件 |

---

## 13. 常用工作流

### 工作流 1：日常开发

```bash
cd /e/my-project && claude -c
# /code-review → /verify → /commit-push-pr
```

### 工作流 2：新项目初始化

```bash
cd /e/new-project && claude
# /init → /brainstorming → /deep-research → /plan
```

### 工作流 3：Bug 修复

```bash
claude -c
# /systematic-debugging → 修复 → /verify → /code-review → /commit
```

### 工作流 4：大规模并行任务

```bash
# /dispatching-parallel-agents 或 /workflow
```

### 工作流 5：隔离开发

```bash
claude -w feature-big-refactor
# /finishing-a-development-branch
```

---

> **最后更新**: 2026-06-08
> **配套文档**: cc-connect-commands.md / skills/README.md
