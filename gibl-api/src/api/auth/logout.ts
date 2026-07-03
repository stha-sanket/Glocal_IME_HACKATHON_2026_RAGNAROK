import type { Request, Response } from 'express';
import { revokeToken } from 'express-file-cluster/auth';

export const POST = async (req: Request, res: Response) => {
  revokeToken(res);
  return res.json({ message: 'Logged out successfully.' });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Logs the current user out by clearing their session cookie. Always succeeds, even if the session was already expired.',
    response: { status: 200, body: { message: '' } }
  }
};
