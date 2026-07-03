# File-Based Routing

EFC turns your directory tree into your route tree. The scanner walks `src/api/` recursively (a fixed convention, not a configurable option), converts each file path to a URL, and mounts the handlers on Express — no explicit registration required.

---

## Naming rules

| Rule | Example file | Resolved URL |
|---|---|---|
| Plain file | `api/health.ts` | `/health` |
| `index.ts` in a directory | `api/users/index.ts` | `/users` |
| Nested directory | `api/posts/recent.ts` | `/posts/recent` |
| Dynamic segment | `api/users/[id].ts` | `/users/:id` |
| Dynamic directory | `api/posts/[slug]/comments.ts` | `/posts/:slug/comments` |

**`[bracket]` → `:param`** — any path segment wrapped in square brackets becomes an Express route parameter accessible as `req.params.<name>`.

**`index.ts` → parent path** — a file named `index.ts` (or `.js`) inside a directory maps to the directory's URL without a trailing `/index`.

---

## Supported file extensions

The scanner recognises `.ts`, `.js`, `.mts`, `.mjs`, `.cts`, and `.cjs`.

---

## Route priority

Static routes are registered before dynamic routes at each segment level. Given:

```
api/users/me.ts        →  /users/me        (static)
api/users/[id].ts      →  /users/:id       (dynamic)
```

A request to `/users/me` matches the static route first and never falls through to `/users/:id`.

---

## Exporting handlers

Each route file exports one or more uppercase HTTP method names as async functions:

```ts
// src/api/users/index.ts
import type { Request, Response } from 'express';

export const GET = async (req: Request, res: Response) => {
  res.json({ users: [] });
};

export const POST = async (req: Request, res: Response) => {
  res.status(201).json({ id: 'new-id' });
};
```

Supported method names: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.

Any method not exported on a route that does export at least one method returns **405 Method Not Allowed** with an `Allow` header listing the implemented methods:

```
HTTP/1.1 405 Method Not Allowed
Allow: GET, POST
Content-Type: application/json

{ "error": "Method Not Allowed" }
```

---

## Dynamic parameters

```ts
// src/api/users/[id].ts
import type { Request, Response } from 'express';
import { HttpError } from 'express-file-cluster';
import { User } from '../../model/User.js';

export const GET = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
};

export const DELETE = async (req: Request, res: Response) => {
  await User.delete(req.params.id);
  res.status(204).send();
};
```

---

## Route metadata (`meta` export)

A route file can export a `meta` object to provide documentation shown in the [dashboard](../api-reference/ignite.md#dashboard). `meta` is keyed by HTTP method — each method implemented in the file gets its own description and request/response example, rendered as a separate documentation block. All fields are optional.

```ts
// src/api/users/[id].ts
export const meta = {
  GET: {
    description: 'Fetch a user by ID.',
    request: {
      headers: { Authorization: 'Bearer <token>' },
      params:  { id: 'usr_01HXZ' },
      query:   { include: 'profile' },
    },
    response: {
      status: 200,
      body: {
        id:        'usr_01HXZ',
        name:      'Ada Lovelace',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
  },
  DELETE: {
    description: 'Delete a user by ID.',
    request: {
      headers: { Authorization: 'Bearer <token>' },
      params:  { id: 'usr_01HXZ' },
    },
    response: { status: 204 },
  },
};
```

**`RouteMeta` / `RouteMethodMeta` interfaces:**

```ts
type RouteMeta = Partial<Record<string, RouteMethodMeta>>;

interface RouteMethodMeta {
  description?: string;
  request?: {
    headers?: Record<string, string>;
    params?:  Record<string, string>;
    query?:   Record<string, string>;
    body?:    unknown;
  };
  response?: {
    status?: number;
    body?:   unknown;
  };
}
```

Only add an entry for methods you want documented — a method with no key in `meta` simply shows an undocumented block in the dashboard.

The dashboard renders `response.body` values as their **type names** (`String`, `Number`, `Boolean`, `Date`) rather than the literal values you provide. ISO 8601 date strings (e.g., `'2026-01-01T00:00:00.000Z'`) are automatically detected and shown as `Date`.

---

## Route-level middleware

Export a `middlewares` array from a route file. The middlewares apply to every handler in that file and run after global middleware.

```ts
// src/api/admin/settings.ts
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth];

export const GET = async (req, res) => {
  // Only reached if requireAuth passes
  res.json({ settings: {} });
};
```

---

## How the scanner works internally

`scanDir(dir)` in `packages/core/src/router/scan.ts`, called with the resolved `src/api/` path:

1. Walks the directory recursively with `fs.readdirSync`.
2. For each file, converts the path relative to `src/api/` to a URL:
   - Strips the extension.
   - Replaces `/index` with `''` (parent path).
   - Replaces `[param]` with `:param`.
   - Prepends `/` if missing.
3. Sorts results so static routes precede dynamic routes.
4. Returns a `RouteEntry[]` array with `urlPath`, `filePath`, and `params`.

`mountRoutes(app, routes)` in `packages/core/src/router/mount.ts`:

1. Iterates `RouteEntry[]`.
2. Dynamically `import()`s each route module.
3. Reads the optional `middlewares` export.
4. For each known HTTP method that is exported as a function, registers it with `app.<method>(urlPath, ...middlewares, asyncWrap(handler))`.
5. Registers an `app.all()` catch for unimplemented methods that returns 405.

`asyncWrap` wraps every handler in `Promise.resolve(...).catch(next)` so that thrown errors and rejected promises are forwarded to the Express error handler automatically.
