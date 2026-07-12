---
title: "从零做网站出海：找需求找关键词的完整路径（实战记录）"
description: "记录一次从毫无头绪到建立系统化关键词挖掘方法论的完整过程，涵盖词根体系、限定词策略、KDRoi 验证公式和开源自动化工具清单。"
date: 2026-07-12
tags: ["网站出海", "关键词研究", "SEO", "独立开发", "Indie Hacker", "需求挖掘"]
---

## 前言

最近开始研究「网站出海」方向——用 Web 产品赚美元。第一步就卡住了：**找需求、找关键词，毫无头绪。**

这种感觉很典型：你知道 Google 搜索框后面全是金矿，但不知道怎么挖第一铲子。

这篇文章记录了我从零摸索的完整过程，以及最终沉淀下来的方法论。如果你也在同样的起点，希望能帮你省掉几天摸索时间。

---

## 一、卡住的原因：我缺的不是"方向"，是"探针"

一开始我试图用「先想一个领域 → 再找这个领域的关键词」的方式做调研。结果发现：

- 我想不出什么「好领域」
- 想出来也觉得不太对
- 硬搜出来的词要么跟 Web 产品无关，要么竞争大得离谱

后来才明白：**正确的顺序不是「先想再做」，而是「先丢一个钩子下去，看能捞到什么」。**

这个钩子就叫**词根（Seed Keyword）**——它不是你要做的产品，而是用来探测搜索需求的起点。

---

## 二、第一个误区：裸搜词根全是物理产品

我第一次搜 `generator`，Google Trends 返回的是：

```
portable generator
home generator
generator repair
```

全是物理发电机，跟 Web 产品没任何关系。

**原因很简单：** 英语词根有多义性，裸搜会被物理产品污染。

### 解决方法：前缀限定词

用这些词加到词根前面，Google 就会返回数字产品方向的结果：

| 前缀 ⭐ | 作用 |
|---------|------|
| **online** | 锁定在线工具 |
| **free** | 免费工具 |
| **AI** | AI 驱动工具 |
| **best / top** | 推荐/排行 |

示例：搜 `online converter ␣`（空格），Google 自动补全：

```
online converter pdf to word
online converter mp4 to mp3
online converter currency
```

每一个都是可做的 Web 产品。

还有一类**中介词根**天然就是 Web 方向，零歧义：

```
PDF to ...    → PDF to Word, PDF to JPG
Image to ...  → Image to Text, Image to PDF
Text to ...   → Text to Speech, Text to Image
```

---

## 三、词根体系：122 个出海词根

整理了一份通用词根清单，每天挑 5 个丢进 Google 看下拉联想，坚持一周就会有「网感」。

> 完整清单较长，核心词根包括：
>
> `generator, converter, calculator, maker, checker, detector, editor, builder, downloader, analyzer, optimizer, tracker, planner, assistant, simulator, scraper, comparator, finder...`
>
> 以及场景后缀：`tool, maker, generator, editor, builder, checker, tracker, planner, template...`

---

## 四、数据验证：KDRoi 公式

找到候选关键词后，不能靠直觉决定做什么。用这个公式打分：

```
KDRoi = 搜索量 × CPC ÷ KD（关键词难度）
```

新手筛选标准：

| 指标 | 建议值 |
|------|--------|
| KD（关键词难度） | **0-29** |
| 月搜索量 | **200-10000** |
| CPC | **≥ $0.1** |

案例对比：

| 关键词 | 搜索量 | CPC | KD | KDRoi | 结论 |
|--------|--------|-----|-----|-------|------|
| AI Headshot Generator | 8,100 | $3.5 | 18 | 1,575 | ✅ 新手首选 |
| Password Generator | 110,000 | $1.2 | 92 | 1,433 | ❌ KD 太高 |
| Invoice Generator | 22,000 | $4.2 | 45 | 2,053 | ⚠️ KD 偏高 |

**核心认知：** 搜索量大 ≠ 值得做。竞争低的词才是新手的机会。

### 四步验证法（30 分钟一个词）

1. **Google Trends** — 看趋势是否上升/稳定，排除季节性词
2. **`allintitle:你的关键词`** — 结果越少竞争越小。KGR < 1 是好机会
3. **看首页竞品** — 巨头垄断就放弃，小站为主就可以做
4. **看 CPC** — 离钱越近的关键词越值钱

---

## 五、实战案例：从 `online proxy` 到 `text to speech with voice cloning`

### 第一次搜索：`online proxy`

Google 返回首页全是老牌代理站（proxysite.com、hide.me、croxyproxy.com），技术门槛高（需要服务器+带宽）、合规风险大，**不适合新手切入**。

### 第二次搜索：`online voice clone`

更接近 Web 产品方向。Trends 数据显示 `ai voice clone` 稳定有量（平均 40），飙升相关词 `rvc`（Retrieval-based Voice Conversion）+130%、`udio` +40%。

首页有新站（vocloner.com、voicv.com、nicevoice.org）跑上去了，说明 Google 对这个领域的新站是开放的。

### 第三次搜索：`text to speech with voice cloning`

更具体的场景词。判断是**需求存在但需要切更细的场景**——不要做泛泛的「语音克隆工具」，而是做单一场景工具：

- `ai voice changer for discord`
- `text to speech celebrity voices`
- `ai voice cover maker`
- `rvc voice clone online`

### 一个体感上的认知飞跃

**从泛词到限定词，搜到的结果质量完全不一样：**

| ❌ 裸搜泛词 | ✅ 加限定词 |
|------------|------------|
| generator → 物理发电机 | online generator → QR Code Generator, Invoice Generator |
| voice clone → 搜不到量 | ai voice clone → 稳定月搜索量 |
| proxy → 全是老站 | 工具类加 `online` → 新站也有机会 |

---

## 六、开源自动化工具推荐

当手动搜索有了感觉后，可以用这些工具把流程自动化：

### 关键词挖掘

- **[keyword-discovery](https://github.com/suzhenyu/keyword-discovery)** ⭐ — 基于哥飞理念开发，自动从多平台发现新词同步到飞书（中文作者，理念一致）
- **[openkeyword](https://github.com/scailetech/openkeyword)** — AI 驱动 5 阶段 Pipeline：竞品分析 → 深度调研 → AI 生成关键词 → 打分去重 → 聚类
- **[SEOBot](https://github.com/George3307/seobot)** — 开源，npm install 就能跑，无需 API Key

### Google Trends 自动化

- **[trendspyg](https://github.com/flack0x/trendspyg)** — Python 库 + CLI，pytrends 的现代替代品
- **[google-trends-cli](https://github.com/Nao-30/google-trends-cli)** — 命令行工具，识别当前值得写的话题

### Reddit 需求挖掘

- **[reddit-scout](https://github.com/nikkaroraa/reddit-scout)** ⭐ — 无需 API Key，监控 pain points、追踪关键词
- **[redditlens](https://github.com/0xMassi/redditlens)** — CLI + Claude Code Skill，从 Reddit 找真实痛点

### 推荐工作流

```
第 1 步：trendspyg → 批量扫 Trends 飙升词
第 2 步：openkeyword → 对候选词做深度扩展 + SERP 分析
第 3 步：reddit-scout → 验证需求是否有人在讨论/抱怨
第 4 步：手动用 KDRoi 公式 + Semrush 验证
第 5 步：动手建站
```

---

## 七、心态上最重要的认知

1. **「选品定生死」** — 成功的 80% 在选需求时就决定了。花时间在调研上，不亏
2. **「不要追大词」** — Password Generator 搜索量 11 万但 KD 92，跟新手没关系。先做 KD < 29 的小词
3. **「完美的需求不存在」** — 找一个「够好的词」快速验证。赫兹上线了 20 多个站才找到有起色的那个
4. **「数据驱动，不要自嗨」** — 每一个需求决策都要有数据支撑
5. **「先跑通 0→1」** — 第一个站的目的不是赚钱，是跑通「选词 → 建站 → 收录 → 有流量」的全流程

---

## 后续计划

下一阶段准备从一个**纯前端工具站**入手（图片压缩、PDF 工具、格式转换这类），先跑通全流程。验证了「需求 → 建站 → 收录 → 流量」的闭环后，再扩展到 AI 语音等更深的方向。

如果你也在做出海，欢迎交流。

---

*参考来源：哥飞、赫兹（droidHZ）、龙猫、腾讯云开发者社区文章、AIQ 文章*
