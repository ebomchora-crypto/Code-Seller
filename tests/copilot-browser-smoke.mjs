import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' && existsSync(chrome) ? { executablePath: chrome } : {}) })

async function openChat(page) {
  await page.goto('http://127.0.0.1:5174/tests/copilot-crm.html')
  await page.addStyleTag({ content: '[aria-label="Fixture audit"] { display: none !important; }' })
  await page.getByRole('link', { name: 'Conversa' }).click()
  await page.getByRole('heading', { name: 'Como posso ajudar nas suas vendas hoje?' }).waitFor({ timeout: 15000 })
  await page.waitForTimeout(1000)
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await desktop.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await openChat(page)

  for (const label of ['Analisar conversa', 'O que respondo?', 'Criar follow-up', 'Quebrar objeção', 'Preparar reunião', 'Recuperar lead', 'Criar mensagem']) {
    await page.getByRole('button', { name: new RegExp(label) }).waitFor()
  }
  await page.screenshot({ path: '../copilot-welcome-desktop.png', fullPage: true })

  await page.getByRole('button', { name: /O que respondo\?/ }).click()
  const composer = page.getByRole('textbox', { name: 'Mensagem para o CS Copilot' })
  await page.waitForFunction(() => document.querySelector('textarea[aria-label="Mensagem para o CS Copilot"]')?.value.includes('Priorize a mensagem pronta'))
  assert.match(await composer.inputValue(), /Priorize a mensagem pronta/)
  await composer.fill('linha\n'.repeat(300))
  const composerBox = await composer.boundingBox()
  assert.ok(composerBox && composerBox.height <= 242, `composer height: ${composerBox?.height}`)

  const sidebar = page.locator('[data-collapsed]')
  const expandedBox = await sidebar.boundingBox()
  assert.ok(expandedBox && expandedBox.width >= 260, `expanded sidebar width: ${expandedBox?.width}`)
  await page.getByRole('button', { name: 'Recolher conversas' }).click()
  await page.locator('[data-collapsed="true"]').waitFor()
  await page.waitForFunction(() => document.querySelector('[data-collapsed="true"]')?.getBoundingClientRect().width <= 66)
  const collapsedBox = await sidebar.boundingBox()
  assert.ok(collapsedBox && collapsedBox.width <= 66, `collapsed sidebar width: ${collapsedBox?.width}`)
  assert.equal(await page.evaluate(() => localStorage.getItem('cs-copilot:sidebar-collapsed')), 'true')

  await page.reload()
  await page.addStyleTag({ content: '[aria-label="Fixture audit"] { display: none !important; }' })
  await page.getByRole('link', { name: 'Conversa' }).click()
  await page.locator('[data-collapsed="true"]').waitFor()
  await page.getByRole('button', { name: 'Expandir conversas' }).click()
  await page.getByRole('button', { name: 'Resposta pronta de teste' }).click()
  await page.getByRole('region', { name: 'Mensagem pronta' }).waitFor()
  for (const label of ['Copiar mensagem', 'Gerar outra', 'Mais curta', 'Mais natural', 'Mais profissional', 'Mais direta', 'Explicar estratégia']) {
    await page.getByRole('button', { name: label }).waitFor()
  }
  await page.getByRole('button', { name: 'Copiar mensagem' }).click()
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /R\$ 500/)
  const responseBox = await page.getByRole('region', { name: 'Análise comercial' }).boundingBox()
  assert.ok(responseBox && responseBox.width >= 800, `response width: ${responseBox?.width}`)
  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert.ok(desktopOverflow <= 1, `desktop horizontal overflow: ${desktopOverflow}px`)
  await page.screenshot({ path: '../copilot-desktop.png', fullPage: true })
  assert.deepEqual(errors, [])
  await desktop.close()

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  await mobile.addInitScript(() => localStorage.setItem('cs-copilot:sidebar-collapsed', 'true'))
  const mobilePage = await mobile.newPage()
  mobilePage.on('pageerror', (error) => errors.push(error.message))
  await openChat(mobilePage)
  await mobilePage.getByRole('button', { name: /O que respondo\?/ }).waitFor()
  await mobilePage.screenshot({ path: '../copilot-mobile.png', fullPage: true })
  await mobilePage.getByRole('button', { name: 'Abrir conversas' }).click()
  await mobilePage.getByRole('button', { name: 'Resposta pronta de teste' }).waitFor()
  await mobilePage.waitForTimeout(300)
  const mobileSidebar = await mobilePage.locator('[data-collapsed]').boundingBox()
  assert.ok(mobileSidebar && mobileSidebar.width >= 260, `mobile sidebar width: ${mobileSidebar?.width}`)
  const mobileOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  assert.ok(mobileOverflow <= 1, `mobile horizontal overflow: ${mobileOverflow}px`)
  await mobilePage.screenshot({ path: '../copilot-mobile-sidebar.png', fullPage: true })
  assert.deepEqual(errors, [])
  await mobile.close()
  console.log('Copilot desktop/mobile flows passed')
} finally {
  await browser.close()
}
