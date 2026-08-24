# GDScore 自托管部署

目标地址：`https://gd.spacy.top:8443/`

## 1. 构建

在项目的 `capacitor-app` 目录执行：

```bash
npm ci
npm run build:selfhost
```

生成的 `capacitor-app/dist/` 是完整的静态网站。这个命令不会改变 Android/APK 构建。

## 2. 准备服务器

确保：

- `gd.spacy.top` 的 DNS 已指向服务器公网 IP；
- 防火墙和云安全组已开放 TCP `8443`；
- Nginx 已安装；
- 已为 `gd.spacy.top` 取得有效 TLS 证书。

仓库中的 Nginx 配置默认使用以下 Let's Encrypt 证书路径：

```text
/etc/letsencrypt/live/gd.spacy.top/fullchain.pem
/etc/letsencrypt/live/gd.spacy.top/privkey.pem
```

如果证书在其他位置，请修改 `deploy/nginx/gdscore.conf` 中的两个路径。证书与端口无关，同一张 `gd.spacy.top` 证书可以用于 `8443`。如果服务器无法开放 80 端口完成 HTTP 验证，可使用 Certbot 的 DNS 验证方式申请证书。

## 3. 上传网站文件

先把构建结果传到服务器临时目录，再在服务器执行：

```bash
sudo install -d -m 755 /var/www/gdscore
sudo rsync -a --delete /tmp/gdscore-dist/ /var/www/gdscore/
sudo chown -R root:root /var/www/gdscore
```

`--delete` 只应对明确的 `/var/www/gdscore/` 目标使用，它会清理上一次构建遗留的带哈希资源文件。

## 4. 安装 Nginx 配置

将 `deploy/nginx/gdscore.conf` 上传到服务器，然后：

```bash
sudo cp gdscore.conf /etc/nginx/conf.d/gdscore.conf
sudo nginx -t
sudo systemctl reload nginx
```

Debian/Ubuntu 如果使用 `sites-available` 目录，也可以放入该目录并链接到 `sites-enabled`。

## 5. 验证

```bash
curl -I https://gd.spacy.top:8443/
curl -I https://gd.spacy.top:8443/manifest.webmanifest
curl -I https://gd.spacy.top:8443/sw.js
```

三个地址都应返回 `200`。其中清单应返回 `application/manifest+json`，Service Worker 应返回 JavaScript 类型。部署后的分享图、canonical URL、PWA 启动路径均指向 `https://gd.spacy.top:8443/`。

## 后续更新

每次更新代码后重新运行 `npm run build:selfhost`，替换 `/var/www/gdscore/` 内容并重新访问即可。Nginx 配置未改变时不需要重载 Nginx。
