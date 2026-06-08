# cc-connect 使用手册

> [AI-ARCH]-[DOC]-[TOOLS-002] — cc-connect v1.3.3-beta.4
> 将本地 AI Coding Agent 桥接到即时通讯平台
> 支持 Agent：Claude Code / Codex / Cursor / Gemini CLI / Qoder CLI / OpenCode
> 支持平台：飞书 / 微信 / Telegram / Slack / 钉钉 / Discord / LINE / 企业微信 / QQ

---

## 目录

1. [核心概念](#1-核心概念)
2. [安装与启动](#2-安装与启动)
3. [守护进程管理 (daemon)](#3-守护进程管理-daemon)
4. [平台对接](#4-平台对接)
5. [会话管理 (sessions)](#5-会话管理-sessions)
6. [消息发送 (send)](#6-消息发送-send)
7. [定时任务 (cron)](#7-定时任务-cron)
8. [跨项目消息中继 (relay)](#8-跨项目消息中继-relay)
9. [Provider 管理](#9-provider-管理)
10. [配置管理 (config)](#10-配置管理-config)
11. [更新升级](#11-更新升级)
12. [常用场景速查](#12-常用场景速查)

---

## 1. 核心概念

```
┌──────────────────────────────────────────────────────────────┐
│                      cc-connect 架构                          │
│                                                               │
│  您的手机/PC                    您的开发机                      │
│  ┌────────────┐               ┌──────────────────────────┐    │
│  │  微信/飞书  │────消息──────▶│     cc-connect daemon     │    │
│  │  Telegram  │               │          │                │    │
│  │  Slack     │◀──回复────────│          ▼                │    │
│  │  ...       │               │   Claude Code / Codex    │    │
│  └────────────┘               │   Cursor / Gemini CLI    │    │
│                               │   读写您的项目文件         │    │
│                               └──────────────────────────┘    │
│                                                               │
│  核心能力：                                                    │
│  ✅ 在手机上通过聊天 App 指挥 AI 写代码                          │
│  ✅ 多会话并行（每个聊天窗口 = 一个独立 Agent 会话）             │
│  ✅ 会话切换（/switch 命令）                                   │
│  ✅ 定时任务（cron 命令）                                      │
│  ✅ 跨项目中继（relay 命令）                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 安装与启动

### 安装

```bash
# npm 全局安装
npm install -g cc-connect

# 或直接下载二进制
# 从 GitHub Releases 下载: https://github.com/chenhg5/cc-connect/releases
```

### 启动方式

```bash
# 方式 1：直接启动（前台运行，调试用）
cc-connect

# 方式 2：使用自定义配置启动
cc-connect --config /path/to/config.toml

# 方式 3：强制重启（杀掉已有实例）
cc-connect --force

# 方式 4：安装为系统服务（推荐）
cc-connect daemon install
```

### 查看版本

```bash
cc-connect --version
```

---

## 3. 守护进程管理 (daemon)

> 将 cc-connect 安装为系统服务，开机自启，后台静默运行。

```bash
# 安装系统服务
cc-connect daemon install      # Windows: 计划任务 / Linux: systemd / macOS: launchd

# 卸载系统服务
cc-connect daemon uninstall

# 手动控制
cc-connect daemon start         # 启动
cc-connect daemon stop          # 停止
cc-connect daemon restart       # 重启
cc-connect daemon status        # 查看状态

# 查看日志
cc-connect daemon logs          # 查看最近日志
cc-connect daemon logs -f       # 实时跟踪日志
cc-connect daemon logs -n 100   # 查看最近 100 条
```

### Windows 计划任务管理

```bash
# 查看计划任务详情
schtasks /query /tn "cc-connect" /v /fo LIST

# 手动运行
schtasks /run /tn "cc-connect"

# 手动停止
schtasks /end /tn "cc-connect"
```

---

## 4. 平台对接

### 微信 (Weixin / ilink)

```bash
# 方式 1：扫码登录
cc-connect weixin setup

# 方式 2：强制重新扫码
cc-connect weixin new

# 方式 3：绑定已有 token
cc-connect weixin bind --token <your-ilink-bot-token>
```

### 飞书 / Lark

```bash
# 智能设置（已有 --app 信息时绑定，否则创建新 Bot）
cc-connect feishu setup

# 强制创建新 Bot（QR 扫码）
cc-connect feishu new

# 绑定已有应用
cc-connect feishu bind --app <app_id> --secret <app_secret>
```

### 其他平台

在 `config.toml` 中配置对应平台的 bot token / webhook / API key：

```toml
# config.toml 示例片段
[platforms.telegram]
bot_token = "YOUR_BOT_TOKEN"

[platforms.slack]
bot_token = "xoxb-YOUR-TOKEN"
app_token = "xapp-YOUR-TOKEN"

[platforms.dingtalk]
webhook = "https://oapi.dingtalk.com/robot/send?access_token=XXX"
```

---

## 5. 会话管理 (sessions)

> 每个聊天窗口对应一个独立 Agent 会话。cc-connect 自动管理会话隔离。

### 在聊天平台中使用（斜杠命令）

| 命令 | 功能 | 示例 |
|------|------|------|
| `/new` | 创建新会话 | `/new` → 新会话已创建 |
| `/list` | 列出所有会话 | `/list` → 会话 #1: WCS 开发 / 会话 #2: 代码审查 |
| `/switch <id>` | 切换到指定会话 | `/switch 2` → 已切换到会话 #2 |
| `/current` | 查看当前会话 | `/current` → 当前会话: #1 WCS 开发 |

### 在终端中管理会话历史

```bash
# 列出所有会话（管道友好输出）
cc-connect sessions list

# 查看某个会话的消息
cc-connect sessions show <session_id>

# 查看某个会话最近 N 条消息
cc-connect sessions show <session_id> -n 50

# 获取当前 Agent 会话 ID
cc-connect agent-sid
```

---

## 6. 消息发送 (send)

> 通过内部 API 向指定会话发送消息，常用于脚本/自动化场景。

```bash
# 发送文本消息
cc-connect send -m "你好，帮我检查 PR #42 的状态"

# 从 stdin 读取消息内容
echo "运行 pytest 并汇报结果" | cc-connect send --stdin

# 指定项目和会话
cc-connect send -m "审查最近的改动" -p my-project -s session-abc123
```

---

## 7. 定时任务 (cron)

> 在聊天平台中设置定时提醒和周期性任务。

```bash
# 创建定时任务
cc-connect cron add -c "0 9 * * 1-5" --prompt "每天早上 9 点检查 CI 状态"

# 列出所有定时任务
cc-connect cron list

# 删除指定定时任务
cc-connect cron del <task_id>
```

### Cron 表达式格式

```
分钟  小时  日  月  星期
 0     9    *   *   1-5     ← 工作日每天 9:00
 */30  *    *   *   *       ← 每 30 分钟
 0    18    *   *   *       ← 每天 18:00
 0     0    1   *   *       ← 每月 1 号 0:00
```

---

## 8. 跨项目消息中继 (relay)

> 让不同项目/会话之间互相发送消息和获取响应。

```bash
# 向另一个项目发送消息并获取回复
cc-connect relay send --project other-project --message "帮我查看那边的数据库状态"
```

---

## 9. Provider 管理

> 管理不同项目的 API provider（模型供应商），支持从 cc-switch 导入。

```bash
# 为项目添加 provider
cc-connect provider add --project my-project --name openrouter --api-key sk-xxx

# 列出项目的所有 provider
cc-connect provider list --project my-project

# 删除 provider
cc-connect provider remove --project my-project --name openrouter

# 从 cc-switch 导入 provider 配置
cc-connect provider import
```

---

## 10. 配置管理 (config)

```bash
# 生成完整配置示例
cc-connect config example

# 保存配置示例到文件
cc-connect config example > config.toml

# 格式化配置文件
cc-connect config format        # 或 cc-connect config fmt

# 查看当前使用的配置文件路径
cc-connect config path
```

### 配置文件位置

```
默认查找顺序：
1. 命令行指定：--config /path/to/config.toml
2. 当前目录：./config.toml
3. 用户目录：~/.cc-connect/config.toml
```

---

## 11. 更新升级

```bash
# 检查是否有更新
cc-connect check-update

# 更新到最新稳定版
cc-connect update

# 更新到最新 beta 版
cc-connect update --pre
```

---

## 12. 常用场景速查

### 场景 1：首次使用（微信）

```bash
# 1. 安装并启动守护进程
cc-connect daemon install

# 2. 配置微信对接
cc-connect weixin setup     # 扫码登录

# 3. 确认状态
cc-connect daemon status    # 查看守护进程状态
```

### 场景 2：多任务并行

```
在微信中：
  /new              → 创建会话 #2: 修 Bug
  /new              → 创建会话 #3: 写测试
  /list             → 查看所有会话
  /switch 1         → 切回会话 #1: 继续开发
  /current          → 确认当前在哪个会话
```

### 场景 3：定时检查 CI

```bash
# 工作日每小时检查一次 CI
cc-connect cron add -c "0 * * * 1-5" --prompt "检查当前分支的 CI 状态，如有失败通知我"
```

### 场景 4：异常排查

```bash
# 查看守护进程日志
cc-connect daemon logs -f

# 重启服务
cc-connect daemon restart

# 查看状态
cc-connect daemon status
```

---

> **最后更新**: 2026-06-08
> **配套文档**: claude-code-commands.md / skills/README.md
> **参考来源**: https://github.com/chenhg5/cc-connect
