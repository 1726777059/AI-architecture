# 任务 → Skill 映射表

> 遇到以下任务时，**必须命中对应 Skill**。未命中即为 **漏报 (Miss)**，需记录原因。

## 必命中规则（漏报 = 浪费 Token）

| 你让我做什么 | 必须用的 Skill | Token 节省 | 漏报代价 |
|:--|:--|:--|:--|
| 审查代码 / 检查改动 | `code-review` | ~2000 → 350 | 手工写审查 prompt ~2000 token |
| 简化/重构代码 | `code-simplifier` (simplify) | ~1500 → 350 | 手写重构规则 |
| 设计新功能 / 需求分析 | `brainstorming` | ~2500 → 500 | 手写设计 prompt |
| 制定多步骤计划 | `planning-with-files-zh` | ~2000 → 500 | 手写计划拆分 |
| 技术调研 / 查资料 | `deep-research` | ~3000 → 500 | 手动搜索+阅读 |
| 调试 Bug | `systematic-debugging` | ~2500 → 500 | 零散调试 |
| 写测试 | `test-driven-development` | ~2000 → 500 | 手写测试框架 |
| 提交代码 | `commit` / `commit-push-pr` | ~1000 → 200 | 手写 commit message |
| 验证改动是否生效 | `verify` | ~1500 → 300 | 手写验证步骤 |
| 启动项目 | `run` | ~800 → 200 | 手写启动命令 |
| 安全审计 | `security-review` | ~2000 → 500 | 手写安全检查 |
| 创建 PR 审查 | `review` | ~1500 → 400 | 手写 PR 审查 |
| 修改配置/权限 | `update-config` | ~500 → 200 | 手写 JSON |
| Web 应用测试 | `webapp-testing` | ~2000 → 400 | 手写 Playwright |
| 创建/编辑 PPT | `pptx` | ~1500 → 400 | 手写 pptxgenjs |
| 新建项目 | `init` / `project-kickstart` | ~2500 → 500 | 手写脚手架 |
| 学习陌生代码库 | `understand` / `understand-onboard` | ~3000 → 600 | 逐个文件读 |

## 可跳过规则（轻量任务，Skill 反而过重）

| 任务 | 为什么不用 Skill |
|:--|:--|
| 读一个文件内容 | 直接用 Read，不需要 Skill |
| 搜索一个关键词 | 直接用 Grep，不需要 Skill |
| 改一行代码 | 直接用 Edit，不需要 code-review |
| 回答简单问题 | 自然对话即可 |
| 创建/编辑任务 | 直接用 TaskCreate/TaskUpdate |
| 图片生成设计稿 | Skills 是评估用的，生成阶段直接用代码 |
| 创建思维导图 | 视情况，简单导图用 Mermaid 更直接 |

## 漏报记录格式

当该用 Skill 却没用时，在日志中追加：

```json
{"ts":"...","type":"miss","task":"审查 catalog.json","skill":"code-review","reason":"仅检查 JSON 语法，不涉及代码逻辑","est_waste":1500}
```
