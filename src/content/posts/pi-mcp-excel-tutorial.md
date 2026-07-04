---
title: "为Pi安装MCP支持：Excel MCP Server完整指南"
description: "Pi默认不内置MCP，本文教你如何通过扩展添加MCP客户端支持，并安装Excel MCP Server实现Excel文件操作。"
date: 2026-07-04T00:00:00.000Z
tags: ["MCP", "Pi", "Excel", "教程", "AI工具"]
---

## 背景

Pi是一个强大的终端编码助手，但它的设计理念是**不内置MCP**（Model Context Protocol）。官方文档明确说明：

> **No MCP.** Build CLI tools with READMEs, or build an extension that adds MCP support.

这意味着我们需要自己动手添加MCP支持。好消息是，Pi的扩展系统非常灵活，可以轻松集成MCP功能。

## 什么是MCP？

MCP（Model Context Protocol）是一个标准化协议，让AI模型能够与外部工具和数据源交互。通过MCP，AI可以：

- 连接各种服务器（文件系统、数据库、API等）
- 调用服务器提供的工具
- 读取和写入资源
- 使用预定义的提示模板

## 安装步骤

### 第一步：创建MCP Client扩展

首先，我们需要为Pi创建一个MCP客户端扩展。

```bash
# 创建扩展目录
mkdir -p ~/.pi/agent/extensions/mcp-client
cd ~/.pi/agent/extensions/mcp-client

# 初始化npm项目
npm init -y

# 安装MCP SDK
npm install @modelcontextprotocol/sdk
```

### 第二步：编写扩展代码

创建 `index.ts` 文件，实现MCP客户端功能：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export default function (pi: ExtensionAPI) {
  const connections = new Map();

  // 连接到MCP服务器
  pi.registerTool({
    name: "mcp_connect_stdio",
    label: "MCP Connect",
    description: "Connect to an MCP server via stdio",
    parameters: Type.Object({
      id: Type.String({ description: "Connection ID" }),
      command: Type.String({ description: "Server command" }),
      args: Type.Optional(Type.Array(Type.String())),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const transport = new StdioClientTransport({
        command: params.command,
        args: params.args,
      });
      const client = new Client({ name: "pi-mcp", version: "1.0.0" });
      await client.connect(transport);
      connections.set(params.id, client);
      return {
        content: [{ type: "text", text: `Connected to ${params.id}` }],
        details: {},
      };
    },
  });

  // 更多工具：list_tools, call_tool, disconnect...
}
```

### 第三步：安装Excel MCP Server

Excel MCP Server是一个Python包，可以让你无需安装Microsoft Excel就能操作Excel文件。

```bash
# 安装excel-mcp-server
pip install excel-mcp-server
```

安装完成后，你可以通过以下命令测试：

```bash
# 测试服务器是否正常工作
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | excel-mcp-server stdio
```

## 使用方法

### 连接到Excel服务器

启动Pi后，输入以下消息：

```
使用 mcp_connect_stdio 工具连接到Excel服务器，ID为 'excel'，命令为 'excel-mcp-server'，参数为 ['stdio']
```

### 查看可用工具

```
列出连接 'excel' 上的工具
```

### 创建Excel文件

```
在 'excel' 上调用 'create_workbook' 工具，创建 /tmp/sales.xlsx
```

### 写入数据

```
在 'excel' 上调用 'write_data' 工具，向 /tmp/sales.xlsx 的 Sheet1 写入数据：
| 产品 | 数量 | 单价 | 总价 |
|------|------|------|------|
| A    | 10   | 100  | 1000 |
| B    | 20   | 50   | 1000 |
```

## Excel MCP Server 功能

Excel MCP Server提供丰富的Excel操作工具：

| 工具 | 功能 |
|------|------|
| `create_workbook` | 创建新的Excel工作簿 |
| `read_workbook` | 读取Excel工作簿 |
| `write_data` | 写入数据到工作表 |
| `read_data` | 读取工作表数据 |
| `create_sheet` | 创建新工作表 |
| `delete_sheet` | 删除工作表 |
| `apply_format` | 应用格式化 |
| `create_chart` | 创建图表 |
| `create_pivot_table` | 创建数据透视表 |
| `set_formula` | 设置公式 |

## 实际应用场景

### 场景1：生成销售报表

```bash
pi "创建一个销售报表Excel文件，包含以下数据：
| 月份 | 销售额 | 成本 | 利润 |
|------|--------|------|------|
| 1月  | 10000  | 6000 | 4000 |
| 2月  | 12000  | 7000 | 5000 |
| 3月  | 15000  | 8000 | 7000 |

添加一个饼图显示各月份销售占比，并计算总利润。"
```

### 场景2：数据分析

```bash
pi "读取 /tmp/data.xlsx 文件，分析销售数据，找出：
1. 销售额最高的产品
2. 平均单价
3. 创建一个柱状图展示各产品销售情况"
```

## 常见问题

### Q: 连接失败怎么办？

A: 检查Excel MCP Server是否正确安装：

```bash
which excel-mcp-server
excel-mcp-server --help
```

### Q: 如何支持其他MCP服务器？

A: 只需修改连接参数即可。例如连接文件系统服务器：

```
使用 mcp_connect_stdio 工具连接到文件系统服务器，ID为 'fs'，命令为 'npx -y @modelcontextprotocol/server-filesystem /tmp'
```

### Q: 如何查看所有可用的MCP服务器？

A: 访问 [MCP服务器列表](https://github.com/modelcontextprotocol/servers) 查看官方和社区提供的MCP服务器。

## 总结

通过为Pi添加MCP支持，我们可以：

1. **扩展Pi的能力** - 连接各种外部工具和服务
2. **操作Excel文件** - 无需安装Microsoft Excel
3. **自动化数据处理** - 让AI帮你处理繁琐的表格工作

MCP是一个强大的协议，Pi的扩展系统让它变得触手可及。希望这篇教程对你有帮助！

---

**相关资源：**
- [Pi官方文档](https://pi.dev)
- [MCP官方文档](https://modelcontextprotocol.io/)
- [Excel MCP Server](https://github.com/haris-musa/excel-mcp-server)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
