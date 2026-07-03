# Error Handling Guide

EFC provides a structured error model that converts exceptions into clean HTTP responses without try/catch in every handler.

---

## How it works

Every route handler is wrapped in `asyncWrap`, which passes any thrown error or rejected promise to Express's `next(err)`. The global error handler at the bottom of the middleware stack then inspects the error and responds.

```
throw new HttpError(404, 'Not found')
         ↓
asyncWrap catches it → next(err)
         ↓
EFC global error handler
         ↓
HTTP 404  { "error": "Not found", "statusCode": 404 }
```

---

## `HttpError`

Throw `HttpError` to signal a specific HTTP status:

```ts
import { HttpError } from 'express-file-cluster';

export const GET = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
};
```

The default response shape:

```json
{
  "error": "User not found",
  "statusCode": 404
}
```

See the full [`HttpError` reference](../api-reference/http-error.md).

---

## Unhandled errors

Any `throw` that is not an `HttpError` (e.g. a database error, a null pointer, an unexpected exception) is treated as a server error:

```json
{
  "error": "Internal Server Error",
  "statusCode": 500
}
```

The original error is logged to `stderr`:

```
[EFC] Unhandled error: TypeError: Cannot read properties of null
```

---

## Custom global error handler

Override the built-in handler with `onError` in `ignite()`:

```ts
import { HttpError } from 'express-file-cluster';
import type { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err instanceof HttpError ? err.statusCode : 500;
  const message = err instanceof HttpError ? err.message : 'Internal Server Error';

  logger.error({ err, url: req.url, method: req.method });

  res.status(status).json({
    error: message,
    path: req.path,
    requestId: req.headers['x-request-id'],
  });
};

ignite({ onError: errorHandler });
```

---

## Errors in middleware

Middleware errors are forwarded the same way — call `next(err)` or `throw` from an async middleware and the global handler picks it up:

```ts
// src/middlewares/validate.ts
import type { RequestHandler } from 'express';
import { HttpError } from 'express-file-cluster';
import { z } from 'zod';

export function validateBody(schema: z.ZodType): RequestHandler {
  return async (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new HttpError(422, result.error.message));
    }
    req.body = result.data;
    next();
  };
}
```

---

## Errors in tasks

Task errors do not crash the application. The BullMQ backend catches failed jobs, retries them according to `retries` and `backoff` options, and dead-letters them after the retry limit:

```
[EFC] Task SendEmail failed: Error: SMTP connection refused
```

After all retries are exhausted, the job moves to the BullMQ failed set. You can inspect it with a BullMQ dashboard (e.g. Bull Board).

---

## Error response reference

| Scenario | Status | Body |
|---|---|---|
| `throw new HttpError(N, msg)` | `N` | `{ "error": msg, "statusCode": N }` |
| Any other thrown error | `500` | `{ "error": "Internal Server Error", "statusCode": 500 }` |
| Method not implemented | `405` | `{ "error": "Method Not Allowed" }` + `Allow` header |
| Missing/invalid auth token | `401` | `{ "error": "Unauthorized" }` |
