# 掼蛋计分（Capacitor 版）

这是独立于原 Flutter 工程的轻量版本。界面使用 TypeScript/CSS，Android 和 iOS 外壳使用 Capacitor 8。

## 代码路径

- 代码都在子目录capacitor-app下。

## 构建方式

- Android/Capacitor：在 `capacitor-app` 中运行 `npm run build`
- GitHub Pages PWA：运行 `npm run build:pwa`
- 自托管 PWA：运行 `npm run build:selfhost`

自托管版本默认面向 `https:/xx.xx.xx:8443/`，Linux/Nginx 配置和部署步骤见 `deploy/README.md`。
