---
title: "A Dark Room游戏刷资源破解作弊"
description: "我也把这款游戏搭建在VPS上了，[点击这里可以直接玩](http://badwife.club/?lang=zh_cn)"
date: 2020-06-11T00:00:00.000Z
tags: ["game"]
---

这两天沉迷于一款挺久了的纯文字游戏，A Dark Room。[github链接在这里](https://github.com/doublespeakgames/adarkroom)。

我也把这款游戏搭建在VPS上了，[点击这里可以直接玩](http://badwife.club/?lang=zh_cn)

一开始我还觉得这款没有GUI的游戏不咋地，但玩了一小会就被游戏剧情吸引了。

一开始只能砍树，后来就能建房子，再后来可以制作武器，再后来就可以去冒险…

其实最吸引人的是，文字相比GUI，想象空间更大。

不过游戏里的道具都要等好久才能积累，为了不浪费时间，我直接开挂了…..

网上有一种开挂方法是说先导出游戏存档代码，然后用base64解密，修改之后再加密，再导入，但我试了没用。

查了不少资料才知道开挂方式很简单。

### 刷装备资源

打开浏览器（我用的是chrome）的console控制台：

然后写代码：

```sh
$.each(State.stores, function(e,i) { State.stores[e] = 100000; })  \\后面的100000是道具数量
```

这样就可以想要多少木头，多少子弹，多少熏肉，应有尽有啦。

然后就可以去冒险地图里打怪，找到飞船的残骸。

### 自动点击飞船装备

飞船外壳和飞船的引擎数量都要点击到100才能起飞。

懒得点击100次，也可以用console控制台自动点击：

```sh
var autoTouch = setInterval(function(){
   $('#reinforceButton').click();
   $('#engineButton').click();                    //设置成每隔1毫秒就点击一次加固船身和升级引擎
 },1);
```

游戏主人公从一无所有，到拥有无数的装备，打通了冒险全地图。

最后转身上了飞船，呼地飞走了…..

真羡慕游戏里的人生呢。