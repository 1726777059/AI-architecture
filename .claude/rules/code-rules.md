---
paths:
  - "src/**"
  - "lib/**"
  - "*.py"
  - "*.js"
  - "*.ts"
  - "*.go"
  - "*.rs"
  - "*.java"
---

# AI-architecture 代码规范（自动加载于源码目录）

## 命名规范

- 文件名：小写下划线（snake_case）或小写连字符（kebab-case），与项目语言约定一致
- 类名：大驼峰（PascalCase）
- 函数名：小驼峰（camelCase）或小写下划线，与项目语言约定一致
- 常量：全大写下划线（UPPER_SNAKE_CASE）
- 私有成员：下划线前缀（_privateMember）

## 代码结构

- 单个函数不超过 80 行
- 单个文件不超过 500 行
- 函数参数不超过 5 个
- 嵌套层级不超过 4 层

## 注释规范

- 所有公共函数必须有 docstring
- 复杂逻辑必须有行内注释
- 使用语言标准的 docstring 风格（JSDoc / docstring / GoDoc 等）

## 测试规范

- 单元测试覆盖率 > 70%
- 测试文件命名：`*.test.*` 或 `test_*.*`
- 推荐使用项目生态的标准测试框架

## Git 规范

### 分支策略
- main/master：生产分支
- develop：开发分支
- feature/*：功能分支

### 提交信息格式
```
<type>: <简短描述>

<详细描述>
```

## AI 协作约束

### 必须遵守
1. 不要在 main/master 分支直接工作
2. 修改前先确认当前分支和目标分支

### 禁止操作
- 强制推送到受保护分支（main/master）
- 跳过代码审查直接合并
- 提交包含密钥/令牌的代码
