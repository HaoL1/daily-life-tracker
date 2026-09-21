<p align="center">
  <a href="https://haol1.github.io/rijiben/">
    <img src="./public/app-icon.svg" width="96" height="96" alt="日迹本 App 图标">
  </a>
</p>

<h1 align="center">日迹本</h1>

<p align="center">
  本机优先、可离线使用的个人生活记录 PWA
</p>

<p align="center">
  <a href="https://haol1.github.io/rijiben/"><strong>在线使用</strong></a>
  ·
  <a href="https://github.com/HaoL1/rijiben/issues">功能规划</a>
  ·
  <a href="https://github.com/HaoL1/rijiben/actions">构建记录</a>
</p>

<p align="center">
  <a href="https://github.com/HaoL1/rijiben/actions/workflows/deploy-pages.yml">
    <img src="https://github.com/HaoL1/rijiben/actions/workflows/deploy-pages.yml/badge.svg" alt="构建与部署状态">
  </a>
</p>

日迹本是一款为 iPhone 主屏幕设计的个人生活记录工具。它适合快速记录喝水、饮食、如厕、锻炼、开车等行为的时间、计量和备注，并通过时间线、统计和导出功能帮助用户回顾自己的日常节奏。

**不需要注册账号，也没有业务后端。所有记录默认只保存在当前设备的 IndexedDB 中。**

## 快速开始

正式地址：**[https://haol1.github.io/rijiben/](https://haol1.github.io/rijiben/)**

### 安装到 iPhone

1. 使用 iPhone 的 **Safari** 打开正式地址。
2. 点击 Safari 工具栏中的“分享”。
3. 选择“添加到主屏幕”。
4. 名称保留为“日迹本”，点击“添加”。
5. 从主屏幕打开日迹本；首次加载完成后即可离线使用。

发布新版本后，应用会显示“新版本已准备好”。点击“更新”只替换应用文件，不会主动删除本地记录。

## 当前功能

| 模块 | 已实现能力 |
| --- | --- |
| 快速记录 | 点击行为卡片后确认计量和备注；支持即时记录、撤销和当天次数显示 |
| 计时行为 | 锻炼、开车等行为支持开始/结束计时，计量和备注随计时会话保留 |
| 首页布局 | 短按卡片记录，长按整张卡片约 350ms 后拖动排序，顺序持久保存 |
| 补录与编辑 | 可补录过去记录，也可修改时间、行为、计量、单位和备注 |
| 历史时间线 | 按日期分组的紧凑单行时间线；支持行为/日期筛选、排序切换、编辑、删除和快速导出 |
| 行为管理 | 新增和编辑自定义行为；删除后可恢复，也可永久删除；历史记录保持独立 |
| 统计分析 | 支持日、周、月、年和自定义日期范围；提供趋势图、分类合计、次数、总量、时长和日均值 |
| 数据导出 | 支持复制文字、系统分享、CSV 明细和 CSV 汇总，可按范围及行为筛选 |
| 备份恢复 | 支持完整 JSON 备份与恢复；恢复前自动下载当前数据备份 |
| PWA 体验 | 可安装到主屏幕、离线启动、版本更新提示、明暗主题、iPhone 安全区域和软键盘适配 |
| 底栏导航 | 短按切页；长按后可左右滑选，毛玻璃高亮与正文页面实时预览 |

### 内置行为

| 行为 | 默认计量 | 记录方式 |
| --- | ---: | --- |
| 喝水 | 250 ml | 即时记录 |
| 小便 | 1 次 | 即时记录 |
| 大便 | 1 次 | 即时记录 |
| 吃饭 | 1 次 | 即时记录 |
| 零食 | 50 g | 即时记录 |
| 水果 | 100 g | 即时记录 |
| 屈臣氏苏打汽水饮料 | 330 ml | 即时记录 |
| 咖啡 | 1 次 | 即时记录 |
| 锻炼 | 1 次 | 开始 / 结束计时 |
| 开车 | 1 次 | 开始 / 结束计时 |

所有行为都可以在“设置 → 行为管理”中调整名称、图标、颜色、记录方式、默认计量和单位，也可以添加自己的行为。

## 常用操作

### 记录与排序

- **短按行为卡片**：打开确认窗口，填写计量和备注后保存。
- **长按行为卡片**：进入排序状态，拖到目标位置后松手。
- **计时行为**：第一次确认开始计时，再次点击并确认后结束计时。
- **补录**：点击记录页右上角的“补录”，选择过去的时间和行为。

### 历史与导出

- 点击任意历史行可以编辑或删除该条记录。
- 历史页可按行为和日期筛选，并在“早→晚 / 晚→早”之间切换。
- 历史页的“导出”会直接定位到“设置 → 导出与备份”。
- CSV 和文字适合查看、分析与分享；完整恢复请使用 JSON 备份。

### 删除行为

- 普通删除会把行为移入“设置 → 已删除”，并从首页隐藏。
- 已删除行为可以恢复到首页，也可以永久删除。
- 删除行为不会删除已经产生的历史记录。
- 正在计时的行为必须先结束计时，才能删除。

## 数据与隐私

日迹本采用 **local-first** 设计：

- 没有用户账号、业务服务器或广告追踪。
- 行为、记录、计时会话和设置保存在当前浏览器的 IndexedDB 中。
- 电脑、Safari 标签页和主屏幕 PWA 可能拥有彼此独立的本地数据。
- 应用会请求浏览器尽可能使用持久存储，但这不能替代备份。
- 清除 Safari 网站数据、删除 PWA、设备存储压力或系统行为都可能造成数据丢失。

建议定期进入“设置 → 导出与备份”，下载完整 JSON 备份并保存到 iCloud Drive、OneDrive 或其他可靠位置。

> CSV、复制文字和系统分享不是完整备份。只有 JSON 备份包含行为定义、历史记录、计时会话和应用设置，可用于完整恢复。

恢复 JSON 时，日迹本会先自动下载一份“恢复前备份”，再用导入内容替换当前本地数据。

## 本地开发

### 环境要求

- Node.js 24（与 GitHub Actions 构建环境一致）
- npm
- 首次运行端到端测试时需要安装 Playwright Chromium

### 启动项目

```powershell
git clone https://github.com/HaoL1/rijiben.git
cd rijiben
npm ci
npm run dev
```

Vite 默认会提供本地地址：`http://localhost:5173/`。

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm test` | 运行 Vitest 单元测试 |
| `npm run test:watch` | 以监听模式运行单元测试 |
| `npm run build` | 执行 TypeScript 检查并生成生产构建 |
| `npm run preview` | 本地预览生产构建 |
| `npm run test:e2e` | 运行 Playwright 桌面与 iPhone 视口流程 |
| `npm run icons` | 从品牌图标重新生成 PWA PNG 图标 |

第一次运行浏览器测试前执行：

```powershell
npx playwright install chromium
```

## 技术栈

| 领域 | 技术 |
| --- | --- |
| 前端 | React 19、TypeScript、Vite |
| 本地数据 | Dexie、IndexedDB |
| 日期与统计 | date-fns、Recharts |
| 拖动排序 | dnd-kit |
| 图标 | Lucide React |
| PWA | vite-plugin-pwa、Workbox |
| 测试 | Vitest、Testing Library、Playwright |
| 发布 | GitHub Actions、GitHub Pages |

### 目录概览

```text
src/
├─ components/          通用弹窗、编辑器和图标
├─ db/                  Dexie 数据库与初始化迁移
├─ domain/              数据模型、默认行为与 UI 类型
├─ features/
│  ├─ quick-log/        快速记录与卡片排序
│  ├─ history/          历史时间线
│  ├─ statistics/       周期统计与图表
│  └─ settings/         行为管理、导出与备份
├─ services/            记录、统计、导出、备份和存储服务
└─ utils/               日期与通用工具
e2e/                    Playwright 端到端测试
public/                 PWA 图标与静态资源
.github/workflows/      GitHub Pages 自动部署
```

## 测试与自动部署

本地测试覆盖日期范围、统计汇总、CSV、备份恢复、计量校验，以及记录、计时、历史、行为删除、拖动排序、软键盘和底栏手势等主要流程。

推送到 `main` 后，[GitHub Actions](https://github.com/HaoL1/rijiben/actions/workflows/deploy-pages.yml) 会自动执行：

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. 部署构建产物到 GitHub Pages

Playwright 端到端测试当前在本地运行，不属于 Pages 工作流的阻塞步骤。

## 未来探索

以下内容已记录为公开 Issue，便于未来分别验证和排期；它们目前都不代表已经承诺实现：

- [#1 使用 OneDrive 实现可选的自动备份与恢复](https://github.com/HaoL1/rijiben/issues/1)
- [#2 通过系统分享向 Copilot Cowork 交接今日记录与图片](https://github.com/HaoL1/rijiben/issues/2)
- [#3 在日迹本中提供双向 AI Chat 与 HTML 结果预览](https://github.com/HaoL1/rijiben/issues/3)
- [#4 从 Apple Health 导出 ZIP 中仅提取睡眠数据](https://github.com/HaoL1/rijiben/issues/4)
- [#5 使用 Apple 快捷指令桥接健康、文字与图片输入](https://github.com/HaoL1/rijiben/issues/5)
- [#6 开发原生 iOS 伴侣以接入 HealthKit 与真实触感](https://github.com/HaoL1/rijiben/issues/6)

## 当前平台限制

- iPhone PWA 无法直接读取 HealthKit，也不能自动监控 Apple Health 导出文件。
- iOS Safari/PWA 没有官方 Taptic Engine 或 Vibration API；真实触感需要原生 iOS 应用。
- PWA 完全关闭后无法保证后台运行、实时上传或自动同步。
- 当前版本没有跨设备同步；每个浏览器或安装实例的数据相互独立。

功能建议和问题反馈可以提交到 [GitHub Issues](https://github.com/HaoL1/rijiben/issues)。提交公开 Issue 时，请勿附带个人健康记录、身份信息或其他敏感数据。
