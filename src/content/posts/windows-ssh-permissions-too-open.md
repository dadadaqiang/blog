---
title: "windows 连接VPS ssh permissions for key are too open"
description: "秘钥文件的权限太大不安全，所以终止连接"
date: 2020-06-01T00:00:00.000Z
tags: ["VPS","SSH"]
---

### **原因**

秘钥文件的权限太大不安全，所以终止连接

### **解决方案**

#### **第一步 清空权限**

密钥文件右键 -》属性 -》 安全 -》 高级 -》 禁用权限 -》从此对象中删除所有已继承的权限 -》 应用

#### **第二步 设置当前用户访问权限**

右键 -》属性 -》 安全 -》 高级 -》 添加 -》 选择主体 -》 高级 -》 立即查找 -》 选择用户后确认，一路保存即可

参考

[https://www.cnblogs.com/chkhk/p/13414823.html](https://www.cnblogs.com/chkhk/p/13414823.html)

### 相关阅读

- [Windows 配置 SSH 免密登录 Linux](/posts/09-windows-ssh-key-login/)
- [搭建富强如何挑选适合的 VPS](/posts/choose-vps-proxy/)
- [如何测评 VPS 各项指标](/posts/vps-benchmark/)