---
title: "踩坑笔记:zfaka设置邮箱出现新增失败问题解决方法"
description: "zfaka的安装比独角数卡简单多了，一路下来非常顺畅，但是在设置邮箱的时候，出现新增失败的问题。"
date: 2020-06-01T00:00:00.000Z
tags: ["zfaka","邮箱","BUG"]
---

最近折腾发卡站，折腾完独角数卡，又折腾zfaka。

zfaka的安装比独角数卡简单多了，一路下来非常顺畅，但是在设置邮箱的时候，出现"新增失败"的问题。

网上找了不少资料，有的说要更新zfaka,还有说直接在数据库的t_mail表直接插入就可以了。

但是这都很麻烦，然后找到华仔部落的一篇博文[ZFAKA 个人发卡网搭建以及支付配置（免签支付宝支付）](https://www.zjh336.cn/?id=204)。

里面有提到解决zfaka邮箱新增失败的问题原因和解决方法，我来转述一下。

### zfaka邮箱新增失败的根源

我们逆向去找这个bug。首先，数据库的操作有日志记录，日志文件在：网站根目录/log/sql/2020-X-X.log（以日期命名的）。

这个日志的最新记录有写：

![zfaka的数据库log](https://blog.455545.xyz/zfaka%E9%82%AE%E7%AE%B1/log.PNG)

smtp_crypto的插入值有误，所以导致了问题。

而导致该问题的源码文件在:根目录/application/modules/Admin/controller/Email.php

出现问题的源码在114行，可以直接搜索"protocol"或者"smpt"可以直接找到。

zfaka的源码里写的是"smpt"，意思就是这里判断的参数是'smpt'，实际上需要判断的参数是"smtp"，这就导致错误了。

![zfaka的插入邮箱错误源码](https://blog.455545.xyz/zfaka%E9%82%AE%E7%AE%B1/source.PNG)

### 解决方法

当然是直接修改"smpt"为"smtp"，就OK啦。