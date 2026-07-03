import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Change password for the authenticated user.',
      request: { body: { oldPassword: 'current', newPassword: 'newpassword' } },
      response: { status: 200, body: { message: 'Password changed successfully' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const POST = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'oldPassword and newPassword are required' });
  // TODO: verify old password, hash and update new password
  res.json({ message: 'Password changed successfully' });
};
