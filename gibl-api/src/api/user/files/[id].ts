import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Get a download/preview URL for a single file by ID.',
      request: { params: { id: 'file_01HXZ' } },
      response: { status: 200, body: { file: { id: 'file_01HXZ', url: 'https://example.com/files/file_01HXZ' } } },
  },
  DELETE: {
    description: 'Delete a file from storage.',
      request: { params: { id: 'file_01HXZ' } },
      response: { status: 200, body: { message: 'File file_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: stream or redirect to file download/preview URL
  res.json({ file: { id, url: 'https://...' } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete file from storage and DB
  res.json({ message: `File ${id} deleted` });
};
