# Skills 本地目录与说明

> [AI-ARCH]-[DOC]-[SKILLS-001] — 当前环境所有已安装 Skill 的全量清单
> 每个 Skill 标注安装位置、来源、状态，方便管理和维护。

---

## 目录

1. [Skill 是什么](#1-skill-是什么)
2. [本地 Skill 目录结构](#2-本地-skill-目录结构)
3. [Skill 全量清单](#3-skill-全量清单)
4. [插件 Skill 详解](#4-插件-skill-详解)
5. [Agent Skills 目录](#5-agent-skills-目录)
6. [Skill 安装与创建](#6-skill-安装与创建)
7. [场景 × 推荐 Skill 组合](#7-场景--推荐-skill-组合)

---

## 1. Skill 是什么

```
Skill = 专业提示词模板 + 工作流程规则 + 输出规范

┌─────────────────────────────────────────────────────┐
│  普通 Prompt:  "帮我审查代码"                          │
│  Skill 触发:   /code-review                          │
│                                                      │
│  区别：                                               │
│  Skill 会加载完整的审查流程、检查清单、                  │
│  输出格式规范，确保每次审查质量一致                      │
└─────────────────────────────────────────────────────┘
```

### Skill 的存储位置

Skill 从多个来源加载，Claude Code 按以下优先级查找：

```
1. 项目级:  .claude/skills/           → 项目专属 Skill
2. 用户级:  ~/.claude/skills/         → 用户全局 Skill
3. 插件级:  ~/.claude/plugins/cache/  → 通过插件安装的 Skill
4. Agent级: ~/.agents/skills/         → 通过 symlink 引入的 Agent Skill
```

---

## 2. 本地 Skill 目录结构

### 2.1 用户级 Skill (`~/.claude/skills/`)

```
~/.claude/skills/
├── brainstorming/          📁 需求澄清与方案设计
├── code-review/            📁 代码审查
├── code-simplifier/        📁 代码简化
├── planning-with-files-zh/ 📁 中文版任务规划
├── harness/                📁 长时间自主任务
├── project-harness/        📁 项目级任务编排
├── project-kickstart/      📁 项目启动引导
├── mcp-builder/            📁 MCP Server 构建
├── skill-creator/          📁 Skill 创建工具
├── snapview/               📁 截图上下文注入
├── pptx/                   📁 PPT 创建编辑
├── webapp-testing/         📁 Web 应用测试
├── ralph-loop/             📁 Ralph 迭代循环
├── find-skills/            📁 Skill 发现
├── cc-guide-practice.md    📄 Claude Code 指南
├── project-harness.skill   📄 project-harness Skill 定义
│
├── brandkit → ~/.agents/skills/brandkit                  🔗 symlink
├── design-taste-frontend → ~/.agents/skills/...           🔗 symlink
├── design-taste-frontend-v1 → ~/.agents/skills/...        🔗 symlink
├── diagram-design → ~/.agents/skills/diagram-design        🔗 symlink
├── full-output-enforcement → ~/.agents/skills/...          🔗 symlink
├── gpt-taste → ~/.agents/skills/gpt-taste                  🔗 symlink
├── high-end-visual-design → ~/.agents/skills/...           🔗 symlink
├── image-to-code → ~/.agents/skills/image-to-code          🔗 symlink
├── imagegen-frontend-mobile → ~/.agents/skills/...         🔗 symlink
├── imagegen-frontend-web → ~/.agents/skills/...            🔗 symlink
├── impeccable → ~/.agents/skills/impeccable                🔗 symlink
├── industrial-brutalist-ui → ~/.agents/skills/...          🔗 symlink
├── llm-wiki → ~/.agents/skills/llm-wiki                    🔗 symlink
├── minimalist-ui → ~/.agents/skills/minimalist-ui          🔗 symlink
├── redesign-existing-projects → ~/.agents/skills/...       🔗 symlink
├── stitch-design-taste → ~/.agents/skills/...              🔗 symlink
└── xmind → ~/.agents/skills/xmind                          🔗 symlink
```

### 2.2 插件级 Skill (`~/.claude/plugins/cache/`)

```
~/.claude/plugins/cache/
├── claude-plugins-official/
│   ├── superpowers/5.1.0/skills/      → 14 个开发方法论 Skill
│   ├── commit-commands/.../commands/   → Git 提交相关 Skill
│   ├── session-report/.../skills/      → 会话报告 Skill
│   └── skill-creator/.../skills/       → Skill 创建 Skill
│
└── understand-anything/
    └── understand-anything/2.7.6/skills/ → 8 个代码理解 Skill
```

---

## 3. Skill 全量清单

> 状态说明：🟢 已安装可用 | 🟡 已安装（特定项目）| 🔗 symlink 可用

### 3.1 内置 Skill — 代码理解与审查

| Skill | 状态 | 类型 | 描述 |
|-------|------|------|------|
| **code-review** | 🟢 | 目录 | 多维度代码审查（正确性/安全/性能/简化） |
| **code-simplifier** | 🟢 | 目录 | 代码简化重构（只做优化，不找 Bug） |
| **webapp-testing** | 🟢 | 目录 | Web 应用端到端测试（Playwright） |

### 3.2 内置 Skill — 设计与规划

| Skill | 状态 | 类型 | 描述 |
|-------|------|------|------|
| **brainstorming** | 🟢 | 目录 | 需求澄清 + 方案对比 + 设计文档 |
| **planning-with-files-zh** | 🟢 | 目录 | 中文版多步骤任务规划与跟踪 |
| **project-kickstart** | 🟢 | 目录 | 新项目启动引导和架构设计 |

### 3.3 内置 Skill — 自动化与编排

| Skill | 状态 | 类型 | 描述 |
|-------|------|------|------|
| **harness** | 🟢 | 目录 | 多会话自主工作、检查点、故障恢复 |
| **project-harness** | 🟢 | 目录+文件 | 项目级任务编排层（跨会话/重试/依赖管理） |
| **ralph-loop** | 🟢 | 目录 | Ralph 迭代循环优化 |
| **find-skills** | 🟢 | 目录 | 查找和发现可用 Skill |

### 3.4 内置 Skill — 工具

| Skill | 状态 | 类型 | 描述 |
|-------|------|------|------|
| **skill-creator** | 🟢 | 目录 | 创建/更新自定义 Skill |
| **mcp-builder** | 🟢 | 目录 | 构建自定义 MCP Server |
| **pptx** | 🟢 | 目录 | 创建/编辑 PPT 演示文稿 |
| **snapview** | 🟢 | 目录 | 截图注入上下文（视觉问题调试） |

### 3.5 Superpowers 插件 Skill（14 个）

> 版本：5.1.0 | 来源：claude-plugins-official (user scope)

| Skill | 描述 | 触发方式 |
|-------|------|---------|
| **using-superpowers** | Superpowers 系统使用入口 | 自动触发 |
| **brainstorming** | 创造性任务前的需求澄清与设计 | `/brainstorming` |
| **writing-plans** | 编写详细实施计划 | `/writing-plans` |
| **executing-plans** | 按计划逐步执行 | `/executing-plans` |
| **test-driven-development** | TDD 测试驱动开发流程 | `/test-driven-development` |
| **systematic-debugging** | 系统性调试方法论 | `/systematic-debugging` |
| **verification-before-completion** | 任务完成前验证改动 | `/verification-before-completion` |
| **subagent-driven-development** | 子代理驱动的并行开发 | `/subagent-driven-development` |
| **dispatching-parallel-agents** | 调度多个并行代理 | `/dispatching-parallel-agents` |
| **requesting-code-review** | 请求代码审查 | `/requesting-code-review` |
| **receiving-code-review** | 接收并处理代码审查意见 | `/receiving-code-review` |
| **finishing-a-development-branch** | 完成开发分支（合并前检查） | `/finishing-a-development-branch` |
| **using-git-worktrees** | Git Worktree 隔离工作空间 | `/using-git-worktrees` |
| **writing-skills** | 编写新的 Skill | `/writing-skills` |

### 3.6 Understand-Anything 插件 Skill（8 个）

> 版本：2.7.6 | 来源：understand-anything (user scope)

| Skill | 描述 | 触发方式 |
|-------|------|---------|
| **understand** | 代码库理解入口（自动选择最佳子 Skill） | `/understand` |
| **understand-chat** | 与代码库对话（问答式探索） | `/understand-chat` |
| **understand-dashboard** | 知识图谱可视化仪表盘 | `/understand-dashboard` |
| **understand-diff** | 差异分析（对比代码改动） | `/understand-diff` |
| **understand-domain** | 业务领域分析（提取业务逻辑） | `/understand-domain` |
| **understand-explain** | 代码解释（详细讲解） | `/understand-explain` |
| **understand-knowledge** | 知识图谱查询与检索 | `/understand-knowledge` |
| **understand-onboard** | 新成员项目上手引导 | `/understand-onboard` |

### 3.7 Git 提交插件 Skill（3 个）

> 来源：claude-plugins-official (project: 菲尼克斯)

| Skill | 描述 | 触发方式 |
|-------|------|---------|
| **commit** | 创建规范的 git commit | `/commit` |
| **commit-push-pr** | 提交 + 推送 + 创建 PR 一条龙 | `/commit-push-pr` |
| **clean_gone** | 清理远程已删除的本地分支 | `/clean_gone` |

### 3.8 其他插件 Skill

| Skill | 插件 | 触发方式 |
|-------|------|---------|
| **session-report** | session-report | `/session-report` |
| **skill-creator** | skill-creator (user) | `/skill-creator` |

---

## 4. 插件 Skill 详解

### 4.1 Superpowers — 开发方法论矩阵

```
Superpowers 把开发纪律变成自动执行的流程。

        规划阶段              执行阶段              收尾阶段
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ brainstorming │───▶│ TDD          │───▶│ verification │
    │ writing-plans │    │ debugging    │    │ code-review  │
    │               │    │ subagent-dev │    │ finishing    │
    └──────────────┘    │ parallel-ag  │    └──────────────┘
                        └──────────────┘
```

### 4.2 Understand-Anything — 代码理解矩阵

```
/understand           → 自动选择最佳方式
  ├── /understand-chat       → 对话式探索
  ├── /understand-domain     → 业务领域建模
  ├── /understand-explain    → 深度代码讲解
  ├── /understand-knowledge  → 知识图谱检索
  ├── /understand-diff       → 改动差异分析
  ├── /understand-dashboard  → 可视化浏览
  └── /understand-onboard    → 新成员引导
```

### 4.3 Commit-Commands — Git 工作流

```
/commit            → 生成规范 commit message → git commit
/commit-push-pr    → 上述 + git push + 创建 PR
/clean_gone        → 清理远程已删除的分支
```

---

## 5. Agent Skills 目录

### 5.1 设计类 Skill (`~/.agents/skills/`)

| Skill | 描述 | 风格/用途 |
|-------|------|---------|
| **design-taste-frontend** | 前端设计品味检查 | 通用前端审美 |
| **design-taste-frontend-v1** | 前端设计品味 v1 | 另一套设计标准 |
| **minimalist-ui** | 极简 UI 设计 | 简洁、留白、克制 |
| **industrial-brutalist-ui** | 工业粗野主义 UI | 原始、大胆、反精致 |
| **high-end-visual-design** | 高端视觉设计 | 精品、细腻、高级感 |
| **image-to-code** | 图片转代码 | 设计稿/截图 → 代码 |
| **imagegen-frontend-web** | Web 截图生成 | AI 生成 Web 界面 |
| **imagegen-frontend-mobile** | Mobile 截图生成 | AI 生成移动端界面 |
| **diagram-design** | 图表设计 | 架构图、流程图、UML |
| **brandkit** | 品牌视觉套件 | Logo、配色、字体系统 |
| **stitch-design-taste** | 设计品味缝合 | 混合多种设计风格 |
| **redesign-existing-projects** | 已有项目重设计 | UI 翻新、视觉升级 |
| **impeccable** | 无瑕设计 | 像素级精细打磨 |
| **gpt-taste** | GPT 风格设计品味 | OpenAI/GPT 审美风格 |

### 5.2 知识类 Skill

| Skill | 描述 |
|-------|------|
| **llm-wiki** | LLM 知识百科（模型/架构/论文） |

### 5.3 输出控制

| Skill | 描述 |
|-------|------|
| **full-output-enforcement** | 强制完整输出（防截断） |

### 5.4 文件格式

| Skill | 描述 |
|-------|------|
| **xmind** | XMind 思维导图创建/编辑 |

---

## 6. Skill 安装与创建

### 6.1 从插件市场安装

```bash
# 在 Claude Code 中
/plugin

# 或者在终端
claude plugin
```

### 6.2 手动安装 Skill

```bash
# 方式 1：复制到用户 Skill 目录
cp -r /path/to/my-skill ~/.claude/skills/

# 方式 2：创建 symlink（推荐，便于更新）
ln -s /path/to/my-skill ~/.claude/skills/my-skill

# 方式 3：项目级安装
cp -r /path/to/my-skill /path/to/project/.claude/skills/
```

### 6.3 创建自定义 Skill

```bash
/skill-creator     # 使用 skill-creator
/writing-skills    # 使用 superpowers 的 writing-skills
```

### 6.4 Skill 文件基本结构

```
my-skill/
├── SKILL.md          ← 必需：Skill 定义（含 frontmatter）
├── scripts/          ← 可选：辅助脚本
├── references/       ← 可选：参考文档
└── assets/           ← 可选：静态资源
```

---

## 7. 场景 × 推荐 Skill 组合

### 🆕 新功能开发

```
/brainstorming → /writing-plans → /test-driven-development
→ /verification-before-completion → /code-review → /commit-push-pr
```

### 🐛 Bug 修复

```
/systematic-debugging → 修复 → /verify → /code-review → /commit
```

### 📖 学习陌生代码库

```
/understand-onboard → /understand-domain → /understand-explain
→ /understand-knowledge
```

### 🎨 UI/设计工作

```
/image-to-code → /design-taste-frontend → /minimalist-ui
→ /high-end-visual-design
```

### 🏗️ 架构设计

```
/brainstorming → /deep-research → /understand-domain
→ /diagram-design → /planning-with-files-zh
```

### 🔄 大规模重构

```
/understand → /planning-with-files-zh → /subagent-driven-development
→ /code-review → /verification-before-completion
→ /finishing-a-development-branch
```

### 🤖 长时间自主任务

```
/harness → Claude Code 自动认领、执行、验证、重试
```

---

## 附录：Skill 统计

| 来源 | 数量 | 说明 |
|------|------|------|
| 内置 Skill (`~/.claude/skills/`) | 16 | 目录型 + 文件型 |
| Superpowers 插件 | 14 | 开发方法论 |
| Understand-Anything 插件 | 8 | 代码理解与知识图谱 |
| Commit-Commands 插件 | 3 | Git 工作流 |
| Session-Report 插件 | 1 | 会话报告 |
| Skill-Creator 插件 | 1 | Skill 创建 |
| Agent Skills (symlink) | 18 | 设计/知识/工具类 |
| **总计** | **61** | — |

---

> **最后更新**: 2026-06-08
> **配套文档**: ../tools/claude-code-commands.md / ../tools/cc-connect-commands.md
