# Authentication Guide

EFC ships a complete JWT authentication system. Choose between two delivery strategies depending on your frontend architecture.

---

## Choosing a strategy

| | `http-only` | `localStorage` |
|---|---|---|
| **Token location** | `HttpOnly` cookie | Response body → client storage |
| **XSS risk** | Immune (JS can't read the cookie) | Exposed (JS reads `localStorage`) |
| **CSRF risk** | Mitigated by `SameSite=Strict` | Not applicable (no cookie) |
| **Best for** | SSR / SSG frontends, same-origin SPAs | SPAs on a different origin, mobile apps |
| **`requireAuth` reads from** | `req.cookies.efc_token` | `Authorization: Bearer` header |

Configure the strategy in `ignite()`:

```ts
ignite({ authStrategy: 'http-only' });   // default
ignite({ authStrategy: 'localStorage' });
```

---

## `http-only` strategy

### Login

```ts
// src/api/auth/login.ts
import type { Request, Response } from 'express';
import { issueToken } from 'express-file-cluster/auth';
import { User } from '../../model/User.js';

export const POST = async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !verifyPassword(req.body.password, user.passwordHash)) {
    throw new HttpError(401, 'Invalid credentials');
  }

  await issueToken(res, { sub: user.id, role: user.role });
  res.json({ message: 'Logged in' });
};
```

`issueToken` sets a cookie named `efc_token`:

```
Set-Cookie: efc_token=<jwt>; Path=/; HttpOnly; Secure; SameSite=Strict
```

In development (`NODE_ENV !== 'production'`), `Secure` is omitted so the cookie works over `http://localhost`.

### Logout

```ts
// src/api/auth/logout.ts
import type { Request, Response } from 'express';
import { revokeToken } from 'express-file-cluster/auth';

export const POST = async (req: Request, res: Response) => {
  revokeToken(res);
  res.json({ message: 'Logged out' });
};
```

### Protecting routes

```ts
// src/api/profile.ts
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth];

export const GET = async (req, res) => {
  const user = (req as any).user; // decoded JWT payload
  res.json({ userId: user.sub, role: user.role });
};
```

---

## `localStorage` strategy

### Login

```ts
// src/api/auth/login.ts
import type { Request, Response } from 'express';
import { signToken } from 'express-file-cluster/auth';
import { User } from '../../model/User.js';

export const POST = async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !verifyPassword(req.body.password, user.passwordHash)) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const token = await signToken({ sub: user.id, role: user.role });
  res.json({ token });
};
```

The client stores the token:

```js
// frontend
const { token } = await fetch('/auth/login', { method: 'POST', body: ... }).then(r => r.json());
localStorage.setItem('authToken', token);
```

And attaches it on protected requests:

```js
fetch('/profile', {
  headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
});
```

### Protecting routes

Identical to `http-only` — `requireAuth` reads from the correct source based on the configured strategy:

```ts
export const middlewares = [requireAuth];
```

---

## Custom token payload

The `payload` object you pass to `issueToken` or `signToken` becomes the JWT body. Standard JWT claims (`sub`, `iat`, `exp`, `iss`, `aud`) are valid; you can add any custom fields.

```ts
await issueToken(res, {
  sub: user.id,
  role: user.role,
  plan: user.subscriptionPlan,
  orgId: user.organizationId,
});
```

If you want route protection based on the `role` claim, pass role names to `requireAuth`: `requireAuth('admin')` verifies the token *and* checks `payload.role` is one of the given roles, returning `403 Forbidden` otherwise. See [RBAC](./rbac.md).

Access custom claims in protected handlers via `(req as any).user`:

```ts
export const GET = async (req, res) => {
  const { sub, role, plan } = (req as any).user;
  res.json({ sub, role, plan });
};
```

---

## Token lifetime

Set `JWT_EXPIRES_IN` in `.env`. Default: `7d`.

```
JWT_EXPIRES_IN=15m   # short-lived — for high-security use cases
JWT_EXPIRES_IN=1h
JWT_EXPIRES_IN=7d    # default
JWT_EXPIRES_IN=30d
```

There is currently no refresh-token mechanism built into the framework itself. For long-lived sessions with short-lived tokens, implement a `/auth/refresh` route that issues a new token using the existing one as a credential — if you enabled **User portal** during scaffolding (with MongoDB), a working `POST /auth/refresh` route is already generated for you: it stores a rotating long-lived refresh token in the database and reads it from an `efc_refresh_token` cookie or the `refreshToken` body field (see [Generated Portals](./generated-portals.md)).

---

## Cookie domain

For multi-subdomain setups (e.g. `api.example.com` setting a cookie for `*.example.com`), set:

```
COOKIE_DOMAIN=.example.com
```

or configure it in `ignite()` (read from the env var automatically).

---

## Environment variables

| Variable | Description |
|---|---|
| `JWT_SECRET` | Signing key — must be set; generate with `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | Token lifetime — default `7d` |
| `COOKIE_DOMAIN` | Cookie domain for `http-only` strategy |

See the full [Environment Variables reference](./environment-variables.md).
