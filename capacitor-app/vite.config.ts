import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isPagesBuild = mode === 'pages'
  const isSelfHostedBuild = mode === 'selfhost'
  const isPwaBuild = isPagesBuild || isSelfHostedBuild
  const publicSiteUrl = isSelfHostedBuild
    ? 'https://gd.spacy.top:8443'
    : 'https://linxsy-code.github.io/GDScore'

  return {
    base: isPagesBuild ? '/GDScore/' : '/',
    plugins: [
      {
        name: 'inject-public-site-url',
        transformIndexHtml(html) {
          return html.replaceAll('__PUBLIC_SITE_URL__', publicSiteUrl)
        },
      },
      ...(isPwaBuild
        ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
              'favicon.ico',
              'apple-touch-icon-180x180.png',
              'pwa-64x64.png',
              'pwa-192x192.png',
              'pwa-512x512.png',
              'maskable-icon-512x512.png',
              'og.png',
            ],
            manifest: {
              name: '掼蛋计分',
              short_name: '掼蛋计分',
              description: '简单、清楚、随手记录红蓝两组掼蛋级数。',
              lang: 'zh-CN',
              start_url: './',
              scope: './',
              display: 'standalone',
              orientation: 'portrait',
              background_color: '#f8f6f1',
              theme_color: '#f8f6f1',
              categories: ['games', 'utilities'],
              icons: [
                {
                  src: 'pwa-64x64.png',
                  sizes: '64x64',
                  type: 'image/png',
                },
                {
                  src: 'pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: 'pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: 'maskable-icon-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              cleanupOutdatedCaches: true,
              globPatterns: ['**/*.{js,css,html,ico,png,webmanifest}'],
              navigateFallback: 'index.html',
            },
          }),
        ]
        : []),
    ],
  }
})
