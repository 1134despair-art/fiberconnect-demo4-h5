# 本地图标资源与开发接入

本项目的图标随源码和构建产物一起分发，不依赖在线 Iconfont / Iconify 脚本、字体或图标 API。来源文档中的网址仅用于溯源，不是运行时资源。

## 资源目录

| 路径（相对本目录） | 用途 |
| --- | --- |
| `iconfont/` | 已下载到本地的 152 个阿里 Iconfont SVG；首页、主导航、设备与设置图标 |
| `iconfont/device/` | 设备通用操作图标 |
| `iconfont/settings/`、`iconfont/settings-ui/` | 账户和设备设置图标 |
| `iconfont/smart-otdr/`、`iconfont/smart-otdr/navigation/` | 智能 OTDR 功能、工具和底部导航 |
| `iconfont/instrument/` | 仪器测量功能图标 |
| `mdi-local/` | 原有产品详情、售后及保留的旧个人页图标，已转成本地 SVG |
| `home/` | 已本地化的首页辅助图标及许可证 |
| 本目录及其他子目录中的 SVG / PNG | 原有本地图标，保持原文件 |

阿里图标的来源、作者、图标 ID 等保留在各子目录的 `SOURCES.md`。MDI 图标的来源和许可见 `mdi-local/SOURCES.md`、`mdi-local/LICENSE` 及 `home/LICENSE-MDI.txt`。复用时保留这些说明。

## 接入方式

```vue
<script setup lang="ts">
import searchIcon from '@/assets/icons/iconfont/search.svg'
import DeviceIcon from '@/components/DeviceIcon.vue'
import LocalIcon from '@/components/LocalIcon.vue'
</script>

<template>
  <img :src="searchIcon" alt="" width="24" height="24" />
  <DeviceIcon name="settings" />
  <LocalIcon name="mdi:headset" />
</template>
```

`DeviceIcon` / `SettingsGlyph` / `LocalIcon` 使用本地 SVG 遮罩，继承文字颜色；用 `font-size` 或宽高调整尺寸。新增名称必须先添加资源及显式映射。多色 SVG 使用 `<img>`，保留文件内的配色。

使用 Vite 的静态 import，确保子路径部署时地址正确。构建时部分小图标会被内联到 JS/CSS，较大图标会进入 dist/assets，这两种方式均不访问第三方图标服务。开发人员可直接使用原始 SVG 文件，也可复用 Vue 组件。

新增图标请先下载 SVG 到本目录，记录来源和许可，再在源码中 import；不要重新引入在线 script、远程字体、远程 SVG 或在线按名称取图标的方案。

`inventory.json` 记录本次整理后的 SVG 路径和 SHA-256，供交接核对。本说明仅覆盖图标，产品远程媒体等不在此次本地化范围内。
