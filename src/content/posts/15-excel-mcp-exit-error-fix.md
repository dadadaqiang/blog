---
title: "修复 Excel MCP Server 退出时 ValueError 异常"
description: "Pi 编码代理每次退出时弹出 ValueError: I/O operation on closed file 错误的排查与修复"
date: 2026-07-04T00:00:00.000Z
tags: ["Pi", "MCP", "Python", "Debug"]
---

## 问题现象

每次退出 Pi 编码代理时，终端都会弹出一段 traceback：

```
╭──────────────── Traceback (most recent call last) ─────────────────╮
│ /home/w/.local/lib/python3.10/site-packages/excel_mcp/__main__.py:47 │
│                                                                      │
│   44 │   │   import traceback                                         │
│   45 │   │   traceback.print_exc()                                    │
│   46 │   finally:                                                     │
│ ❱ 47 │   │   print("Service stopped.")                                │
│                                                                      │
╰──────────────────────────────────────────────────────────────────────╯
ValueError: I/O operation on closed file.
```

虽然不影响功能，但每次退出都看到这段错误信息非常烦人。

## 原因分析

### Pi 的 MCP 生命周期

Pi 启动时通过 stdio 管道连接到 MCP Server（如 `excel-mcp-server`），退出时会关闭这些管道。

### Excel MCP Server 的代码逻辑

`excel_mcp/__main__.py` 的 `stdio()` 命令结构如下：

```python
@app.command()
def stdio():
    try:
        run_stdio()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("Service stopped.")  # ← 问题出在这里
```

### 时序问题

1. Pi 退出 → 关闭 stdio 管道
2. `run_stdio()` 收到管道关闭信号 → 抛出异常
3. 异常被 `except Exception` 捕获 → 打印错误信息
4. `finally` 块执行 → `print("Service stopped.")`
5. **此时 stdout 已关闭** → 抛出 `ValueError: I/O operation on closed file`

## 修复方案

在 `finally` 块中加一层保护，捕获 stdout 已关闭的情况：

```python
def _safe_print(msg):
    try:
        print(msg)
    except (ValueError, OSError):
        pass
```

然后将所有 `print()` 调用替换为 `_safe_print()`：

```python
@app.command()
def stdio():
    try:
        run_stdio()
    except KeyboardInterrupt:
        _safe_print("\nShutting down server...")
    except Exception as e:
        _safe_print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
    finally:
        _safe_print("Service stopped.")
```

### 修改位置

文件：`/home/w/.local/lib/python3.10/site-packages/excel_mcp/__main__.py`

对 `stdio()`、`sse()`、`streamable_http()` 三个命令都做了同样的修改。

## 验证

修改后退出 Pi，不再弹出错误信息。

## 经验总结

1. **MCP Server 的 stdio 模式**：stdout 同时承载 JSON-RPC 响应和调试输出，退出时管道关闭是正常行为
2. **防御性编程**：在 `finally` 块中做 I/O 操作时，应该考虑文件描述符可能已关闭
3. **pip 安装的包修改**：直接改 `site-packages` 下的文件可以快速修复，但 `pip install --upgrade` 会覆盖，需要重新应用或提 PR
