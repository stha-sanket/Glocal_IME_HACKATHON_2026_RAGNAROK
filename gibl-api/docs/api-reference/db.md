# Database — API Reference

EFC provides two levels of database access, both from `express-file-cluster`:

```ts
import { defineModel, db } from 'express-file-cluster';
```

---

## `defineModel(name, schema)`

Creates an engine-agnostic model with a unified CRUD surface. Designed to work against MongoDB (via `mongoose`, implemented today) or PostgreSQL (via Drizzle, planned — see below).

```ts
function defineModel<T extends Record<string, any>>(
  name: string,
  schema: ModelSchema,
): ModelCRUD<T>
```

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | Model name (used as the Mongoose model name / SQL table name) |
| `schema` | `ModelSchema` | Field definitions — see below |

### `ModelSchema`

```ts
type ModelSchema = Record<string, FieldDefinition>;

interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required?: boolean;
  unique?: boolean;
  default?: unknown;
}
```

### Example

```ts
// src/model/User.ts
import { defineModel } from 'express-file-cluster';

interface User {
  name: string;
  email: string;
  role: string;
}

export const User = defineModel<User>('User', {
  name:  { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  role:  { type: 'string', default: 'member' },
});
```

---

## `ModelCRUD<T>` — returned interface

Every model exposes these async methods:

### `find(filter?)`

```ts
find(filter?: Partial<T>): Promise<(T & { id: string })[]>
```

Returns all records matching the filter. Pass no arguments to return all records.

```ts
const users = await User.find();
const admins = await User.find({ role: 'admin' });
```

---

### `findById(id)`

```ts
findById(id: string): Promise<(T & { id: string }) | null>
```

Finds a single record by its primary key. Returns `null` if not found. The `id` string is cast to the engine's native PK type (`ObjectId` for MongoDB).

```ts
const user = await User.findById(req.params.id);
if (!user) throw new HttpError(404, 'User not found');
```

---

### `findOne(filter)`

```ts
findOne(filter: Partial<T>): Promise<(T & { id: string }) | null>
```

Finds the first record matching the filter. Returns `null` if not found.

```ts
const user = await User.findOne({ email: 'alice@example.com' });
```

---

### `create(data)`

```ts
create(data: Partial<T>): Promise<T & { id: string }>
```

Creates a new record. Returns the created record with its generated `id`.

```ts
const user = await User.create({ name: 'Alice', email: 'alice@example.com' });
res.status(201).json({ id: user.id });
```

---

### `update(id, data)`

```ts
update(id: string, data: Partial<T>): Promise<(T & { id: string }) | null>
```

Updates a record by id. Returns the updated record, or `null` if not found.

```ts
const user = await User.update(req.params.id, { role: 'admin' });
```

---

### `delete(id)`

```ts
delete(id: string): Promise<void>
```

Deletes a record by id. Does not throw if the record does not exist.

```ts
await User.delete(req.params.id);
res.status(204).send();
```

---

### `count(filter?)`

```ts
count(filter?: Partial<T>): Promise<number>
```

Returns the number of records matching the filter.

```ts
const total = await User.count();
const admins = await User.count({ role: 'admin' });
```

---

## Normalised `id` field

Every record returned by `defineModel` methods has a string `id` field:

- **MongoDB** — mapped from Mongoose's `_id` (`ObjectId.toString()`).
- **PostgreSQL** — mapped from the SQL primary key.

Route handler code never needs to branch on engine type to read the record's identifier.

---

## `db` — raw client (escape hatch)

`db` is a thread-local proxy that resolves to the native database client bootstrapped during Pre-Flight. Use it when `defineModel` doesn't cover an engine-specific feature.

```ts
import { db } from 'express-file-cluster';
```

The type of `db` at runtime:

| `config.database` | `db` type |
|---|---|
| `'mongodb'` | `mongoose.Connection` |
| `'postgresql'` | `pg.Pool` _(planned)_ |

### MongoDB example

```ts
import { db } from 'express-file-cluster';

export const GET = async (req, res) => {
  // Aggregation pipeline — not available through defineModel
  const results = await db.model('User').aggregate([
    { $match: { role: 'admin' } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  res.json(results);
};
```

### Safety

`db` is a JavaScript `Proxy`. Accessing any property before Pre-Flight completes (i.e. before `ignite()` has run) throws:

```
Error: [EFC] db not ready — accessed before Pre-Flight completed
```

In practice, route handlers and task handlers always run after Pre-Flight, so this error only appears in test code that constructs handlers manually without calling `ignite()`.

---

## `getDbClient()` / `setDbClient()`

Low-level functions used internally by EFC. You generally don't need these unless you're writing a custom database adapter.

```ts
import { getDbClient, setDbClient } from 'express-file-cluster';

setDbClient(myNativeConnection);    // called by EFC during Pre-Flight
const client = getDbClient();       // returns the stored client, throws if not set
```
