# AI-architecture

## 项目背景

Vibecoding 资源目录 — 多维度记录与发现 vibecoding 工具、资源和实践的静态网站。
部署于 GitHub Pages，纯前端（HTML + CSS + vanilla JS）。

- 上游系统：无（纯静态，数据来自 `data/catalog.json`）
- 下游系统：GitHub Pages 托管
- 核心职责：展示四个维度的 vibecoding 资源（提示词模板、Harness机制、MCP服务器、Skill技能），
  支持搜索过滤和标签筛选

## 项目目标

为个人 vibecoding 实践建立一个可快速查阅的"武器库"。
每条记录只需名称 + 描述，一页全览，Git 版本控制保证数据不丢失。

当前阶段：第一版已实现，待推送到 GitHub Pages。

## 目录结构规范

```
.
├── CLAUDE.md                  # 项目指令文件（AI 协作入口）
├── index.html                 # 单页面应用入口
├── css/
│   └── style.css              # 样式（4 类别独立强调色）
├── js/
│   └── app.js                 # 数据加载、渲染、搜索/过滤
├── data/
│   └── catalog.json           # 结构化资源数据（核心数据文件）
├── .claude/
│   ├── settings.json          # Claude Code 配置（hooks、权限等）
│   ├── settings.local.json    # 本地个性化配置
│   ├── hooks/                 # 质量门禁脚本
│   │   ├── ...                # （同上）
│   ├── agents/                # Subagent 定义
│   │   └── ...
│   ├── rules/                 # 路径级规则
│   │   ├── code-rules.md          # 代码规范
│   │   └── documentation-rules.md # 文档规范
│   └── projects/              # Memory 持久化
│       └── MEMORY.md          # 记忆索引
├── harness-tasks.json         # Harness 任务列表
├── harness-init.sh            # Harness 初始化脚本
├── .gitignore
└── .git/
```

## 工作流程

1. 确认当前迭代任务（见下方"当前迭代状态"）
2. 遵循 `.claude/rules/` 中的规范进行开发
3. 产出后自动触发质量门禁（hooks）
4. 关键决策记录到 Memory 系统

## 文档规范

### 命名规范
- 文件名使用小写连字符（kebab-case），不含空格和特殊字符
- 文档以一级标题 `# ` 开头
- 代码块指定语言类型

### Markdown规范
- 表格必须有分隔行 `|:--|:--|`
- Mermaid 图非空且语法正确
- 自动检查由 `validate_markdown.sh` hook 执行

### 版本控制
- 使用 Git 管理
- 提交信息格式：`<type>: <简短描述>`
- 禁止强制推送到 main/master 分支

## 关键术语

| 术语 | 全称 | 说明 |
|:--|:--|:--|
| 待补充 | — | 项目术语将在需求澄清后填充 |

## AI协作约束

### 必须遵守的原则
1. 永远不要不经确认就覆盖已有文件 — 使用 Edit 做增量修改
2. 修改规范/规则文件前评估影响范围
3. 不在 main/master 分支直接工作
4. 关键决策写入 Memory 系统（.claude/projects/）

### 推荐的工作方式
- 大文件读取委托 subagent（universal-analyzer），主 Context 只收摘要
- 产出物完成后调用 universal-validator 做质量审核
- 标识符/编号问题调用 universal-checker 检查一致性

### Memory 写入触发时机
- 发现命名/编号规则冲突时
- 确认特殊约定时
- 用户反馈纠正时
- 跨模块关联发现时

### 可用 Subagents
| Subagent | 用途 | 模型 |
|:--|:--|:--|
| universal-analyzer | 领域分析、大文件处理 | sonnet |
| universal-checker | 规范一致性检查 | haiku |
| universal-validator | 产出物质量审核 | haiku |

## 当前迭代状态

### 正在开发
- 项目初始化：工程基础设施已搭建
- 第一版网站已完成：HTML/CSS/JS + data/catalog.json
- 待推送到 GitHub 并启用 GitHub Pages

### 当前项目状态
- 目录：`E:/AI-architecture`
- 分支：main
- 技术栈：HTML + CSS + vanilla JS，部署于 GitHub Pages
- 最近完成：第一版网站（2026-06-05）
- 当前任务：推送到 GitHub，启用 Pages

### 本次迭代约束
- 优先快速出原型
- 纯静态，无需构建工具
- 数据通过编辑 catalog.json + git commit 更新

### 全局文档规范
- 遵循 `.claude/rules/documentation-rules.md` 中的规则
- 文档自动检查已启用（validate_markdown.sh）

## 更新记录

| 日期 | 变更 | 原因 |
|:--|:--|:--|
| 2026-06-05 | 初始化 CLAUDE.md | 项目启动，部署 project-harness 基础设施 |
