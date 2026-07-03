import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Disable 2FA for the authenticated user.',
      request: { body: { code: '123456' } },
      response: { status: 200, body: { message: '2FA disabled' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const POST = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  // TODO: verify code and disable 2FA
  res.json({ message: '2FA disabled' });
};
