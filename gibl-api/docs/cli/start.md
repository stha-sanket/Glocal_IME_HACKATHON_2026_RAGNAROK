# `efc start` / `efc build` / `efc run`

## `efc start dev`

Starts the development server.

```bash
efc start dev
```

**Behaviour:**

- Reads `.env` from the project root and injects variables into `process.env`. Variables already present in the environment take precedence.
- Defaults `NODE_ENV` to `'development'`. A `NODE_ENV` value in `.env` or in the parent environment overrides this default.
- Locates the entry point by checking these paths in order:
  1. `src/index.ts`
  2. `index.ts`
  3. `src/index.js`
  4. `index.js`
- Launches the entry point via `tsx watch --include src <entry>` for hot-reload on every file change inside `src/`.
- **Clustering is off in development** — `ignite()` defaults `cluster` to `false` when `NODE_ENV !== 'production'`. This gives fast restarts and clean stack traces.

**Requires:** `tsx` installed (either as a project dependency in `node_modules/.bin/tsx`, or globally on `PATH`).

---

## `efc start prod`

Starts the production server from compiled output.

```bash
efc start prod
```

**Behaviour:**

- Checks that `dist/index.js` exists. If not, prints an error instructing you to run `efc build prod` first.
- Sets `NODE_ENV=production`.
- Does **not** read `.env` — secrets must come from the platform's environment.
- Spawns `node dist/index.js`.
- With `NODE_ENV=production`, `ignite()` defaults `cluster` to `true` and forks `os.cpus().length` workers.

---

## `efc build prod`

Compiles TypeScript to JavaScript.

```bash
efc build prod
```

**Behaviour:**

- Runs `tsup` with the project's `tsup.config.ts`.
- Outputs dual CJS/ESM bundles to `dist/`.
- Type-checks the project (equivalent to `tsc --noEmit`).

**Requires:** `tsup` installed as a dev dependency.

---

## `efc run tests`

Runs the test suite.

```bash
efc run tests
```

**Behaviour:**

- Invokes Vitest.
- Pass Vitest flags through directly:

```bash
efc run tests --watch
efc run tests --coverage
efc run tests --reporter=verbose
```

**Requires:** `vitest` installed as a dev dependency.

---

## `package.json` lifecycle scripts

The scaffolder wires these scripts automatically:

```json
{
  "scripts": {
    "dev":   "efc start dev",
    "build": "efc build prod",
    "start": "efc start prod",
    "test":  "efc run tests"
  }
}
```

Use `npm run dev`, `npm run build`, `npm start`, and `npm test` as shorthand.
