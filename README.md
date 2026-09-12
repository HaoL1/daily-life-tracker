# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # 日迹 · 个人生活记录

  一个可以安装到 iPhone 主屏幕的离线 PWA，用来记录喝水、上厕所、吃饭、零食、水果、锻炼、开车和自定义行为。

  ## 已实现功能

  - 点击行为按钮后，先确认预设数量并填写可选备注，再记录当前时间
  - 锻炼、开车等行为支持开始/结束计时，数量和备注会随计时保留
  - 可以补录、修改和删除历史记录
  - 首页行为卡片短按记录、长按整卡拖动排序；设置中可新增、编辑和删除行为，删除行为不会删除已有历史记录
  - 支持日、周、月、年和自定义日期范围统计
  - 支持 CSV 明细、CSV 汇总、文字复制和系统分享
  - 支持完整 JSON 备份与恢复
  - 使用 IndexedDB 保存在当前设备，刷新或离线重开后仍可使用
  - 支持明暗主题和 iPhone 安全区域

  内置行为包括：喝水、小便、大便、吃饭、零食、水果、屈臣氏苏打汽水饮料、咖啡、锻炼和开车。

  ## 重要的数据说明

  这个 App 没有账号、后端服务器或遥测。记录默认只存在当前浏览器的 IndexedDB 中，不会因为发布到 GitHub Pages 而上传。

  但是 Safari 可能在用户清除网站数据、设备存储不足或其他系统条件下删除网站存储。因此：

  1. 请定期进入“设置 → 导出与备份”。
  2. 点击“备份”，把 JSON 文件保存到 iCloud Drive 或其他可靠位置。
  3. 不要把 CSV 当作完整备份；完整恢复应使用 JSON。

  恢复 JSON 前，App 会自动下载一份当前数据备份，然后用导入内容替换本地数据。

  ## 在电脑上运行

  需要 Node.js 24 或兼容版本。

  ```powershell
  cd daily-life-tracker
  npm install
  npm run dev
  ```

  终端会显示本地网址，通常是 `http://localhost:5173`。

  ## 自动检查

  ```powershell
  npm run lint
  npm test
  npm run build
  npm run test:e2e
  ```

  - `npm test`：运行日期、统计、CSV、备份和数量校验测试。
  - `npm run test:e2e`：使用 Playwright 在桌面和 iPhone 视口测试主要操作。
  - 第一次运行浏览器测试前，需要执行 `npx playwright install chromium`。
  - `npm run icons`：从品牌 SVG 重新生成 iPhone/PWA PNG 图标。

  ## 发布到 GitHub Pages

  建议 GitHub 仓库名称使用 `daily-life-tracker`。

  1. 在 GitHub 新建一个公开仓库，不要勾选自动创建 README。
  2. 在本项目目录打开终端，执行：

  ```powershell
  git init
  git add .
  git commit -m "Create daily life tracker PWA"
  git branch -M main
  git remote add origin https://github.com/你的用户名/daily-life-tracker.git
  git push -u origin main
  ```

  3. 打开 GitHub 仓库的 `Settings → Pages`。
  4. 在 `Build and deployment → Source` 中选择 `GitHub Actions`。
  5. 打开仓库的 `Actions` 页面，等待 `Test and deploy to GitHub Pages` 完成。
  6. 发布网址通常是 `https://你的用户名.github.io/daily-life-tracker/`。

  以后只要把新代码推送到 `main` 分支，GitHub 会先执行代码检查和单元测试，再自动更新网站。

  ## 安装到 iPhone

  1. 使用 iPhone 的 Safari 打开 GitHub Pages 网址。
  2. 点击 Safari 工具栏中的“分享”。
  3. 向下找到并点击“添加到主屏幕”。
  4. 名称保持“日迹”，点击“添加”。
  5. 从主屏幕打开一次；首次加载完成后即可离线使用。

  若发布了新版本，App 会显示“新版本已准备好”。点击“更新”只替换程序文件，不会主动删除 IndexedDB 中的记录。

  ## 技术结构

  - React 19 + TypeScript + Vite
  - Dexie + IndexedDB 本地持久化
  - Recharts 统计图表
  - vite-plugin-pwa + Workbox 离线缓存
  - Vitest 单元测试
  - Playwright 浏览器流程与手机视口测试
