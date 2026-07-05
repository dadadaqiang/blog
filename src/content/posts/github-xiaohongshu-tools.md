---
title: "GitHub 上有哪些小红书运营工具？我帮你翻了个底朝天"
description: "从全链路一站式平台到 AI Agent 集成，从数据采集爬虫到多账号矩阵管理——这是目前 GitHub 上最全的小红书（REDnote/小红书）开源运营工具盘点。"
date: 2026-07-05T00:00:00.000Z
tags: ["小红书", "GitHub", "开源工具", "运营"]
---

## 背景

小红书（REDnote/小红书）是目前国内最活跃的生活方式社区之一，也是品牌营销和个人博主的重要阵地。但**内容创作耗时、数据采集困难、多账号管理繁琐**是公认的痛点。

最近我在 GitHub 上搜了一圈，发现围绕小红书运营的开源工具已经形成了一个相当完整的生态——从数据采集、内容创作、AI 改写、到自动发布和数据分析，几乎每个环节都有对应的项目。

这篇文章按**使用场景**分类整理，方便你根据自己的需求快速定位。

---

## 🏆 全链路一站式平台

如果你想要一个**开箱即用的 Web 平台**，覆盖从采集到发布的全流程，下面几个项目最合适。

### 1. XHS_ALL_IN_ONE

| 项目 | 地址 |
|------|------|
| ⭐ Stars | — |
| 技术栈 | Vue + Python |
| 仓库 | [cv-cat/XHS_ALL_IN_ONE](https://github.com/cv-cat/XHS_ALL_IN_ONE) |

**简介：** 目前 GitHub 上**链路最完整**的小红书运营平台。它把"采集 → 内容库 → AI 改写 → 图片润色 → 一键发布 → 定时自动运营"全流程打通。

**核心模块：**

| 模块 | 功能 |
|------|------|
| **账号矩阵** | 多 PC / Creator 账号绑定、Cookie 加密存储、2h 自动健康巡检、过期通知 |
| **笔记发现** | 关键词搜索、URL 直查、多维筛选、已保存标记、一键入库 |
| **数据抓取** | 批量 URL / 搜索 / 评论抓取、Excel 导出、素材本地下载 |
| **内容库** | 卡片/列表双视图、自定义标签、批量操作、JSON/CSV 导出、查看原文 |
| **草稿工坊** | 三栏编辑器、AI 改写正文、润色标题/标签、拖拽排序素材、AI 图片润色 |
| **图片工坊** | AI 图片生成（支持参考图）、图片描述、AI/普通图片资产管理 |
| **发布中心** | 图集发布、定时发布、发布校验、状态追踪、重试/取消 |
| **自动运营** | 定时任务（每日/每周/自定义间隔）、全自动管线：搜索→AI改写→上传→发布 |
| **数据洞察** | 仪表盘总览、互动趋势、Top 内容、热门话题、评论分析 |
| **竞品监控** | 关键词/账号/品牌/URL 监控、自动爬取刷新、快照历史 |

**适合人群：** 需要一个完整后台管理系统的团队或个人，部署即用。

---

### 2. xhs-ai-operator

| 项目 | 地址 |
|------|------|
| 技术栈 | Python + MCP |
| 仓库 | [ffan008/xhs-ai-operator](https://github.com/ffan008/xhs-ai-operator) |

**简介：** 基于 MCP（Model Context Protocol）协议的 AI 驱动运营系统。通过 **Claude Code 对话**就能完成内容创作、发布、数据分析、定时发布全套操作。

**架构组件：**

| 组件 | 技术栈 | 功能 |
|------|--------|------|
| xhs-operator Skill | Claude Code Skill | 意图识别、工作流编排 |
| xiaohongshu-mcp | Python + Docker | 小红书 API 封装 |
| stability-mcp | Node.js | Stability AI 图像生成 |
| tavily-remote | Node.js | AI 优化搜索 |
| scheduler-mcp | Python + APScheduler | 定时任务调度 |
| analytics-mcp | Python | 数据分析和报告 |
| integration-mcp | Python | 工作流协调器 |

**适合人群：** 使用 Claude Code / Cursor 等 AI 编程工具的开发者，习惯对话式操作。

---

### 3. xhs-marketing-master

| 项目 | 地址 |
|------|------|
| 技术栈 | TypeScript + Python + FastAPI |
| 仓库 | [Yice-AI/xhs-marketing-master](https://github.com/Yice-AI/xhs-marketing-master) |

**简介：** AI 驱动的小红书增长工作台，面向品牌营销和内容团队。核心流程：**对标样本分析 → 产品卖点访谈 → 爆款策略生成 → 标题/正文创作 → 封面/配图生成 → 历史草稿管理**，还配套浏览器插件实现真实页面采集与发布前检查。

**适合人群：** 品牌营销团队、内容操盘手，强策略导向。

---

### 4. xhs_matrix_system

| 项目 | 地址 |
|------|------|
| 仓库 | [Admin6016/xhs_matrix_system](https://github.com/Admin6016/xhs_matrix_system) |

**简介：** 小红书矩阵系统，支持**多账号管理、定时批量智能发文、素材二创**等功能。额外亮点是同时支持**小红书和抖音**双平台发布。

**适合人群：** 需要跨平台多账号矩阵运营的 MCN 机构。

---

## 🤖 AI Agent / MCP 集成类

如果你已经使用 AI 编程工具（Claude Code、Cursor、OpenClaw、Codex 等），这些工具可以通过对话直接驱动小红书运营。

### 1. redbook CLI

| 项目 | 地址 |
|------|------|
| 技术栈 | Node.js CLI |
| 仓库 | [lucasygu/redbook](https://github.com/lucasygu/redbook) |
| 安装 | `npm install -g @lucasygu/redbook` 或 `clawhub install redbook` |

**简介：** 一个非常成熟的小红书 CLI 工具。支持搜索笔记、阅读内容、分析博主、发布图文。使用浏览器 Cookie 认证，**无需 API Key**。

**核心功能：**

- **🔍 话题研究** — 搜索关键词，分析哪些话题有流量、哪些是蓝海
- **📊 竞品分析** — 找到头部博主，对比粉丝量、互动数据、内容风格
- **🔬 爆款拆解** — 分析爆款笔记的标题钩子、互动比例、评论主题
- **📋 爆款模板** — 从多篇爆款笔记提取内容模板
- **💬 评论管理** — 发评论、回复评论、按策略批量回复
- **🖼️ 图文卡片** — Markdown 渲染为小红书风格的 PNG 图文卡片（7 种配色主题）
- **💡 内容策划** — 基于数据发现内容机会，生成选题建议
- **👥 受众洞察** — 从互动信号推断目标用户画像

**适合人群：** 喜欢命令行的技术型创作者，AI Agent 重度用户。

---

### 2. xhs-toolkit

| 项目 | 地址 |
|------|------|
| 技术栈 | Python + MCP |
| 仓库 | [aric8325188/xhs-toolkit](https://github.com/aric8325188/xhs-toolkit) |

**简介：** 小红书创作者 MCP 工具包，可与 **Claude Desktop、CherryStudio** 等 AI 客户端无缝集成。在对话中直接发布笔记、采集数据、分析粉丝表现。

**MCP 工具一览：**

| 工具名称 | 功能说明 |
|----------|----------|
| `test_connection` | 测试 MCP 连接 |
| `smart_publish_note` | 发布图文/视频笔记，支持本地路径、网络 URL、话题标签 |
| `check_task_status` | 检查发布任务状态 |
| `get_task_result` | 获取已完成任务的结果 |
| `login_xiaohongshu` | 智能登录小红书（MCP 专用无交互登录） |
| `get_creator_data_analysis` | 获取创作者数据用于 AI 分析 |

**适合人群：** Claude Desktop / CherryStudio 用户，想要纯对话式运营。

---

### 3. xhs-workflow-skill

| 项目 | 地址 |
|------|------|
| 技术栈 | Claude Code Skill |
| 仓库 | [anthonyhann/xhs-workflow-skill](https://github.com/anthonyhann/xhs-workflow-skill) |

**简介：** 编排 **10 个专业子 Skill**，覆盖从热点发现到互动运营的全链路。一条指令，5 个阶段自动执行：

```
调研 → 创作 → 设计 → 发布 → 运营
```

**特色功能：**
- 智能场景路由：自动识别 5 种创作场景
- 爆款标题引擎：200+ 真实爆款参考、5 种公式、CTR 优化
- 优雅降级机制

**适合人群：** Claude Code / OpenClaw 用户，追求全自动化工作流。

---

### 4. xiaohongshu-ops-skill

| 项目 | 地址 |
|------|------|
| ⭐ Stars | — |
| 技术栈 | Skill |
| 仓库 | [Xiangyu-CAS/xiaohongshu-ops-skill](https://github.com/xiangyu-cas/xiaohongshu-ops-skill) |

**简介：** OpenClaw 平台上的小红书自动运营 Skill，功能极其丰富：

- ✅ **首页推荐流分析** — 分析高赞笔记背后的传播钩子和内容结构
- ✅ **账号分析** — 分析账号定位、不同笔记之间的区别
- ✅ **选题灵感** — 结合知识库和账号定位，提供选题灵感和内容
- ✅ **知识库** — 分析结果和动作保存为 markdown，为复盘提供便利
- ✅ **自动发布笔记** — 生成封面并上传，填写正文/标题
- ✅ **自动回复评论** — 通知评论逐个回复
- ✅ **目标笔记下载** — 下载笔记图片和正文
- ✅ **爆款笔记复刻** — 输入爆款笔记链接，发布相似笔记

**适合人群：** OpenClaw 用户，想要一站式运营 Skill。

---

### 5. XiaohongshuSkills

| 项目 | 地址 |
|------|------|
| ⭐ Stars | **3K+** |
| 技术栈 | Python + CDP |
| 仓库 | [white0dew/XiaohongshuSkills](https://github.com/white0dew/XiaohongshuSkills) |

**简介：** 目前 **Stars 最多的项目**，支持 OpenClaw、Codex、CC 等平台。通过 Chrome DevTools Protocol (CDP) 实现真实浏览器自动化发布。

**核心特点：**
- **自动化发布** — 自动填写标题、正文，上传图片/视频
- **创作者中心兼容** — 适配 2026 年发布页 DOM 变动
- **话题标签自动写入** — 识别 `#标签` 并渐进式写入
- **多账号支持** — Cookie 隔离、无头模式、远程 CDP 支持
- **自动搜索素材** — 自动搜索素材与内容数据抓取

**适合人群：** 需要稳定可靠的浏览器自动化发布方案。

---

### 6. XhsGrowthAgent

| 项目 | 地址 |
|------|------|
| 技术栈 | LangGraph + Multi-Agent |
| 仓库 | [JameryW/XhsGrowthAgent](https://github.com/JameryW/XhsGrowthAgent) |

**简介：** 基于 LangGraph 的多 Agent 小红书增长引擎。包含多个专业 Agent：

- **🔍 Trend Scout** — 监控热点话题、关键词和竞品动态
- **📋 Content Strategist** — 规划内容角度、发布时间和目标受众（含 Ripple CAS 预测）
- **✍️ Copywriter** — 生成标题、正文和 Hashtag

**适合人群：** 对 Multi-Agent 架构感兴趣的技术型运营。

---

## 🕵️ 数据采集 / 爬虫类

如果主要需求是**数据获取**（笔记、评论、粉丝数据），这些工具专攻采集领域。

### 1. Red-Scraper

| 项目 | 地址 |
|------|------|
| 技术栈 | Python + Network Sniffing + CV + LLM |
| 仓库 | [qinheming/Red-Scraper](https://github.com/qinheming/Red-Scraper) |

**简介：** 最"硬核"的小红书爬虫框架。彻底抛弃传统 DOM 解析，融合了**底层网络嗅探（MitM）**、**机器视觉物理点击**与 **LLM Agent** 技术，专门破解现代 Web 页面的防爬机制（UI 降级隐藏、透明遮罩、骨架屏假死、高频封锁等）。

**核心技术：**
- 🕵️ 底层接口嗅探 — 独家 0 点击秒抓
- 👁️ 视觉物理点击 — 机器视觉定位真实按钮坐标
- 🤖 LLM Agent — 自动决策下一步操作

**适合人群：** 需要高强度数据采集，遇到反爬封锁的技术团队。

---

### 2. yuHai

| 项目 | 地址 |
|------|------|
| 技术栈 | Python + Web Automation |
| 仓库 | [coder-pig/yuHai](https://github.com/coder-pig/yuHai) |

**简介：** 小红书数据采集与自动化平台，功能极其丰富：

| 功能 | 说明 |
|------|------|
| 笔记采集 | 关键词搜索、个人主页批量采集 |
| 评论采集 | 高效获取笔记下的评论数据 |
| 详情解析 | 自动解析图文、视频资源及元数据 |
| 无水印下载 | 图片/视频无水印保存 |
| AI 智能养号 | 模拟真人浏览行为 |
| 自动发布 | 图文/视频自动化发布 |
| 多账号矩阵 | 多账号管理与切换 |
| 可视化大屏 | 数据看板，内置 RESTful API |

**适合人群：** 需要"采集+养号+发布+监控"一站式解决方案的用户。

---

### 3. xiaohongshu-crawler

| 项目 | 地址 |
|------|------|
| 技术栈 | Playwright + Python + MCP |
| 仓库 | [yangsijie666/xiaohongshu-crawler](https://github.com/yangsijie666/xiaohongshu-crawler) |

**简介：** 基于 Playwright 的轻量级采集框架，具备**双层反检测**能力（playwright-stealth + browserforge），同时提供 MCP 服务接口，方便 AI 工具调用。

**适合人群：** 需要稳定采集且对反检测有要求的用户。

---

### 4. Little-Red-Ant

| 项目 | 地址 |
|------|------|
| 仓库 | [magicCzc/Little-Red-Ant](https://github.com/magicCzc/Little-Red-Ant) |

**简介：** 集 AI 内容创作、RPA 自动化发布、数据趋势分析和账号矩阵管理于一身的全栈小红书运营辅助工具。

**适合人群：** 需要 RPA 自动化能力的运营团队。

---

## 📊 功能对比总表

| 项目 | 采集 | AI 创作 | 图片处理 | 自动发布 | 数据分析 | 定时任务 | 多账号 | 技术门槛 |
|------|:----:|:-------:|:--------:|:--------:|:--------:|:--------:|:------:|:--------:|
| XHS_ALL_IN_ONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 低（Web UI） |
| xhs-ai-operator | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 中（MCP） |
| xhs-toolkit | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | 低（MCP） |
| redbook CLI | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | 中（CLI） |
| XiaohongshuSkills | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | 中（Skill） |
| yuHai | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | 高 |
| Red-Scraper | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 高 |
| xhs-marketing-master | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 中 |
| xhs_matrix_system | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | 中 |
| XhsGrowthAgent | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 高（LangGraph） |

---

## 🎯 按需求推荐

| 你的需求 | 推荐项目 | 理由 |
|----------|----------|------|
| 📦 **开箱即用，要完整后台** | [XHS_ALL_IN_ONE](https://github.com/cv-cat/XHS_ALL_IN_ONE) | Web UI 操作，功能最全，采集→创作→发布→分析全链路 |
| 💬 **用 AI 对话来运营** | [redbook CLI](https://github.com/lucasygu/redbook) 或 [xhs-ai-operator](https://github.com/ffan008/xhs-ai-operator) | CLI/MCP 集成，聊着天就把事干了 |
| 🛠️ **已有 Claude/OpenClaw** | [XiaohongshuSkills](https://github.com/white0dew/XiaohongshuSkills) | 3K+ Stars，最成熟稳定 |
| 🕵️ **主要做数据采集** | [yuHai](https://github.com/coder-pig/yuHai) 或 [Red-Scraper](https://github.com/qinheming/Red-Scraper) | 前者功能全，后者反爬强 |
| 👥 **多账号矩阵运营** | [xhs_matrix_system](https://github.com/Admin6016/xhs_matrix_system) | 支持小红书+抖音双平台 |
| 🧠 **营销策略驱动** | [xhs-marketing-master](https://github.com/Yice-AI/xhs-marketing-master) | 从策略到发布，AI 驱动增长工作台 |

---

## ⚠️ 注意事项

1. **依赖 Cookie 登录态**：绝大部分工具都通过模拟浏览器操作或调用内部 API 实现，需要你的小红书登录 Cookie，**不是官方开放 API**。
2. **账号风险**：自动化操作可能违反平台规则，建议使用**小号**测试，注意风控。
3. **及时更新**：小红书前端/DOM 经常变动，选择**近期活跃维护**的项目更稳妥。
4. **MCP 协议是趋势**：2025-2026 年新项目大量采用 MCP 协议，与 AI 编程工具（Claude Code、Cursor、OpenClaw）集成更方便。

---

如果你正在用某个小红书运营工具，或者发现了好项目我没收录，欢迎留言补充 🙌
