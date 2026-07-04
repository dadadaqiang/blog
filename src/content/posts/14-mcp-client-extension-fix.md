---
title: "修复 Pi MCP Client 扩展：MCP SDK API 变更导致连接失败"
description: "记录修复 Pi 的 MCP Client 扩展时遇到的问题 - MCP SDK 1.29.0 版本 API 变更导致 getServerInfo() 方法不存在，需要改为 getServerVersion()"
date: 2026-07-04T00:00:00.000Z
tags: ["Pi", "MCP", "TypeScript", "Debug"]
---

## 问题描述

在使用 Pi 编码代理的 MCP Client 扩展连接 `excel-mcp-server` 时，遇到以下错误：

```
Failed to connect: TypeError: client.getServerInfo is not a function
```

## 问题分析

### 环境信息

- **MCP SDK 版本**: 1.29.0（package.json 声明 `^1.0.0`）
- **Excel MCP Server**: haris-musa/excel-mcp-server v0.1.8
- **Pi MCP Client 扩展**: 自定义扩展，位于 `~/.pi/agent/extensions/mcp-client/`

### 根本原因

MCP SDK 在 1.29.0 版本中进行了 API 变更：

| 旧版本 | 新版本 (1.29.0) |
|--------|-----------------|
| `client.getServerInfo()` | `client.getServerVersion()` |

扩展代码中使用了已废弃的 `getServerInfo()` 方法，而该方法在新版本中已不存在。

## 修复过程

### 1. 定位问题代码

在 `~/.pi/agent/extensions/mcp-client/index.ts` 中找到两处调用：

```typescript
// 旧代码（错误）
const serverInfo = await client.getServerInfo();
```

### 2. 查看新 API

检查 `@modelcontextprotocol/sdk` 的类型定义：

```typescript
// 新 API（正确）
getServerVersion(): Implementation | undefined;
```

### 3. 应用修复

将两处 `getServerInfo()` 改为 `getServerVersion()`，并调整返回值处理：

```typescript
// 修复后
const serverVersion = client.getServerVersion();
const serverInfo = serverVersion 
  ? { name: serverVersion.name, version: serverVersion.version } 
  : undefined;
```

### 4. 验证修复

重启 Pi 后测试连接：

```bash
$ mcp_connect_stdio id=excel command=excel-mcp-server args=["stdio"]

Connected to MCP server 'excel'
Server: excel-mcp v1.28.1
```

## 经验总结

1. **版本锁定问题**：`package.json` 中声明 `"@modelcontextprotocol/sdk": "^1.0.0"` 允许自动升级到 1.29.0，但 API 不向后兼容
2. **类型检查缺失**：TypeScript 项目应在 CI 中启用严格类型检查
3. **扩展热重载**：修改扩展文件后需要重启 Pi 或使用 `/reload` 命令才能生效

## 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [haris-musa/excel-mcp-server](https://github.com/haris-musa/excel-mcp-server)
- [Pi 编码代理](https://pi.dev)
