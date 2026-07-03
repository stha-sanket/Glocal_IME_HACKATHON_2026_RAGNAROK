import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Get system-wide settings (admin only).',
      response: { status: 200, body: { settings: {} } },
  },
  PUT: {
    description: 'Update system-wide settings (admin only).',
      request: { body: { maintenanceMode: false } },
      response: { status: 200, body: { message: 'Settings updated', settings: { maintenanceMode: false } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch system settings from DB
  res.json({ settings: {} });
};

export const PUT = async (req: Request, res: Response) => {
  // TODO: update system settings
  res.json({ message: 'Settings updated', settings: req.body });
};
