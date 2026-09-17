---
title: 新游戏：LANDROID extended
summary: 一款基于安卓14(-17)彩蛋的小游戏
cover: "https://img.galaxyrio.top/media/2026/09/44af19bec2ccdf2c9c5dbae9199679d7.png"
language: zh
translationKey: new game landroid extended
author: galaxyrio
date: "2026-09-12"
time: "20:00"
category: handcraft
series:
tags: 
  - game
  - web
  - space
featured: false
status: publish
links: []
---

## 前言

为我的游戏网站添加了一款小游戏：LANDROID extended

游戏主页面：

![游戏主页面](https://img.galaxyrio.top/media/2026/09/442debcb4625c12d9a8f9650176e986b.png)


## 玩法

在画面任意位置按住并拖动。内圈调整朝向，拖出内圈开始推进，越远推力越大。在屏幕边缘的有指向所有星球的引导，遍历这些星球即完成游戏。游戏按以下规则计分：

- 初始分数+5000
- 探索一个新星球+3000
- 降落时如果相对速度小可以加分，$加分=(1000-相对速度)\times3$，不为负
- 降落时如果相对角度小也可以加分，$加分=\cos(夹角)\times3000$
- 重复降落不得分
- 按星球编号顺序登陆可以额外加分+2000
- 飞船头部撞击扣500分
- 飞行过程中按燃料消耗量扣分，100%THR时每秒扣100分
- 从一颗星球到另一颗用时每秒扣10分

如果使用ATUO模式，则不再计分。

## 灵感来源

灵感的直接来源（也包括主要的代码来源）是Android14-17的内置彩蛋，[开源代码库链接](https://android.googlesource.com/platform/frameworks/base/+/android17-release/packages/EasterEgg/src/com/android/egg/landroid/)。本作在其基础上添加了边缘上的星球位置指示器，以及近地指示器。

![近地指示器](https://img.galaxyrio.top/media/2026/09/c2841001de49623fafb8ca6149539ea9.png)

和原作一样，游戏视角默认无法调整，视野受限，这增大了游戏的难度（故意的）。

## 结语

感谢赏玩。