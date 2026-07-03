---
title: "踩坑笔记:安装独角数卡发卡站源码"
description: "因为自己太小白，安装的时候碰到一些坑，记录一下："
date: 2020-05-31T00:00:00.000Z
tags: ["Laravel","php","源码"]
---

想在VPS上装一个发卡站，于是找到一款很不错的开源源码，独角数卡:[github地址](https://github.com/assimon/dujiaoka)

因为自己太小白，安装的时候碰到一些坑，记录一下：

## vendor文件夹丢失

按照官方的教程一路安装下来都很顺利的，直到要在终端运行：

```sh
/www/server/php/72/bin/php artisan dujiao install
```

运行这行命令的时候，出现了一个错误,大概意思是这样：

```sh
Warning: require(../vendor/autoload.php): failed to open stream: No such file or directory in autoload.php on line 17

Fatal error: require(): Failed opening required '../vendor/autoload.php'  in XXXX on line 17
```

看了这个提示，是说找不到一个文件夹叫vendor。

到处找资料，看到stackoverflow的一个提问解决问题了:[require(vendor/autoload.php): failed to open stream](https://stackoverflow.com/questions/41209349/requirevendor-autoload-php-failed-to-open-stream)

才搞明白，原来vendor这个文件夹是装依赖包的。

但是当独角数卡源码的项目push到github上面的时候，这个vendor依赖包是不会上传的，而只是把需要的依赖包名字和版本等等写进composer.json文件(类似python的requrement.txt)。

所以从github上把源码下载下来，自然就没有这个vendor文件夹，于是就会出现上面的错误。

怎么解决？

自然是重新安装依赖包了：

```sh
composer dump-autoload  ##清楚原来的编译文件
composer install    ##重新安装依赖包
```

## php版本问题

找答案过程中，顺带发现我自己终端使用的php版本是5.6的，需要更换成php7才行，直接建立软链接就可以了:

```sh
ln -sf /www/server/php/73/bin/php /usr/bin/php
```

## 权限问题

搞定了vendor文件夹之后，继续执行：php artisan dujiao install,又出现错误:

```sh
vendor/symfony/polyfill-mbstring does not exist and could not be created.
```

继续寻找解决方法，找到这个:[vendor does not exist and could not be created](https://github.com/panique/huge/issues/392)

才发现原来是权限不够，它这里给出的方法是：**chmod -R 777 /var/www**

而我直接sudo就可以了:

```sh
sudo php artisan dujiao install
```

执行完这一步，独角数卡源码是已经完成了的，然后打开自己的网站，发现还有一个错误，是log不能访问。

这个直接在后台给对应的文件夹修改权限成775就可以了。

最后大功告成。