# `HttpError` — API Reference

`HttpError` is EFC's built-in exception class for signalling HTTP error responses from route handlers. Throw it anywhere in a handler and the global error interceptor will format the response automatically.

```ts
import { HttpError } from 'express-file-cluster';
```

---

## Constructor

```ts
new HttpError(statusCode: number, message: string)
```

| Parameter | Type | Description |
|---|---|---|
| `statusCode` | `number` | HTTP status code (e.g. `400`, `401`, `403`, `404`, `422`, `500`) |
| `message` | `string` | Human-readable error message included in the response body |

---

## Properties

| Property | Type | Description |
|---|---|---|
| `statusCode` | `number` | The HTTP status code passed to the constructor |
| `message` | `string` | Inherited from `Error` — the message passed to the constructor |
| `name` | `string` | Always `'HttpError'` |

---

## Usage

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
```

The global error interceptor catches the throw and responds with:

```json
{
  "error": "User not found",
  "statusCode": 404
}
```

---

## Default response shape

When `HttpError` is thrown and no custom `onError` handler is configured:

```
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "User not found",
  "statusCode": 404
}
```

---

## Overriding the error handler

If you provide `onError` in `ignite()`, you receive the raw `HttpError` and can format the response however you want:

```ts
ignite({
  onError: (err, req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.statusCode).json({
        code: err.statusCode,
        message: err.message,
        path: req.path,
      });
    } else {
      res.status(500).json({ code: 500, message: 'Internal Server Error' });
    }
  },
});
```

---

## Non-`HttpError` exceptions

Any `throw` that is *not* an `HttpError` (or a subclass) is treated as an unexpected server error:

```json
{
  "error": "Internal Server Error",
  "statusCode": 500
}
```

The original error is logged to `stderr` with `[EFC] Unhandled error:`.
