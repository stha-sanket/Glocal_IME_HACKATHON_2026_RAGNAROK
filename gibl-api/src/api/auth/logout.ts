import { revokeToken } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Clear the auth cookie and log the user out.',
    response: { status: 200, body: { message: 'Logged out successfully' } },
  },
};

export const POST = async (_req: Request, res: Response) => {
  revokeToken(res);
  res.clearCookie('efc_refresh_token');
  res.json({ message: 'Logged out successfully' });
};
