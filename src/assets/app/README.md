# App UI 图片资源

本目录保存依据 `docs/APP_DESIGN_SYSTEM.md` 生成的本地 PNG 资源。当前设备资源只应用于智能 OTDR、双端口手持 PON 功率计、端口清查仪、手持稳定光源和手持 PON 光功率计，不改变其他设备页面。

## 目录

- `icons/device/`：测量、VFL、照明、记录、网络测试、线长、线序、寻线、FID、ONU、RFID、事件地图、损耗测试、文件管理、光源和设备控制图标。
- `icons/common/`：返回、关闭、保存、删除、刷新、设置等通用操作。
- `icons/connection/`：蓝牙、电量、网络、连接和断开状态。
- `icons/status/`：成功、警告、错误、提示、加载和离线状态。
- `products/`：五类目标设备及其他既有设备的透明产品图。
- `illustrations/`：扫描、权限、连接失败和空记录等状态插画。
- `backgrounds/`：登录、扫描和专业仪表区域背景。
- `asset-manifest.json`：资源尺寸、透明度、用途和设计 Token。

## 使用规则

- 图标源网格为 24x24，PNG 文件为 96x96，页面按 24x24 CSS 像素显示。
- 图标和产品图使用透明 PNG，不依赖远程 Iconify、Emoji 或临时占位图。
- 状态图标必须同时显示文字，不能只依赖颜色表达状态。
- 产品图使用 `object-fit: contain`，不得拉伸或裁切设备主体。
- 深色仪表区只使用 `backgrounds/instrument-grid.png`，不得作为整页装饰背景。
- 页面只引用本目录资源，不复制同一图标到设备业务目录。

## 五类设备映射

| 设备 | 产品图 | 核心图标 |
| --- | --- | --- |
| 智能 OTDR | `products/smart-otdr.png` | `measurement`、`event-map`、`loss-test`、`file-manager`、`light-source`、`cable-test` |
| 手持 PON 功率计 | `products/pon-power-meter.png` | `measurement`、`power-meter`、`vfl`、`flashlight`、`history`、`calibration` |
| 双端口手持 PON 功率计 | `products/dual-pon.png` | `network-test`、`power-meter`、`cable-length`、`wiremap`、`trace`、`records` |
| 端口清查仪 | `products/port-audit.png` | `fid`、`onu`、`rfid`、`power-meter`、`vfl`、`cellular` |
| 手持稳定光源 | `products/stable-light-source.png` | `output`、`vfl`、`flashlight`、`calibration`、`timer` |

## 重新生成

```powershell
node scripts/generate-app-assets.mjs
```

生成脚本使用项目现有 Puppeteer 和本机 Chrome，不新增依赖或网络请求。
