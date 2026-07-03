# Deployment Guide

---

## Build step

Before deploying, compile TypeScript to JavaScript:

```bash
npm run build
# → efc build prod
```

`efc build prod` runs `tsup` with dual CJS/ESM output and emits everything to `dist/`. The entry point for production is `dist/index.js`.

---

## Running in production

```bash
npm start
# → efc start prod
# → node dist/index.js  (NODE_ENV=production)
```

`efc start prod` sets `NODE_ENV=production` and spawns the compiled server with `node`. It does **not** read `.env` — secrets must be injected through the platform's secret management.

---

## Environment variables

Set these in your deployment platform:

| Variable | Notes |
|---|---|
| `NODE_ENV` | Set to `production` — enables clustering, `Secure` cookie, production log level |
| `PORT` | Usually set by the platform (Heroku, Railway, etc.) |
| `DATABASE_URL` | Production database connection string |
| `JWT_SECRET` | Production signing key — different from dev |
| `REDIS_URL` | Required if using BullMQ |
| `CORS_ORIGINS` | Your production frontend domain(s) |

---

## Clustering in production

With `NODE_ENV=production`, `cluster` defaults to `true`. The primary process forks `os.cpus().length` workers. To override:

```ts
ignite({ cluster: true, workers: 2 });
```

For containerised deployments where you want one process per container (and rely on the orchestrator for scaling), set:

```ts
ignite({ cluster: false });
```

Or use a single-CPU container image and let `os.cpus().length` naturally be `1`.

---

## Graceful shutdown

Always wire `gracefulShutdown` to handle SIGTERM (sent by orchestrators before replacing a pod/dyno):

```ts
ignite({ cluster: true })
  .then(gracefulShutdown);
```

The default drain window is 10 seconds. Adjust for long-running requests:

```ts
  .then((server) => gracefulShutdown(server, 30_000));
```

---

## Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Inject environment variables via `docker run -e` or a secrets manager. Do not copy `.env` into the image.

---

## Railway / Render / Heroku

These platforms:

1. Detect `npm start` from `package.json`.
2. Inject `PORT` automatically.
3. Let you set env vars through their dashboard.

No extra configuration is needed — `npm start` (`efc start prod`) handles the rest.

---

## Health check endpoint

The scaffolder generates `src/api/health.ts`:

```ts
export const GET = async (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};
```

This maps to `GET /health`. Point your load balancer / Kubernetes liveness probe at it:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## Production checklist

- [ ] `NODE_ENV=production` set in the platform
- [ ] `JWT_SECRET` is a 64-byte random hex string unique to production
- [ ] `.env` is **not** copied into the Docker image or committed to git
- [ ] `CORS_ORIGINS` is set to your actual frontend domain(s)
- [ ] `gracefulShutdown` is wired in `src/index.ts`
- [ ] Health check endpoint is configured in the load balancer
- [ ] Redis is available if using BullMQ tasks
- [ ] `efc doctor` passes locally with production-like env vars
