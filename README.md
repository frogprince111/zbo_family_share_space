# 家庭共享空间

一个面向家庭成员协作的前端应用原型，包含首页、成员管理、家庭群聊、日程、待办、相册和理财等模块。项目目前使用本地存储保存数据，适合继续扩展为移动端 App 或接入后端服务。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- lucide-react
- localStorage / Capacitor Preferences 本地数据持久化
- Capacitor Android / iOS 原生封装
- Node.js 在线人员服务

## 功能模块

### 首页

- 自定义共享空间名称和家庭地址
- 家庭成员展示
- 成员在线状态展示：头像彩色表示在线，灰白表示离线
- 固定链接在线人员展示：打开同一个 Render 链接的人会显示在线，并可编辑自己的在线名称
- “非你莫属”家务幸运星功能
- 家庭群聊入口

### 家庭成员

- 添加、编辑、删除成员
- 设置头像、角色、主题色
- 设置成员生日
- 成员生日会自动同步到日程提醒

### 家庭群聊

- 类似微信/QQ群聊界面
- 文字消息发送
- 图片消息发送
- 语音消息入口
- 群聊背景水印：“家和万事兴”
- 消息本地保存

### 日程

- 月历展示
- 添加、编辑、删除日程
- 有日程的日期标记红点，当天任务标记红色五角星
- 近期日程按日期分组展示
- 日程完成状态勾选
- 生日提醒自动置顶，提示“谁谁谁的生日快到了，快送上祝福吧”
- 倒计时功能，可自定义事项和日期

### 待办

- 新增待办弹窗
- 勾选完成后待办变绿色
- 右键或长按待办可重命名、删除

### 相册

- 上传照片
- 文件夹管理
- 照片拖动归类
- 文件夹右键菜单：添加照片、重命名、删除
- 照片右键菜单：编辑名称、保存到本地、删除
- 图片预览、拖动、缩放

### 理财

- 记录收入和支出
- 本月收入、本月支出、本月结余、年度结余统计
- 最近账单展示前三条
- 收支详情按月份折叠展示
- 月度收入/支出柱状图
- 重置收支，可按本年已到月份重置并自定义该月收入和支出

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

预览生产构建：

```bash
npm run preview
```

## 固定网页访问链接

项目已配置 Render Web Service 部署。服务会先执行 `npm ci && npm run build` 生成 `dist`，再用 `npm start` 启动 Node 服务托管前端页面和在线人员接口。

Render 发布后会生成固定公网地址，通常类似：

```text
https://zbo-family-share-space.onrender.com
```

Render 新建服务时选择：

```text
New -> Web Service -> frogprince111/zbo_family_share_space
```

仓库中的 `render.yaml` 已包含构建命令和启动命令配置。

如果之前已经创建成 Static Site，需要在 Render 里删除旧服务或重新创建一个 Web Service。在线人员功能依赖 `/api/online` 和 `/api/online/stream`，纯静态站点无法保存跨设备在线状态。

## 手机 App 构建

项目已使用 Capacitor 封装为 Android 和 iOS App，同时保留网页端运行能力。

开发网页：

```bash
npm install
npm run dev
```

构建网页：

```bash
npm run build
```

同步所有手机平台：

```bash
npm run mobile:sync
```

打开 Android 工程：

```bash
npm run android:open
```

打开 iOS 工程：

```bash
npm run ios:open
```

网页代码更新后的固定步骤：

```bash
npm run build
npx cap sync
```

### Android 调试 APK

1. 使用 Android Studio 打开 `android` 工程。
2. 等待 Gradle Sync 完成。
3. 选择 Build APK。
4. 也可以在本机安装 Java 和 Android SDK 后执行：

```bash
npm run android:apk
```

调试 APK 通常会生成在：

```text
android/app/build/outputs/apk/debug/
```

### Android 正式包

- APK 可以直接安装到安卓手机。
- AAB 用于 Google Play 发布。
- 生成 AAB 可以执行：

```bash
npm run android:aab
```

- 正式包必须使用自己的签名文件。
- Android keystore、密码和签名配置必须妥善保存，不要提交到 Git。

### iOS 安装和发布

1. 必须使用 macOS 和完整 Xcode。
2. 执行：

```bash
npx cap open ios
```

3. 在 Xcode 的 Signing & Capabilities 中选择 Apple 开发团队。
4. 连接 iPhone。
5. 选择真机并点击 Run。
6. 对外测试可以使用 TestFlight。
7. 上架需要通过 App Store Connect。

### 应用信息

- 应用名称：家庭共享空间
- Android applicationId：`com.frogprince.familysharespace`
- iOS Bundle Identifier：`com.frogprince.familysharespace`
- 默认方向：竖屏
- Web 构建目录：`dist`

## 项目结构

```text
src/
  components/       通用组件
  data/             默认数据
  hooks/            自定义 Hooks
  pages/            页面模块
  types/            类型定义
  utils/            工具函数
server/
  index.js          Render 生产服务，托管页面并提供在线人员接口
```

## 数据说明

当前版本主要使用本机存储。网页端使用 `localStorage`，原生 App 环境会同步使用 Capacitor Preferences：

- 家庭成员
- 家庭设置
- 日程和倒计时
- 待办事项
- 相册文件夹和照片
- 理财账单
- 群聊消息

固定链接在线人员使用 Render 上的 Node 服务内存保存，适合显示“当前谁打开了链接”。服务重启、重新部署或 Render 免费实例休眠后，在线名单会重新统计。

后续如果要做成正式 App，可以将这些数据迁移到后端数据库，并接入登录、推送通知、云相册和多人实时聊天。

删除 App 会删除本机数据。当前版本暂未实现云端同步。

## 后续扩展方向

- 用户登录和家庭邀请码
- 后端 API 与数据库同步
- WebSocket 实时聊天和在线状态
- 原生 App 打包
- 地图定位与地址解析
- 图片云存储
- 账单导出和统计报表
