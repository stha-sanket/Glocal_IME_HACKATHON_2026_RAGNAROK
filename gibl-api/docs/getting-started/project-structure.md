# Project Structure

A scaffolded EFC project looks like this:

```
my-api/
├── src/
│   ├── api/                       # HTTP routes — every file here is a route
│   │   ├── health.ts              # GET /health
│   │   ├── auth/
│   │   │   ├── login.ts           # POST /auth/login
│   │   │   ├── logout.ts          # POST /auth/logout
│   │   │   └── register.ts        # POST /auth/register (if userPortal)
│   │   └── users/
│   │       ├── index.ts           # GET /users  •  POST /users
│   │       └── [id].ts            # GET /users/:id  •  DELETE /users/:id
│   ├── tasks/                     # Background jobs (scanned non-recursively)
│   │   └── SendEmail.ts           # task name: "SendEmail"
│   ├── model/                     # Engine-agnostic data models
│   │   ├── User.ts
│   │   └── Role.ts                # generated if the RBAC option is enabled
│   └── index.ts                   # Framework entry point
├── efc.config.ts                  # Structural configuration
├── .env                           # Real secrets — gitignored
├── .env.example                   # Documented template — safe to commit
├── .gitignore
├── package.json
└── tsconfig.json
```

If you enable the **User portal**, **Admin portal**, **RBAC**, or **Mailer** options during scaffolding, `src/model/`, `src/api/`, and `src/tasks/` fill out considerably — see [Generated Portals](../guides/generated-portals.md) for the full list of models and routes, [RBAC](../guides/rbac.md) for the `requireAuth('role')` shorthand, and [Mailer](../guides/mailer.md) for the SMTP setup.

---

## `src/api/` — Route modules

`src/api/` is a fixed convention, not a configurable option — EFC resolves it automatically (checking `src/api`, then `api`, then `dist/api` for compiled output). Every `.ts` (or `.js`) file inside it becomes a route. The URL path is derived from the file path relative to `src/api/`:

| File | URL |
|---|---|
| `api/health.ts` | `/health` |
| `api/users/index.ts` | `/users` |
| `api/users/[id].ts` | `/users/:id` |
| `api/posts/[slug]/comments.ts` | `/posts/:slug/comments` |

Files named `index.ts` inside a directory map to the directory's URL (no `/index` suffix).
`[bracket]` segments become Express `:param` segments.

See [File-Based Routing](../core-concepts/file-based-routing.md) for the complete rule set.

---

## `src/tasks/` — Background task modules

`src/tasks/` is likewise a fixed convention. It is scanned **non-recursively** — subdirectories are not processed. Every file directly inside it registers a named background task; the task name is the file's basename without extension:

| File | Task name |
|---|---|
| `tasks/SendEmail.ts` | `"SendEmail"` |
| `tasks/ResizeImage.ts` | `"ResizeImage"` |

Tasks must export a default `TaskDefinition` created with `defineTask()`.

See [Background Tasks](../core-concepts/background-tasks.md).

---

## `src/model/` — Data models

Engine-agnostic model definitions using `defineModel()`. On MongoDB this compiles to a real Mongoose-backed model with working CRUD. **On PostgreSQL, scaffolded model files are currently commented-out Drizzle schema stubs** (`export {}`) — the PostgreSQL adapter is not yet implemented in the runtime.

See [Database Guide](../guides/database.md).

---

## `src/index.ts` — Entry point

The single call that boots the framework:

```ts
import { ignite, gracefulShutdown } from 'express-file-cluster';

ignite({
  cluster: true,
  workers: 2,
  tasks: { backend: 'bullmq' },
})
  .then(gracefulShutdown)
  .catch(console.error);
```

`ignite()` reads `PORT`, `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGINS` from `process.env` automatically — no explicit wiring needed if the env vars are set. `src/api/` and `src/tasks/` are resolved by convention, not passed as options — there is no `apiDir`/`tasksDir` config.

See [`ignite()` API reference](../api-reference/ignite.md).

---

## `efc.config.ts` — Structural configuration

The scaffolder generates a typed config file that captures structural choices (auth strategy, task backend). Runtime secrets stay in `.env`.

```ts
import type { EFCConfig } from 'express-file-cluster';

// Structural config only — runtime values (PORT, DATABASE_URL, JWT_SECRET, etc.) are read from .env
const config: EFCConfig = {
  authStrategy: 'http-only',
  tasks: { backend: 'bullmq', concurrency: 5 },
  globalMiddlewares: [],
};

export default config;
```

> `efc.config.ts` is currently informational — `ignite()` does **not** auto-load it. `src/index.ts` is the actual runtime entrypoint; import from `efc.config.ts` yourself and spread its fields into `ignite()` if you want them applied.

---

## `.env` and `.env.example`

`.env` is gitignored and holds real secrets. `.env.example` is committed and documents every required variable with placeholder values.

See [Environment Variables](../guides/environment-variables.md) for the full variable reference.
