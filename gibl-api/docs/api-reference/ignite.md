# `ignite(config)` — API Reference

`ignite()` is the single entry point that boots the framework. It handles clustering, database, auth, tasks, and routing in the correct order.

```ts
import { ignite } from 'express-file-cluster';

const server = await ignite(config);
```

**Returns:** `Promise<http.Server | undefined>`

- Returns `http.Server` in a worker process (or in single-process mode).
- Returns `undefined` in the master process (clustering enabled, primary fork).

---

## `EFCConfig` reference

```ts
interface EFCConfig {
  // Routing
  basePath?: string;

  // Clustering
  cluster?: boolean;
  workers?: number;
  onWorkerReady?: (id: number) => void;
  onWorkerCrash?: (id: number, code: number) => void;

  // Database
  database?: 'mongodb' | 'postgresql';
  databaseUrl?: string;

  // Auth
  authStrategy?: 'http-only' | 'localStorage';
  jwtSecret?: string;

  // Background tasks
  tasks?: TaskConfig | false;

  // HTTP
  port?: number;
  cors?: boolean | CorsConfig;
  globalMiddlewares?: RequestHandler[];
  onError?: ErrorRequestHandler;

  // Developer tools
  dashboard?: boolean;
}
```

---

## Option details

### `basePath`

URL prefix prepended to every route. Default: `'/v1/api'`.

```ts
ignite({ basePath: '/api' });
// routes: /api/health, /api/users/:id, ...
```

Set to `'/'` to mount routes directly at the root with no prefix.

---

### `dashboard`

When `true`, EFC mounts a live API documentation page at `GET /` (or `GET <basePath>/`) that is only active in development (`NODE_ENV === 'development'`). The page lists every registered route with its method, path, description, and request/response examples derived from each file's `meta` export.

```ts
ignite({ dashboard: true });
```

---

### `port`

HTTP listen port. Falls back to the `PORT` environment variable, then `3000`.

```ts
ignite({ port: 8080 });
// or: PORT=8080 in .env
```

---

### `cluster`

Enable multi-core clustering. When `true`, the primary process forks `workers` child processes and returns `undefined`. Each worker runs the full Pre-Flight lifecycle independently.

Default: `true` when `NODE_ENV === 'production'`, `false` otherwise.

```ts
ignite({ cluster: true, workers: 4 });
```

---

### `workers`

Number of worker processes to fork. Default: `os.cpus().length`.

---

### `onWorkerReady`

Called by the primary process when a worker emits the `'online'` event.

```ts
onWorkerReady: (id) => logger.info(`Worker ${id} is live`),
```

---

### `onWorkerCrash`

Called by the primary process when a worker exits unexpectedly, before a replacement is forked. The `code` is the exit code (or `-1` if the worker was killed by a signal).

```ts
onWorkerCrash: (id, code) => alerting.send(`Worker ${id} crashed with code ${code}`),
```

---

### `database`

Database engine to connect. When omitted, EFC attempts to detect the engine from the `DATABASE_URL` format (`mongodb://...` → `'mongodb'`, `postgres://...` → `'postgresql'`).

> **`'postgresql'` is accepted by the type but not yet implemented in the runtime** (landing in Phase 2). Only `'mongodb'` (via Mongoose) works today.

---

### `databaseUrl`

Connection string for the database. Falls back to the `DATABASE_URL` environment variable.

---

### `authStrategy`

How JWTs are delivered to clients:

| Value | Mechanism |
|---|---|
| `'http-only'` | `HttpOnly + Secure + SameSite=Strict` cookie named `efc_token` |
| `'localStorage'` | Token returned in response body; client attaches `Authorization: Bearer <token>` |

Default: `'http-only'`.

---

### `jwtSecret`

Secret used to sign and verify JWTs (HS256). Falls back to the `JWT_SECRET` environment variable. Must be at least 32 random bytes for production use.

---

### `tasks`

Background task runtime configuration. Set to `false` (or omit) to disable the task system.

```ts
interface TaskConfig {
  backend: 'bullmq' | 'pg-boss';
  redisUrl?: string;    // BullMQ only — defaults to redis://localhost:6379
  concurrency?: number; // Jobs processed in parallel per worker — default 5
}
```

> **`'pg-boss'` is accepted by the type but not yet implemented in the runtime** (landing in Phase 2). Only `'bullmq'` works today.

---

### `cors`

CORS configuration. Default: `true` (allow all origins).

When `true` and `CORS_ORIGINS` is set in the environment, EFC restricts the `Access-Control-Allow-Origin` header to the comma-separated list of allowed origins.

```ts
// Explicit config
ignite({
  cors: {
    origin: ['https://app.example.com', 'https://admin.example.com'],
    credentials: true,
    maxAge: 86400,
  },
});

// Env-driven (preferred)
// CORS_ORIGINS=https://app.example.com,https://admin.example.com
ignite({ cors: true });
```

Set `cors: false` to skip CORS headers entirely.

```ts
interface CorsConfig {
  origin?: string | string[] | boolean;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
}
```

---

### `globalMiddlewares`

Array of Express `RequestHandler` functions applied to every route, in order, before route-level middleware.

```ts
ignite({
  globalMiddlewares: [requestLogger, rateLimiter],
});
```

---

### `onError`

Override the built-in global error handler. Receives `(err, req, res, next)`. If not provided, EFC responds with:

- `{ error: err.message, statusCode: err.statusCode }` for `HttpError` instances.
- `{ error: 'Internal Server Error', statusCode: 500 }` for all other errors.

```ts
ignite({
  onError: (err, req, res, _next) => {
    logger.error({ err, url: req.url });
    const status = (err as any).statusCode ?? 500;
    res.status(status).json({ error: err.message });
  },
});
```

---

## `gracefulShutdown(server, timeoutMs?)`

Registers `SIGTERM` and `SIGINT` handlers for clean shutdown. Pass the `http.Server` returned by `ignite()`.

```ts
ignite({ port: 3000 })
  .then(gracefulShutdown);
// or with a custom timeout:
  .then((server) => gracefulShutdown(server, 30_000));
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `server` | `http.Server \| undefined` | — | Server to close (undefined for the master process) |
| `timeoutMs` | `number` | `10_000` | Force-exit after this many milliseconds if `server.close()` hasn't finished |
