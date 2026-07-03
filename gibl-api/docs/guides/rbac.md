# Role-Based Access Control (RBAC)

Role checks are built into `requireAuth` itself — call it with role names (`requireAuth('admin')`) instead of a separate middleware (see [Authentication](./authentication.md)). `create-efc-app` can also scaffold a `Role` model and role-management API for you via the **RBAC** feature option.

---

## Enabling it

Toggle **Role-based access control** in the features multiselect:

```
? Features: (space to toggle, enter to confirm)
    ◉ User portal
    ◉ Admin portal
    ◉ Role-based access control
```

RBAC is most useful alongside **User portal** and/or **Admin portal**, since it changes how their generated routes are protected — but it can be toggled independently.

---

## What gets generated

### Route protection

Every generated route that would otherwise export `middlewares = [requireAuth]` instead exports:

```ts
// User-facing routes
export const middlewares = [requireAuth('user', 'admin')];

// Admin-facing routes
export const middlewares = [requireAuth('admin')];
```

`requireAuth('admin')` verifies the JWT *and* checks that `payload.role` is one of the given roles — returning `401` if the token is missing/invalid, `403` if the role doesn't match.

If RBAC is **not** enabled, admin routes fall back to an inline guard at the top of the handler instead:

```ts
export const middlewares = [requireAuth];

export const GET = async (req, res) => {
  const user = (req as any).user;
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  // ...
};
```

Both approaches produce the same 401/403 behavior — RBAC-on just centralizes the check into `requireAuth(...)` and adds the `Role` model below.

### `Role` model

A `src/model/Role.ts` model is created (MongoDB: a real `defineModel`-backed collection; PostgreSQL: a commented-out Drizzle stub, per the current [database support status](./database.md)).

### Admin role management routes

If **RBAC** and **Admin portal** are both enabled, a full role-management API is scaffolded:

| Method | Path |
|---|---|
| `GET` | `/admin/roles` |
| `POST` | `/admin/roles` |
| `GET` | `/admin/roles/:id` |
| `PUT` | `/admin/roles/:id` |
| `DELETE` | `/admin/roles/:id` |

See [Generated Portals](./generated-portals.md) for the complete route/model inventory.

---

## Using it yourself

You don't need the scaffolder to use this pattern — `requireAuth(...roles)` is exported from `express-file-cluster/auth` in every EFC project:

```ts
// src/api/admin/dashboard.ts
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('admin')];

export const GET = async (_req, res) => {
  res.json({ stats: { users: 42 } });
};
```

Pass multiple roles to allow any of them: `requireAuth('user', 'admin')`. See the [Auth API reference](../api-reference/auth.md#requireauth) for the full signature.
