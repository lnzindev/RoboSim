import { expect, test } from '@playwright/test'

test('arena, editor, builder and Python runtime work in Chromium', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/')
  await expect(page).toHaveTitle(/RoboSim FLL/)
  await expect(page.getByRole('heading', { name: 'Arena de treino RoboSim' })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('.monaco-editor').first()).toBeVisible()

  await page.getByRole('button', { name: /Configuração do robô/ }).click()
  await expect(page.getByText('Sensores montados')).toBeVisible()
  await page.getByRole('button', { name: 'Cor', exact: true }).click()
  await expect(page.getByText('3/10')).toBeVisible()
  await expect(page.locator('.sensor-row')).toHaveCount(3)

  await page.getByLabel('Selecionar arena').selectOption('robosim-custom-v1')
  await expect(page.getByRole('heading', { name: 'Arena personalizada' })).toBeVisible()
  const widthInput = page.getByLabel('Largura do campo (m)')
  await widthInput.fill('5')
  await expect(widthInput).toHaveValue('5')

  await page.getByLabel('Selecionar arena').selectOption('robosim-practice-v1')
  await page.getByRole('button', { name: 'Executar código' }).click()
  await page.waitForFunction(() => {
    const output = document.querySelector('.console-output')?.textContent ?? ''
    return output.includes('Programa concluído.') || output.includes('Erro Python:')
  }, undefined, { timeout: 190_000 })
  const consoleOutput = await page.locator('.console-output').innerText()
  expect(consoleOutput).toContain('Programa concluído. Motores parados.')
  await expect(page.getByText('AGUARDANDO EXECUÇÃO')).toBeVisible()

  expect(pageErrors).toEqual([])
})
