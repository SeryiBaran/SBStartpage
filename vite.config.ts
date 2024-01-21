import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  base: './',
  plugins: [
    // https://github.com/antfu/unocss
    // see uno.config.ts for config
    UnoCSS(),
  ],
})
