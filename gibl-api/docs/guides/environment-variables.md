# Environment Variables

EFC reads configuration from environment variables so runtime secrets never appear in source code. The scaffolder generates two files: `.env` (gitignored, secrets pre-filled) and `.env.example` (committed, documented placeholders).

---

## Variable reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP listen port |
| `NODE_ENV` | No | — | `development \| production \| test`. Drives clustering, `Secure` cookie flag, source maps. |
| `DATABASE_URL` | Yes (if using a database) | — | Connection string. Format determines the engine: `mongodb://...` or `postgres://...` |
| `JWT_SECRET` | Yes (if using auth) | — | JWT signing secret (HS256). Generate with `openssl rand -hex 64`. |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime. Accepts `15m`, `1h`, `7d`, `30d`, etc. |
| `COOKIE_DOMAIN` | No | — | Cookie domain for `http-only` auth strategy. Blank for localhost. |
| `REDIS_URL` | If tasks use BullMQ | `redis://localhost:6379` | Redis connection string for the BullMQ task queue. |
| `CORS_ORIGINS` | No | (all allowed) | Comma-separated list of allowed CORS origins. Example: `http://localhost:3000,https://myapp.com` |
| `APP_URL` | If Mailer enabled | `http://localhost:3000` | Base URL used to build links in verification/reset emails (e.g. `${APP_URL}/auth/verify-email?token=...`). Set this to your real domain in production. |
| `SMTP_HOST` | If Mailer enabled | `smtp.gmail.com` | SMTP server hostname. |
| `SMTP_PORT` | If Mailer enabled | `465` (Gmail) / `587` (custom) | SMTP port. `465` implies TLS (`secure: true`). |
| `SMTP_USER` | If Mailer enabled | — | Sending email address / SMTP username. |
| `SMTP_PASS` | If Mailer enabled | — | SMTP password. **For Gmail this must be a 16-character App Password** (Google Account → Security → 2-Step Verification → App passwords) — your regular Gmail password will be rejected by Google. See [Mailer](./mailer.md). |
| `SMTP_FROM` | If Mailer enabled | same as `SMTP_USER` | `From:` address on outgoing mail. |

---

## Precedence

`ignite()` options override environment variables. Environment variables override built-in defaults.

```ts
ignite({
  port: 8080,                        // wins over PORT env var
  jwtSecret: process.env.JWT_SECRET, // typical: pass through explicitly
});
```

When you omit an option from `ignite()`, EFC reads the env var directly:

```ts
ignite({ cluster: true });
// PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGINS — all read from process.env automatically
```

---

## Secret hygiene

- **Never commit `.env`.** The scaffolder adds it to `.gitignore` automatically.
- **Use a different `JWT_SECRET` per environment** (dev, staging, production). Rotating the secret invalidates all existing tokens.
- **Regenerate if exposed:**

  ```bash
  openssl rand -hex 64
  ```

  Paste the output into your `.env` and your deployment platform's secret store.

- **Do not log secrets.** EFC never echoes `JWT_SECRET` or `REDIS_URL` to stdout.

---

## `.env` vs `efc.config.ts`

| File | Purpose | Committed? |
|---|---|---|
| `.env` | Runtime secrets and per-environment overrides | **No** |
| `.env.example` | Documented template of every required variable | Yes |
| `efc.config.ts` | Structural configuration (directories, strategy, backend choice) | Yes |

Runtime values (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `SMTP_*`) belong in `.env`. Structural choices (`authStrategy`, `tasks.backend`) belong in `efc.config.ts`. There is no `apiDir`/`tasksDir` option — `src/api/` and `src/tasks/` are fixed conventions.

---

## Development `.env` example

```bash
PORT=3000
NODE_ENV=development

DATABASE_URL=mongodb://localhost:27017/my-api-dev

JWT_SECRET=<generated-by-scaffolder>
JWT_EXPIRES_IN=7d

REDIS_URL=redis://localhost:6379

CORS_ORIGINS=http://localhost:5173

# Only present if the Mailer feature was enabled during scaffolding
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@example.com
SMTP_PASS=abcdefghijklmnop # Gmail App Password (16 chars) — not your Gmail login password
SMTP_FROM=you@example.com
```

---

## Loading in development

In development (`efc start dev`), the CLI reads `.env` from the project root and injects variables into `process.env` before launching the app. Variables already present in `process.env` take precedence (so CI-injected vars are not overwritten).

In production (`efc start prod`), `.env` is **not** loaded. Platforms (Docker, Kubernetes, Railway, Heroku) inject secrets directly into `process.env`. This is intentional — avoid reading secret files from disk in production.
