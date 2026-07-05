---
title: "bb-browser 卡顿优化实战：从根源解决 404 和操作超时"
description: "从 Pi 编码代理 + bb-browser 卡顿问题出发，深入排查 5 个根因，并实施完整的自动恢复、日志捕获、健康监控等工程化优化方案"
date: 2026-07-05T00:00:00.000Z
tags: ["bb-browser", "Pi", "Chrome", "CDP", "Debug", "AI工具", "优化"]
---

## 背景

在上一篇 [bb-browser 卡顿与 404 问题排查指南](/posts/bb-browser-troubleshooting-guide) 中，我分析了使用 Pi 编码代理 + bb-browser 时频繁卡顿的 5 个根因。本篇是实战篇——**把分析结果落地为具体的优化措施**。

## 问题回顾

经过排查，核心问题有 5 个：

| # | 问题 | 影响 |
|---|------|------|
| 1 | Tab 坏请求堆积 | 渲染进程被阻塞，CDP 命令排队 |
| 2 | CDP 命令超时 30 秒 | 失败前要干等半分钟 |
| 3 | Daemon 日志被丢弃到 /dev/null | 黑盒排障，无从下手 |
| 4 | Chrome 长期不重启 | 内存 1.7GB，响应越来越慢 |
| 5 | 缺乏自动恢复机制 | 卡死后只能手动重启 |

## 优化方案

### 方案一：Pi 扩展增强——自动恢复 + 新增工具

Pi 通过 TypeScript 扩展暴露 bb-browser 工具。原来的扩展只有被动检查 daemon 是否运行，没有任何恢复逻辑。

**改动点**：`/home/w/.pi/agent/extensions/bb-browser.ts`

#### 1.1 自动重启恢复机制

原来的 `ensureDaemon()` 只有简单的状态检查：

```typescript
// 优化前：失败就直接返回
async function ensureDaemon(): Promise<boolean> {
    if (daemonRunning) return true;
    const status = await bb(["daemon", "status"], 10_000);
    if (status.code === 0 && status.stdout.includes("running")) {
      daemonRunning = true;
      return true;
    }
    const start = await bb(["daemon", "start"], 15_000);
    return start.code === 0;
}
```

优化后增加了自动重启和防递归锁：

```typescript
// 优化后：失败时自动尝试完全重启
async function ensureDaemon(): Promise<boolean> {
    if (daemonRunning) return true;
    // ...检查状态...
    // 如果 CDP 未连接，先停再启
    await bb(["daemon", "stop"], 8_000);
    await pi.sleep(1000);
    const start = await bb(["daemon", "start"], 20_000);
    // ...
}
```

关键改进：
- 状态检查不仅看 daemon 是否运行，还检查 **CDP connected** 标志
- 增加 `daemonRestarting` 防递归锁，避免无限重试
- 所有工具在 daemon 连接失败时自动调用 `ensureDaemon` 恢复

#### 1.2 新增 `bb_browser_cleanup` 工具

这是最重要的新增工具——一键清理所有状态：

```typescript
pi.registerTool({
    name: "bb_browser_cleanup",
    description: "Close all open tabs and restart the daemon...",
    parameters: {
        force: optional boolean // 强制重启
    },
    async execute() {
        // 1. 停止 daemon
        // 2. 杀死 Chrome CDP 进程（清除所有 tab）
        // 3. 等待 2 秒
        // 4. 启动全新 daemon（自动生成新的 Chrome）
        // 返回清理结果
    }
});
```

这个工具会：
1. 停止 daemon → 2. 杀 Chrome → 3. 等待 → 4. 启动新 daemon + 新 Chrome

Chrome 的 `user-data-dir` 是持久化的，所以 **cookies 和登录状态不会丢失**。

#### 1.3 新增 `restart` action

在原有的 `bb_browser_daemon` 工具中增加了 `restart` action：

```typescript
action: StringEnum(["start", "stop", "restart", "status"])
```

#### 1.4 提示词优化（promptGuidelines）

在每个工具的 `promptGuidelines` 中加入了最佳实践指引：

| 工具 | 新增指引 |
|------|---------|
| navigate | 强调用完必须 close；优先用 eval 而非 snap；复杂 SPA 预期会慢 |
| eval | 明确标注 PREFER eval over snapshot |
| snapshot | 标注提取文本用 eval 替代 |
| tabs | 提醒超过 2-3 个 tab 时要关闭 |
| site | 强调 site adapter 优于打开完整页面 |
| daemon | 介绍 restart action |

这些提示词会直接注入到 AI 模型的 system prompt 中，从源头引导正确的使用习惯。

### 方案二：Daemon 日志捕获——告别黑盒

bb-browser 的 `daemon start` 命令在源码中这样启动 daemon：

```javascript
const child = spawn(process.execPath, daemonArgs, {
    detached: true,
    stdio: "ignore"  // ← stdout/stderr 全部丢弃
});
```

所有 daemon 的输出都去了 `/dev/null`。任何错误信息、异常堆栈、连接断开警告都不可见。

**解决方案**：创建一个包装脚本，直接启动 `daemon.js` 并捕获输出。

```bash
#!/usr/bin/env bash
# bb-browser-daemon.sh — 日志包装脚本

# 找到 daemon.js 路径
DAEMON_JS="/path/to/bb-browser/dist/daemon.js"

# 直接启动 daemon.js，输出重定向到日志文件
nohup node "${DAEMON_JS}" --cdp-host 127.0.0.1 --cdp-port 9222 \
    >> ~/.bb-browser/logs/daemon.log 2>&1 &
```

优化前 vs 优化后的日志对比：

```
# 优化前：/dev/null，什么都看不到
/proc/231/fd/1 → /dev/null

# 优化后：清晰的内部日志
[Daemon] Chrome already running on port 9222
[Daemon] HTTP server listening on http://127.0.0.1:19824
[Daemon] Auth token: d4578366e580275e9123809c3cac1492
[Daemon] Connecting to Chrome CDP at 127.0.0.1:9222...
[Daemon] CDP connected, monitoring 1 tab(s)
```

包装脚本还提供了：
- **日志轮转**：超过 10MB 自动压缩归档
- **自动清理**：7 天前的日志自动删除
- **PID 跟踪**：记录 daemon 进程 ID 便于管理

### 方案三：健康监控 + 自动恢复

每隔 2 小时自动检查 daemon 健康状况：

```bash
#!/usr/bin/env bash
# bb-browser-health.sh — 健康监控脚本

# 检查项目：
# 1. Daemon 进程是否存在？→ 不存在则启动
# 2. CDP 是否已连接？→ 未连接则重启
# 3. Chrome 运行是否超过 4 小时？→ 超过则重启
# 4. Tab 数量是否超过 3 个？→ 超过则重启
```

通过 cron 定时执行：

```cron
# 每 2 小时检查一次
0 */2 * * * /home/w/.local/bin/bb-browser-health.sh check
# 每天凌晨 3 点清理旧日志
0 3 * * * /home/w/.local/bin/bb-browser-daemon.sh clean
```

同时在 Pi 扩展中增加了**主动防御**——所有工具在调用前都会检查 daemon 健康状态，不依赖定时任务。

### 方案四：快捷别名

```bash
alias bb-status='bb-browser daemon status'
alias bb-restart='bb-browser daemon stop; sleep 1; bb-browser daemon start'
alias bb-tabs='bb-browser tab list'
alias bb-close='bb-browser close'
alias bb-logs='bb-browser-daemon.sh logs'
alias bb-cleanup='bb-browser-daemon.sh restart'
alias bb-health='bb-browser-health.sh --status'
```

## 验证结果

### 优化前状态

| 指标 | 数值 |
|------|------|
| daemon 运行时间 | 1h13min |
| Chrome 内存占用 | 1.7 GB |
| 累计操作命令数 | 1504 条 |
| 打开标签页数 | 3 个 |
| 坏请求数（tab 5c04） | 67 个 |
| 日志 | 不可见（→ /dev/null） |

### 优化后状态

| 指标 | 数值 |
|------|------|
| daemon 运行时间 | 刚重启 |
| Chrome 内存占用 | ~200 MB |
| 累计操作命令数 | 0（全新） |
| 打开标签页数 | 1 个或 0 个 |
| 坏请求数 | 0 |
| 日志 | 实时捕获到文件 |

### 功能验证

| 测试项 | 结果 |
|--------|------|
| Daemon 日志捕获 | ✅ 正常工作 |
| 完全重启（杀 Chrome） | ✅ tab 全部清除 |
| Site adapter | ✅ 正常返回数据 |
| 打开/关闭 tab | ✅ 正常 |
| 健康检查脚本 | ✅ 报告正确 |
| 定时 Cron 任务 | ✅ 已安装 |

## 文件清单

优化涉及 5 个文件：

| 文件 | 说明 | 行数 |
|------|------|------|
| `/home/w/.pi/agent/extensions/bb-browser.ts` | Pi 扩展（11 个工具，含新增 cleanup） | 844 |
| `/home/w/.local/bin/bb-browser-daemon.sh` | Daemon 日志包装脚本 | 160 |
| `/home/w/.local/bin/bb-browser-health.sh` | 健康监控脚本（cron 调用） | 142 |
| `/home/w/.pi/agent/skills/bb-browser/SKILL.md` | Skill 文档（加入使用规范） | 更新 |
| `~/.bashrc` | Bash 别名 | 追加 |

## 总结

这次优化不只是解决"卡顿"这个表面问题，而是做了整套**工程化改进**：

| 层面 | 措施 | 效果 |
|------|------|------|
| **恢复** | 自动重启 + cleanup 工具 | 卡顿时一键恢复 |
| **可见性** | 日志捕获到文件 | 从黑盒变透明 |
| **预防** | 每 2h 健康检查 + 自动重启 | 问题在发生前被消灭 |
| **习惯** | prompt 指引 + 别名 | 从源头引导最佳实践 |

最有价值的一点是：**日志从 /dev/null 变成了可读文件**。以前 daemon 内部发生了什么完全是黑盒，现在任何异常都能第一时间看到：

```bash
# 查看 daemon 日志
bb-logs
# 或
cat ~/.bb-browser/logs/daemon.log
```

如果你也用 pi + bb-browser，建议把这三样东西配齐：**自动恢复机制、日志捕获、健康监控**。它们不仅解决卡顿问题，更让你在遇到新问题时能快速定位根因。
