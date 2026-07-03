---
title: "如何测评VPS各项指标"
description: "https://github.com/oneclickvirt/ecs"
date: 2020-05-12T00:00:00.000Z
tags: ["VPS","服务器","测评"]
---

### 融合怪脚本，一键搞定。

#### **项目地址**

```
VPS融合怪服务器测评项目 GO版本

https://github.com/oneclickvirt/ecs
```

#### **一键命令**

```
一键命令

export noninteractive=true && curl -L https://cdn.spiritlhl.net/https://raw.githubusercontent.com/oneclickvirt/ecs/master/goecs.sh -o goecs.sh && chmod +x goecs.sh && bash goecs.sh env && bash goecs.sh install && goecs
```

#### **测评指标**

*   系统基础信息查询，IP基础信息并发查询：[basics](https://github.com/oneclickvirt/basics)、[gostun](https://github.com/oneclickvirt/gostun)
*   CPU 测试：[cputest](https://github.com/oneclickvirt/cputest)，支持 sysbench(lua/golang版本)、geekbench、winsat
*   内存测试：[memorytest](https://github.com/oneclickvirt/memorytest)，支持 sysbench、dd
*   硬盘测试：[disktest](https://github.com/oneclickvirt/disktest)，支持 dd、fio、winsat
*   流媒体解锁信息并发查询：[netflix-verify](https://github.com/sjlleo/netflix-verify) 等逻辑，开发至 [CommonMediaTests](https://github.com/oneclickvirt/CommonMediaTests)
*   常见流媒体测试并发查询：[UnlockTests](https://github.com/oneclickvirt/UnlockTests)，逻辑借鉴 [RegionRestrictionCheck](https://github.com/lmc999/RegionRestrictionCheck) 等
*   IP 质量/安全信息并发查询：二进制文件编译至 [securityCheck](https://github.com/oneclickvirt/securityCheck)
*   邮件端口测试：[portchecker](https://github.com/oneclickvirt/portchecker)
*   三网回程测试：借鉴 [zhanghanyun/backtrace](https://github.com/zhanghanyun/backtrace)，二次开发至 [oneclickvirt/backtrace](https://github.com/oneclickvirt/backtrace)
*   三网路由测试：基于 [NTrace-core](https://github.com/nxtrace/NTrace-core)，二次开发至 [nt3](https://github.com/oneclickvirt/nt3)
*   网速测试：基于 [speedtest.net](https://github.com/spiritLHLS/speedtest.net-CN-ID) 和 [speedtest.cn](https://github.com/spiritLHLS/speedtest.cn-CN-ID) 数据，开发至 [oneclickvirt/speedtest](https://github.com/oneclickvirt/speedtest)
*   三网 Ping 值测试：借鉴 [ecsspeed](https://github.com/spiritLHLS/ecsspeed)，二次开发至 [pingtest](https://github.com/oneclickvirt/pingtest)

### 相关阅读

- [搭建富强如何挑选适合的 VPS](/posts/choose-vps-proxy/)
- [Windows 配置 SSH 免密登录 Linux](/posts/09-windows-ssh-key-login/)
- [Windows 连接 VPS SSH permissions for key are too open](/posts/windows-ssh-permissions-too-open/)