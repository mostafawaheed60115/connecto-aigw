# connecto-aigw

Secure React operations console for the Connecto AI Gateway.

## Development

```bash
npm ci
npm run dev
```

The Vite development server proxies `/api` to the configured gateway. Production
uses `VITE_API_BASE` from `.env.production`.

## Verification

```bash
npm test
npm run build
```

The Playwright suite covers authenticated loading, desktop/mobile rendering, and
resource search. The gateway password is entered at runtime and stored only for
the current browser session.
