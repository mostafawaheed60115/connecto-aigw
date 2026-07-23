import { expect, test } from '@playwright/test'

const accounts = [
  { ID: 'acct_1', Email: 'ops@example.com', Enabled: true, CreatedAt: '2026-07-23T12:00:00Z' },
  { ID: 'acct_2', Email: 'sellers@example.com', Enabled: true, CreatedAt: '2026-07-23T12:00:00Z' },
]

async function mockGateway(page) {
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/^\/api/, '')
    if (path.startsWith('/admin') || path === '/v1/inference') {
      expect(request.headers().authorization).toBe('Bearer test-token')
    }

    const responses = {
      '/admin/v1/accounts': accounts,
      '/admin/v1/providers': [{ ID: 'prov_1', AccountID: 'acct_1', Name: 'Bynara', AdapterType: 'openai_compatible', Enabled: true }],
      '/admin/v1/keys': [{ ID: 'key_1', ProviderID: 'prov_1', Label: 'primary', Enabled: true }],
      '/admin/v1/models': [{ ID: 'model_1', APIKeyID: 'key_1', LogicalName: 'mistral-large', UpstreamModel: 'mistral-large', Enabled: true }],
      '/admin/v1/routes': { routes: [{ ID: 'route_1', Model: 'mistral-large', ProviderName: 'Bynara', AccountEmail: 'ops@example.com', KeyLabel: 'primary' }] },
      '/healthz': { status: 'ok' },
      '/readyz': { status: 'ready' },
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responses[path] ?? {}),
    })
  })
}

test('authenticates and manages searchable gateway data', async ({ page }) => {
  await mockGateway(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Secure operations console' })).toBeVisible()
  await page.getByLabel('Gateway access token').fill('test-token')
  await page.getByRole('button', { name: 'Open console' }).click()

  await expect(page.getByRole('heading', { name: 'Gateway operations' })).toBeVisible()
  await expect(page.getByText('Active accounts', { exact: true })).toBeVisible()
  await page.locator('nav').getByRole('button', { name: 'Accounts', exact: true }).click()
  await page.getByPlaceholder('Search accounts').fill('sellers')
  await expect(page.getByText('sellers@example.com')).toBeVisible()
  await expect(page.getByText('ops@example.com')).toBeHidden()
})
