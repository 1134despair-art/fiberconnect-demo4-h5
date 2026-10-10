# 设置页面图标来源

2026-10-10。应用设置、四类设备设置与操作手册专用。图标来自阿里巴巴 Iconfont，路径几何保持原样，统一为 24px 显示尺寸，按功能采用克制的分类配色与同色浅底；辅助箭头保持灰色，PDF 保持红色。使用本地 SVG 图片，随构建打包，无在线字体或 CSS mask 依赖。

新增检索（公开 `/api/icon/search.json`）：
- `privacy.svg`：ID 18267905，安全隐私，检索词“隐私”。
- `agreement.svg`：ID 3759060，就业协议，检索词“协议”，用于通用协议文件入口。

复用图标及原始来源（作者与 ID 见对应目录 SOURCES.md）：
- `account.svg` ← `../settings/account.svg`
- `translate.svg` ← `../settings/translate.svg`
- `support.svg` ← `../settings/support.svg`
- `book.svg` ← `../settings/book.svg`
- `phone.svg` ← `../settings/phone.svg`
- `logout.svg` ← `../settings/logout.svg`
- `bluetooth.svg` ← `../smart-otdr/bluetooth.svg`
- `brightness.svg` ← `../smart-otdr/brightness.svg`
- `buzzer.svg` ← `../smart-otdr/buzzer.svg`
- `timer.svg` ← `../smart-otdr/timer.svg`
- `info.svg` ← `../smart-otdr/info.svg`
- `upload.svg` ← `../smart-otdr/upload.svg`
- `restore.svg` ← `../smart-otdr/restore.svg`
- `calibration.svg` ← `../smart-otdr/calibration.svg`
- `settings.svg` ← `../smart-otdr/settings.svg`
- `calendar.svg` ← `../smart-otdr/calendar.svg`
- `cellular.svg` ← `../smart-otdr/cellular.svg`
- `pdf.svg` ← `../smart-otdr/pdf.svg`
- `chevron.svg` ← `../device/chevron.svg`
- `close.svg` ← `../device/close.svg`
- `search.svg` ← `../search.svg`

原作者保留权利；未将自绘图形标注为阿里图标。

## 功能配色（2026-10-10 调整）

图标形状、尺寸与入口行为不变；配色用于帮助查找，不代表连接成功、警告或已选中状态。页面主色和按钮仍为蓝色。

| 分组 | 前景 | 浅底 | 图标 |
|---|---|---|---|
| blue | `#2563eb` | `#eff6ff` | account, info, upload, settings, agreement |
| teal | `#0f8579` | `#eaf7f3` | bluetooth, cellular, phone, support, privacy |
| violet | `#7955bb` | `#f2edfa` | translate, calibration |
| amber | `#b47718` | `#fcf3e5` | timer, calendar, brightness, buzzer, book |
| red | `#ce4b50` | `#fff0f0` | logout, restore |
