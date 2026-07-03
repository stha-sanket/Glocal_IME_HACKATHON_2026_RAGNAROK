import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Get account settings (notifications, language, theme, privacy) for the authenticated user.',
      response: { status: 200, body: { settings: { notifications: true, language: 'en', theme: 'system', privacy: 'public' } } },
  },
  PUT: {
    description: 'Update account settings for the authenticated user.',
      request: { body: { notifications: true, language: 'en', theme: 'system', privacy: 'public' } },
      response: { status: 200, body: { message: 'Settings updated', settings: { notifications: true, language: 'en', theme: 'system', privacy: 'public' } } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch user settings from DB
  res.json({ settings: { notifications: true, language: 'en', theme: 'system', privacy: 'public' } });
};

export const PUT = async (req: Request, res: Response) => {
  const { notifications, language, theme, privacy } = req.body;
  // TODO: update user settings in DB
  res.json({ message: 'Settings updated', settings: { notifications, language, theme, privacy } });
};
