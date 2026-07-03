---
title: "为 Pi Coding Agent 装上\\\"搜索引擎\\\"——pi-web-access 安装记"
description: "Pi Coding Agent 的 Plan Mode 扩展（~/.pi/agent/extensions/plan-mode/）提供只读探索模式，让 LLM 先分析代码、制定计划，再选择执行。但在使用中发现多个问题。"
date: 2026-06-19T00:00:00.000Z
tags: ["pi"]
---

# 为 Pi Coding Agent 装上"搜索引擎"——pi-web-access 安装记

## 背景

Pi Coding Agent 的 Plan Mode 扩展（`~/.pi/agent/extensions/plan-mode/`）提供只读探索模式，让 LLM 先分析代码、制定计划，再选择执行。但在使用中发现多个问题。

## 问题清单

### 1\. `/plan` 进入计划模式后 LLM 回复，但选择对话框不弹出

**根因**：`extractTodoItems()` 的 Plan 标题正则只匹配 `Plan:` 一种格式。如果 LLM 输出 `## Plan`、`Plan：`（中文冒号）等变体，提取返回空数组，`agent_end` 处理器静默返回，用户看不到任何反馈。

**修复**：扩展为 4 种标题匹配模式——英文冒号、中文冒号 `Plan：`、Markdown 标题 `## Plan`、纯行首 `Plan`。同时列表格式支持有序列表 fallback 到无序列表 `- xxx` / `* xxx`。

### 2\. `agent_end` 中异常被静默吞掉

**根因**：`agent_end` 事件处理器没有 `try-catch`。扩展 runner 的 `emit()` 方法会 catch 所有异常并仅记录到 error listeners，用户完全无感知。

**修复**：用 `try-catch` 包裹整个处理器，异常时通过 `ctx.ui.notify()` 弹出 `❌ error` 通知。

### 3\. 提取 Plan 失败时无反馈

**根因**：`extractTodoItems` 返回空数组时，原代码仍使用旧的 `todoItems`（上一次成功的 Plan 步骤），导致对话框内容过时。

**修复**：提取失败时通过 `ctx.ui.notify()` 弹出 `⚠️ warning` 通知并 `return`，避免误用旧数据。

### 4\. 退出 Plan Mode 时丢失扩展工具

**根因**：退出时使用硬编码的 `NORMAL_MODE_TOOLS = ["read", "bash", "edit", "write"]`，导致 `web_search`、`fetch_content`、`bb_browser_*` 等扩展工具全部丢失。

**修复**：进入 plan 模式前通过 `pi.getActiveTools()` 保存当前工具列表到 `savedToolsBeforePlan`，退出时通过 `restoreNormalTools()` 完整恢复。

### 5\. "Another plan" 选后无反应

**根因**：原代码分支为空，只留注释，没有实际触发任何操作。

**修复**：清空 `todoItems` + `pi.sendUserMessage()` 主动触发 LLM 重新生成新 Plan，消息中明确要求以 "Plan:" 开头、编号列表形式输出。

### 6\. "Refine the plan" 选后直接执行计划

**根因**：LLM 在 plan mode 下仍有只读工具可用，导致它先执行工具再生成 Plan。

**修复**：在用户消息中嵌入"不要使用任何工具"的指令，让 LLM 只输出纯文本 Plan。

## 技术要点

*   **扩展事件模型**：`agent_end` 异常必须自行捕获，runner 不会传播。
*   **工具列表管理**：`pi.setActiveTools()` 会**替换**整个工具列表，不是追加。
*   **消息注入时机**：`pi.sendUserMessage()` 在 `agent_end` 内调用时，用 `{ deliverAs: "steer" }`。
*   **上下文指令**：更可靠的方式是把指令直接拼入用户消息。

## 改动文件

*   `~/.pi/agent/extensions/plan-mode/utils.ts` — `extractTodoItems` 改进
*   `~/.pi/agent/extensions/plan-mode/index.ts` — 错误处理、工具恢复、交互逻辑修复

## 测试验证

所有 5 个对话框选项已实测通过：

*   **Plan 提取** ✅ — 对话框正常弹出
*   **Another plan** ✅ — 清空旧步骤，LLM 重新计划
*   **Refine the plan** ✅ — 提交后 LLM 不调工具直接输出优化 Plan
*   **Execute the plan** — 进入执行模式
*   **Exit plan mode** — 退出后工具完整恢复