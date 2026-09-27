import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.3,
      resizeOptions: { background: '#07080b', fit: 'contain' }
    },
    apple: {
      sizes: [180],
      padding: 0.18,
      resizeOptions: { background: '#07080b', fit: 'contain' }
    }
  },
  images: ['public/icons/icon.svg']
});
