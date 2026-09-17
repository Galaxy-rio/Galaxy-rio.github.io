---
title: 新网站Games现已上线
summary: 制作了小游戏网站并添加第一款小游戏：Chroma Dash
cover: "https://img.galaxyrio.top/media/2026/09/2b5ead1d8cfb27859e8eba478895c326.png"
language: zh
translationKey: new game website and Chroma Dash 
author: galaxyrio
date: "2026-09-10"
time: "20:00"
category: handcraft
series:
tags: 
  - game
  - web
  - color
featured: false
status: publish
links: []
---

## 新网站！

编写了一个新的网站，用于存储网页小游戏。项目地址：[WebGame](https://github.com/Galaxy-rio/WebGames)。

使用Cloudflare Pages部署，可通过这个链接访问：[https://games.galaxyrio.top](https://games.galaxyrio.top)。

网页布局上很大程度参考了PS5的游戏列表布局。

## 新游戏！

添加了第一款游戏：Chroma Dash！

游戏主页面：

![游戏主页面](https://img.galaxyrio.top/media/2026/09/eb2b28d0f9cd933186453bbb25f45be7.png)

玩家需要通过调整RGB滑条来获得目标颜色。游戏目前有三种模式：准度、速度以及盲猜模式。其中准度和盲猜模式下，玩家拥有30s的时间去调整颜色，然后根据准确度来计分。速度模式则是要求玩家尽可能快地调出准确度大于等于85%的颜色，每次错误尝试都会惩罚1s，根据最终用时计分。

准确度的计算方法是基于色差 $\Delta E$ 计算的：

$$
\text{准确度}= e^{-\Delta E/\omega}\times100 \%
$$

其中 $\omega$ 是一个难度因子，这个值越小，则要求越严格，在游戏发布初期，这个值是22，后来调整至32。

游戏灵感来源是[色速](https://store.steampowered.com/app/1952760)。这是一款2022年上架Steam的游戏，如今甚至已经推出了续作。与本作相比，色速要丰富很多，提供多种色彩空间，例如HSB和CMYK等等，并且还有针对玩家对于不同颜色的优劣势报告，非常推荐大家去游玩。

![色速官网图](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1952760/header.jpg)

当然，网上也有很多类似的网页消息，其中游戏在色彩准确度评定、或者游戏玩法上都很出彩，在这里一并推荐：

- 限时记忆颜色：[https://dialed.gg/color](https://dialed.gg/color)  
- 分类测试色彩空间中不同维度：[https://color.method.ac](https://color.method.ac)

## 结语

什么，你说RGB太反人类了？