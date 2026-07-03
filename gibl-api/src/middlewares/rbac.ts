import type { Request, Response, NextFunction, RequestHandler } from "express";
import { HttpError } from "express-file-cluster";
import { requireAuth as efcRequireAuth } from "express-file-cluster/auth";

/**
 * Custom RBAC Middleware
 * Wraps the official express-file-cluster requireAuth to enforce role-based access.
 *
 * @param allowedRoles - Array of roles that are allowed to access the route.
 * @returns RequestHandler
 */
export const requireRole = (...allowedRoles: string[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First run the standard auth check to ensure the user is logged in
    const authMiddleware = efcRequireAuth();

    authMiddleware(req, res, (err?: any) => {
      if (err) return next(err);

      // Extract user from the request (injected by EFC auth middleware)
      const user = (req as any).user;

      if (!user) {
        return next(new HttpError(401, "Unauthorized: No user found"));
      }

      // Check if the user's role is in the list of allowed roles
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return next(
          new HttpError(
            403,
            `Forbidden: Requires one of roles: ${allowedRoles.join(", ")}`,
          ),
        );
      }

      next();
    });
  };
};

/**
 * A more strict version that checks against the Role model dynamically
 */
export const requireDynamicRole = (permission: string): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) return next(new HttpError(401, "Unauthorized"));

      // Dynamically import the Role model to check permissions
      const { Role } = await import("../model/Role.js");
      const userRole = await Role.findOne({ name: user.role });

      if (!userRole || !userRole.permissions.includes(permission)) {
        return next(
          new HttpError(403, `Forbidden: Missing permission '${permission}'`),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
