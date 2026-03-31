import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../apps/port/public/thumbnails')

const SITES = [
  { id: 'project5', url: 'https://nearanddear.agency/' },
  { id: 'project6', url: 'https://www.coopersurgical.com' },
  { id: 'project7', url: 'https://fidoalliance.org/' },
  { id: 'project8', url: 'https://orangetwist.com/' },
]

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
})

for (const site of SITES) {
  const page = await context.newPage()
  console.log(`Capturing ${site.url}...`)
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)
    await page.screenshot({
      path: resolve(outDir, `${site.id}.png`),
      type: 'png',
    })
    console.log(`  ✓ Saved ${site.id}.png`)
  } catch (err) {
    console.error(`  ✗ Failed ${site.id}: ${err.message}`)
  }
  await page.close()
}

await browser.close()
console.log('Done.')
