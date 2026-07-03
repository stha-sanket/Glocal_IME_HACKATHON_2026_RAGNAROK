import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List uploaded files with storage usage for the authenticated user.',
      response: { status: 200, body: { files: [], total: 0, storageUsed: 0 } },
  },
  POST: {
    description: 'Upload a new file for the authenticated user.',
      response: { status: 201, body: { message: 'File uploaded', file: { id: 'new-id' } } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch user files and compute storage usage
  res.json({ files: [], total: 0, storageUsed: 0 });
};

export const POST = async (req: Request, res: Response) => {
  // TODO: handle multipart upload, persist file record
  res.status(201).json({ message: 'File uploaded', file: { id: 'new-id' } });
};
