import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Generate a TOTP secret and QR code to set up 2FA.',
      response: { status: 200, body: { qrCode: 'otpauth://totp/...', secret: 'BASE32SECRET' } },
  },
  POST: {
    description: 'Confirm a TOTP code to enable 2FA for the authenticated user.',
      request: { body: { code: '123456' } },
      response: { status: 200, body: { message: '2FA enabled' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: generate TOTP secret and return QR code URL
  res.json({ qrCode: 'otpauth://totp/...', secret: 'BASE32SECRET' });
};

export const POST = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  // TODO: verify TOTP code and enable 2FA
  res.json({ message: '2FA enabled' });
};
