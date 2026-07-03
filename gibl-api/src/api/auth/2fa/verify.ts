import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Verify a TOTP code during login.',
      request: { body: { code: '123456' } },
      response: { status: 200, body: { message: '2FA verified' } },
  },
};

export const POST = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  // TODO: verify TOTP code
  res.json({ message: '2FA verified' });
};
