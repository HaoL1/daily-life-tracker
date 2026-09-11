import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const root = resolve(import.meta.dirname, '..')
const source = await readFile(resolve(root, 'public/app-icon.svg'), 'utf8')
const browser = await chromium.launch()
const page = await browser.newPage()

for (const [size, fileName] of [
  [180, 'apple-touch-icon.png'],
  [192, 'pwa-192x192.png'],
  [512, 'pwa-512x512.png'],
]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`
    <style>
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #b11f4b; }
      svg { display: block; width: 100%; height: 100%; }
    </style>
    ${source}
  `)
  await page.screenshot({ path: resolve(root, `public/${fileName}`) })
}

await browser.close()
