import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' && existsSync(chrome) ? { executablePath: chrome } : {}) })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:5174/tests/commercial-library.html')
  try { await page.getByRole('heading', { name: 'Biblioteca Comercial' }).waitFor({ timeout: 10000 }) }
  catch (error) { console.error('Page:', page.url(), await page.locator('body').innerText(), errors); throw error }
  await page.screenshot({ path: '../library-desktop.png', fullPage: true })
  await page.getByRole('button', { name: /Quebra de objeções/ }).click()
  await page.getByRole('searchbox', { name: 'Pesquisar na biblioteca' }).fill('caro')
  await page.getByRole('heading', { name: 'Está caro' }).waitFor()
  await page.getByRole('button', { name: /Ver material/ }).first().click()
  await page.getByRole('heading', { name: 'O que não fazer' }).waitFor()
  await page.getByRole('button', { name: 'Favoritar Está caro' }).last().click()
  await page.getByRole('button', { name: 'Fechar modal' }).click()
  await page.getByRole('button', { name: /Favoritos/ }).click()
  await page.getByRole('heading', { name: 'Está caro' }).waitFor()
  await page.getByRole('button', { name: 'Escolher lead' }).click()
  await page.getByRole('button', { name: /Lead Teste Alfa/ }).click()
  await page.getByRole('button', { name: 'Personalizar Está caro' }).click()
  await page.getByRole('button', { name: 'Gerar versão' }).click()
  await page.getByText('Mensagem personalizada para Lead Teste Alfa.').waitFor()
  await page.getByRole('button', { name: 'Fechar modal' }).click()
  await page.getByRole('button', { name: 'Usar Está caro no CS Copilot' }).click()
  await page.waitForURL(/\/copilot\?/)
  await page.waitForFunction(() => {
    const audit = document.querySelector('[aria-label="Fixture audit"]')
    return audit && Number(JSON.parse(audit.textContent).messages) > 0
  }, { timeout: 20000 })
  assert.deepEqual(errors, [])
  await context.close()

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const mobilePage = await mobile.newPage()
  mobilePage.on('pageerror', (error) => errors.push(error.message))
  await mobilePage.goto('http://127.0.0.1:5174/tests/commercial-library.html')
  await mobilePage.getByRole('heading', { name: 'Biblioteca Comercial' }).waitFor()
  await mobilePage.screenshot({ path: '../library-mobile.png', fullPage: true })
  const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px`)
  assert.deepEqual(errors, [])
  await mobile.close()
  console.log('Library desktop/mobile flows passed')
} finally {
  await browser.close()
}
