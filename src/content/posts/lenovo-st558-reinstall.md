---
title: "联想服务器st558重装系统以及安装联想智能云教室"
description: "没有经验，用360驱动大师给服务器装显卡结果服务器蓝屏了，服务器的联想智能云教室也没了。于是不得不重装。"
date: 2020-05-25T00:00:00.000Z
tags: []
---

没有经验，用360驱动大师给服务器装显卡结果服务器蓝屏了，服务器的联想智能云教室也没了。于是不得不重装。

## 一、联想服务器重装系统正确的道路

1.U盘用rufus制作成iso镜像

2.F1进xclarity一步到位自动安装系统

3.光盘解压联想智能云教室安装包出来拷贝到服务器直接安装

## 二、遇到的弯路

一开始想的是能不能更新驱动来解决，联系了官方客服已经过保，官网找不到相关的驱动。放弃更新驱动的做法，决定重装系统。重装系统进xclarity碰到说找不到镜像的问题，本以为是镜像问题于是下载好几个镜像，后来发现是pe问题，把ventoy删掉了，用rufus重新制作pe，终于成功安装了。

接着操作系统又碰上联想智能云教室安装不了的困难，想从官网重新下载安装包却找不到，用光盘安装发现光驱没反应，最后从另一台电脑上拷贝过来，终于成功安装联想智能云教室。

## 三、心得

如果从结果倒推，都不用一个钟就重装完毕以及搞好云教室安装了。

但对于当时处于困境的自己根本不知道正确的做法，所以曲折前进。 但我目标是确定的，知道自己就是要装好系统和装好云教室。 遇到困难，探索各种方案并且验证，不断遇到抉择的分叉口，不断找到可以实行的方案，得以前进。 虽说最后自己得出的解决方案不是最佳，但却是自己探索出来可以实行的。 并且这期间没有什么别人在鞭策，全是自己驱动自己前进，连吃饭时间都省下来，挡住别人不断施加的干扰，最后完成目标的。

## 参考

```
Lenovo XClarity Provisioning Manager V1 Introduction
https://pubs.lenovo.com/lxpm/zh-CN/downloading_useful_information
```

```
Lenovo XClarity Provisioning Manager(LXPM)中的OS Installation/操作系统安装功能
https://pubs.lenovo.com/lxpm/zh-CN/downloading_useful_information
```

```
联想知识库
https://iknow.lenovo.com.cn/search?keyword=167409&amp%3BkeywordId=
```

```
联想服务器ST558驱动
https://datacentersupport.lenovo.com/cn/zc/products/servers/thinksystem/st558-china-only/7y16/7y16cto1ww/j302g0e1/downloads/driver-list/
```