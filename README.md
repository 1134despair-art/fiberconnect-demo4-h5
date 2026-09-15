# 光纤互联 H5 原型

本项目为 Vue 3 + Vite 纯前端原型，包含现有熔接机、OTDR、光功率计及三期设备演示页面。登录、设备状态和演示数据由前端模拟逻辑及 LocalStorage 管理，无需部署后端服务。

线上地址：`https://ruanyi.top/fiberconnect-demo4-h5/`

`master` 分支通过 `.github/workflows/deploy-pages.yml` 自动构建并发布到 GitHub Pages。GitHub Pages 项目站点继承账号主页的 `ruanyi.top` 自定义域名，因此使用独立的 `/fiberconnect-demo4-h5/` 路径，避免与其他项目冲突。

## 环境与启动

保留现有依赖版本。Vite 7 要求 Node.js 20.19+ 或 22.12+，推荐使用受支持的 Node.js LTS 版本及其配套 npm。

```sh
npm install
npm run dev
```

本地地址为 `http://127.0.0.1:8081/`。启动前检查端口；若已有预览在运行，请先停止该预览。检查脚本不会终止其他进程。

## 原型广场构建

Jenkins 在项目根目录执行：

```sh
npm install
npm run build:prod
```

`build:prod` 复用原有 `build` 命令，先运行 Vue/TypeScript 检查，再构建。静态产物输出至 `dist/`，入口为 `dist/index.html`。`src/index.html` 为构建源码入口，无需另建根目录 HTML。

```sh
npm run preview
```

部署时使用完整的 `dist/` 目录。Vite 保持 `base: './'`，路由保持 Hash 模式，支持 `/prototype-preview/{projectCode}/{demoCode}/#/` 等多级预览路径。

旧 `dist-vue/` 为历史产物，保留供核对，不用于本次流水线发布。

## 提交约定

以本目录为仓库根目录，提交 `package.json`、`package-lock.json`、Vite/TypeScript 配置、`src/` 及运行所需的 `scripts/`。发布分支设为 `master`，并与 GitLab Webhook、Jenkins 和原型广场的配置一致。

`.gitignore` 排除依赖、构建产物、IDE 缓存、历史项目副本和本地环境配置。仓库默认发布分支为 `master`，推送后由 GitHub Actions 自动发布。

## 外部静态资源

为保持现有显示效果，保留原项目的 Tailwind CDN、Iconify 图标服务和 DiceBear 头像服务。它们是公开的 HTTPS 静态资源服务，不是业务后端；部分样式、图标及头像仍需要联网加载。登录和设备演示不调用真实后端接口。

## 部署规范调整验证（2026-09-10，界面优化前）

- 在 Windows、Node.js 24.19.0、npm 10.9.7 的独立干净副本中完成 `npm install` 和 `npm run build:prod`，锁定的依赖版本未变化。安装时仅设置 `PUPPETEER_SKIP_DOWNLOAD=true`，跳过与生产构建无关的测试浏览器下载。
- 当时的类型检查及生产构建通过，`dist/index.html` 正常生成。部署规范调整阶段的 255 个静态资源文件与 `dist-vue/` 逐字节一致；此结论不适用于后续界面优化产物。
- 检查了 554 处本地文件引用，文件存在且大小写一致。
- 在 `/prototype-preview/123000/demo4/` 下验证模拟登录、首页、四类三期设备的添加及功能页面跳转、PON 测量记录保存；检查页面无缺失图片、无控制台错误。
- 检查了 390 × 844 手机视口和 1440 × 900 桌面视口。尚未在实际 Linux Jenkins 环境中运行，也未提交或发布到远程仓库。

## 首页、产品与设置界面优化（2026-09-10）

- 首页调整为账号概览、连接状态及带设备图片的列表，保留设备添加、分组折叠与原有设备操作入口。
- 产品页保留分类与详情路由，调整图片展示和文字换行；设置页采用账号区与分组列表，保留原有弹窗及操作。
- 三页共用 `src/styles/workspace.css`，设备功能页保持原有布局。底部导航使用本地图标，新增的加号图标来自 Iconify 的 Material Design Icons 图标集（Apache-2.0）。
- 本轮重新运行类型检查与生产构建。发布应使用本轮生成的 `dist/` 或最新时间戳部署包，历史 `dist-vue/` 和早期部署包不包含此次界面优化。

## 二三级页面界面优化（2026-09-10）

- 产品详情、售后订单列表/新建/详情、操作手册与预览、个人中心采用统一返回栏、信息分组和表单样式。
- 个人资料、语言、销售联系、关于应用及首页添加设备弹窗统一样式。售后模拟提交显示完成提示；测试订单仅存在当前页面内存中。
- 新增样式 `src/styles/subpages.css` 仅通过页面标记应用；设备目录文件经 SHA-256 对比保持不变，设备功能与界面不在此次调整范围内。
- 检查手机尺寸下的表单、弹窗滚动和文字边界。操作手册仍未配置实际 PDF 文件，预览保留无文件状态。
