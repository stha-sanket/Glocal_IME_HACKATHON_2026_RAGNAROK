# Diagnostics — `efc routes` / `efc tasks` / `efc doctor`

The three diagnostic commands inspect your project without starting the server.

---

## `efc routes`

Prints the route table resolved from the `src/api/` directory.

```bash
efc routes
```

**Sample output:**

```
  Route Table
  ────────────────────────────────────────────────────────────
  /health                              src/api/health.ts
  /users                               src/api/users/index.ts
  /posts/:slug/comments                src/api/posts/[slug]/comments.ts
  /users/:id                           src/api/users/[id].ts
  ────────────────────────────────────────────────────────────

  4 route(s) found
```

Static routes appear before dynamic routes (routes with `:param` segments), matching the registration order used at runtime.

**When to use:** after adding, renaming, or moving route files to verify the URL mapping is what you expect.

**Lookup order for the routes directory:** `src/api/` → `api/` → `dist/api/` (first that exists). This is a fixed convention — there is no `apiDir` config option.

---

## `efc tasks`

Lists the background tasks found in `src/tasks/`.

```bash
efc tasks
```

**Sample output:**

```
  Background Tasks

  SendEmail
  ResizeImage
  ProcessPayment
```

Each name corresponds to a file basename without extension. That is the string to pass to `enqueue()`.

**Lookup order for the tasks directory:** `src/tasks/` → `tasks/` → `dist/tasks/` (first that exists). This is a fixed convention — there is no `tasksDir` config option.

---

## `efc doctor`

Validates your project setup and reports any problems.

```bash
efc doctor
```

**Checks performed:**

| Check | What it validates |
|---|---|
| `package.json` exists | Project root has a `package.json` |
| `tsconfig.json` exists | TypeScript config is present; hint: `tsc --init` |
| `src/api` exists | Route directory is present |
| `DATABASE_URL` set | `process.env.DATABASE_URL` is non-empty |
| `JWT_SECRET` set | `process.env.JWT_SECRET` is non-empty |

**Sample passing output:**

```
  EFC Doctor

  ✓  package.json exists
  ✓  tsconfig.json exists
  ✓  src/api directory exists
  ✓  DATABASE_URL set
  ✓  JWT_SECRET set

  All checks passed!
```

**Sample failing output:**

```
  EFC Doctor

  ✓  package.json exists
  ✓  tsconfig.json exists
  ✓  src/api directory exists
  ✗  DATABASE_URL set
       → Add DATABASE_URL to .env
  ✗  JWT_SECRET set
       → Add JWT_SECRET to .env (generate: openssl rand -hex 64)

  Some checks failed. Fix the issues above.
```

Exits with code `1` if any check fails.

**Note:** `efc doctor` reads `DATABASE_URL` and `JWT_SECRET` from `process.env`. In development, source `.env` before running the command — or run it via `npm run dev` which loads `.env` automatically.

```bash
# Quick way to run doctor with .env loaded:
source .env && efc doctor
```
