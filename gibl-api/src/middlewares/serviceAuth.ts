import type { Request, Response, NextFunction, RequestHandler } from "express";
import { HttpError } from "express-file-cluster";
import { requireAuth } from "express-file-cluster/auth";

/**
 * Lets a tool route be called either by a logged-in user (normal JWT) or by
 * the Data Layer service acting on a user's behalf. Service calls authenticate
 * with a shared secret in the `X-Service-Key` header instead of a user token,
 * and must identify the target user via `clientId` in the request body.
 */
export const requireServiceOrUser = (...allowedRoles: string[]): RequestHandler => {
  const userAuth = requireAuth(...allowedRoles);

  return (req: Request, res: Response, next: NextFunction) => {
    const serviceKey = req.header("X-Service-Key");
    const expectedKey = process.env.DATA_LAYER_SERVICE_SECRET;

    if (serviceKey && expectedKey && serviceKey === expectedKey) {
      const clientId = req.body?.clientId ?? req.query?.clientId;
      if (!clientId) {
        return next(new HttpError(400, "clientId is required for service calls"));
      }
      (req as any).user = { id: clientId, role: "service" };
      return next();
    }

    return userAuth(req, res, next);
  };
};
