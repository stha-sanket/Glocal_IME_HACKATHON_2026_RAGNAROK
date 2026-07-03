# `compose(...handlers)` — API Reference

`compose` chains multiple Express `RequestHandler` functions into a single handler. It is the primary tool for handler-level (single-method) middleware.

```ts
import { compose } from 'express-file-cluster';
```

---

## Signature

```ts
function compose(...handlers: RequestHandler[]): RequestHandler
```

**Parameters:** one or more Express `RequestHandler` functions.

**Returns:** a single `RequestHandler` that runs the provided handlers in sequence.

---

## Usage

```ts
import { compose } from 'express-file-cluster';
import { validateBody } from '../../middlewares/validation';
import { CreateUserSchema } from '../../schemas/user';

export const POST = compose(
  validateBody(CreateUserSchema),
  async (req, res) => {
    // validateBody ran first — req.body is validated
    res.status(201).json({ id: 'new-id' });
  },
);
```

---

## Behaviour

- Handlers are called in the order they are passed.
- Each handler receives the real `next` function of its predecessor; calling `next()` advances to the next handler in the chain.
- If the last handler calls `next()`, control passes to the surrounding Express middleware chain (equivalent to the route calling `next()`).
- If any handler throws synchronously or returns a rejected promise, the error is forwarded to `next(err)` and bubbles up to the global error handler.

---

## Composing async middleware

`compose` works seamlessly with async functions:

```ts
export const DELETE = compose(
  requireAuth,
  async (req, res, next) => {
    const resource = await db.findById(req.params.id);
    if (!resource) return next(new HttpError(404, 'Not found'));
    (req as any).resource = resource;
    next();
  },
  async (req, res) => {
    await (req as any).resource.delete();
    res.status(204).send();
  },
);
```

---

## When to use `compose` vs. `middlewares`

| Scenario | Recommended approach |
|---|---|
| Guard applies to every handler in the file | `export const middlewares = [guard]` |
| Guard applies to one specific method | `export const POST = compose(guard, handler)` |
| Chaining multiple guards on one method | `export const POST = compose(guard1, guard2, handler)` |
