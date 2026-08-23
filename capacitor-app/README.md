# 掼蛋计分（Capacitor 版）

这是独立于原 Flutter 工程的轻量版本。界面使用 TypeScript/CSS，Android 和 iOS 外壳使用 Capacitor 8。

## 功能

- 红组、蓝组从 2 开始计分
- 等级顺序：`2 → 3 → … → K → A → A2 → A3 → 2`
- 点击加减按钮或在组内上滑、下滑计分
- 自动保存未完成的一局
- 本机保存历史时间、时长和双方结果
- 查看、删除单局记录
- 竖屏、深色模式、无网络功能

## 开发检查

```powershell
npm install
npm run check
npm run sync
```

## Android

需要 Java 21 和 Android SDK。同步后进入 `android` 目录运行：

```powershell
.\gradlew.bat assembleRelease
```

商店发布前应使用正式密钥签名。`release` 目录中的 review APK 使用开发测试密钥签名，仅供安装验收。

## iOS

需要在 macOS 上使用 Xcode 打开 `ios/App/App.xcodeproj`，设置开发团队和正式 Bundle Identifier 后归档。

## 本机数据

应用通过 Capacitor Preferences 保存一个版本化 JSON 状态，不申请相机、定位、相册或存储权限。Android 清单也未声明网络权限。
