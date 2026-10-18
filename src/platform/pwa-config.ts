import type { VitePWAOptions } from 'vite-plugin-pwa';

export const PWA_OPTIONS: Partial<VitePWAOptions> = {
  registerType: 'prompt',
  manifest: {
    name: '熊貓成長記',
    short_name: '熊貓',
    lang: 'zh-Hant-TW',
    display: 'standalone',
    start_url: './',
    scope: './',
    background_color: '#FBF7F0',
    theme_color: '#FBF7F0',
    icons: [
      { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
  },
};
