# Database Guide

EFC's `defineModel` surface is designed to be engine-agnostic across two database engines: **MongoDB** (via `mongoose`) and **PostgreSQL** (via Drizzle). **Only the MongoDB adapter is implemented today** — PostgreSQL is planned for Phase 2. `create-efc-app` still lets you pick PostgreSQL, but it only scaffolds commented-out schema stubs and `// TODO` route bodies until the adapter lands.

---

## Auto-detection

If you don't pass `database` to `ignite()`, EFC inspects `DATABASE_URL`:

```
mongodb://...    → 'mongodb'
postgres://...   → 'postgresql'
```

---

## MongoDB

### Setup

Install the peer dependency:

```bash
npm install mongoose
```

Configure in `ignite()`:

```ts
ignite({
  database: 'mongodb',
  databaseUrl: process.env.DATABASE_URL,
  // or omit — DATABASE_URL is read automatically
});
```

`DATABASE_URL` format: `mongodb://user:pass@host:27017/dbname` or a MongoDB Atlas URI.

### Connection lifecycle

During Pre-Flight, each worker calls `connectMongo(databaseUrl)` which delegates to `mongoose.connect()`. The connection is stored in the thread-local `db` proxy. Workers never share a connection — each has its own pool.

---

## Defining models

`defineModel` compiles your schema into the engine-specific representation at first use:

```ts
// src/model/User.ts
import { defineModel } from 'express-file-cluster';

interface User {
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
}

export const User = defineModel<User>('User', {
  name:  { type: 'string',  required: true },
  email: { type: 'string',  required: true, unique: true },
  role:  { type: 'string',  default: 'member' },
});
```

For MongoDB, this produces a Mongoose schema with `timestamps: true` (adds `createdAt` and `updatedAt` automatically).

> `create-efc-app`'s User/Admin portal options scaffold many more models this way (`Session`, `Notification`, `File`, `Subscription`, `Invoice`, and more) — see [Generated Portals](./generated-portals.md) for the full list.

### Supported field types

| EFC type | Mongoose type | PostgreSQL type |
|---|---|---|
| `'string'` | `String` | `varchar` |
| `'number'` | `Number` | `numeric` |
| `'boolean'` | `Boolean` | `boolean` |
| `'date'` | `Date` | `timestamp` |
| `'object'` | `Object` | `jsonb` |
| `'array'` | `Array` | `jsonb` |

---

## CRUD operations

```ts
// src/api/users/index.ts
import type { Request, Response } from 'express';
import { HttpError } from 'express-file-cluster';
import { User } from '../../model/User.js';

export const GET = async (req: Request, res: Response) => {
  const users = await User.find();            // all users
  res.json(users);
};

export const POST = async (req: Request, res: Response) => {
  const user = await User.create(req.body);   // returns { id, name, email, role, ... }
  res.status(201).json({ id: user.id });
};
```

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

export const PATCH = async (req: Request, res: Response) => {
  const user = await User.update(req.params.id, req.body);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
};

export const DELETE = async (req: Request, res: Response) => {
  await User.delete(req.params.id);
  res.status(204).send();
};
```

---

## Raw client (`db`)

For operations beyond the CRUD surface, import the native client directly:

```ts
import { db } from 'express-file-cluster';

// MongoDB aggregation pipeline
export const GET = async (req, res) => {
  const stats = await db.model('User').aggregate([
    { $group: { _id: '$role', total: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  res.json(stats);
};
```

`db` is a `Proxy` that forwards all property accesses to the live client. It throws if accessed before Pre-Flight completes — in practice this only happens in test code that bypasses `ignite()`.

See the full [`db` API reference](../api-reference/db.md).

---

## Model reuse in tasks

Models work identically inside task handlers:

```ts
// src/tasks/DeleteExpiredSessions.ts
import { defineTask } from 'express-file-cluster/tasks';
import { Session } from '../model/Session.js';

export default defineTask<{ olderThanDays: number }>(async ({ olderThanDays }) => {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000);
  const expired = await Session.find({ expiresAt: { $lt: cutoff } as any });
  for (const s of expired) {
    await Session.delete(s.id);
  }
});
```

---

## PostgreSQL (planned)

PostgreSQL support via Drizzle ORM is scheduled for Phase 2 (now active). The `defineModel` surface will remain identical — switching engines will require only changing `DATABASE_URL` and reinstalling the adapter peer dependency.
