import { defineModel } from 'express-file-cluster';

export interface FileDocument {
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  isPublic: boolean;
}

export const File = defineModel<FileDocument>('File', {
  userId:       { type: 'string',  required: true },
  filename:     { type: 'string',  required: true },
  originalName: { type: 'string',  required: true },
  mimeType:     { type: 'string',  required: true },
  size:         { type: 'number',  required: true },
  url:          { type: 'string',  required: true },
  isPublic:     { type: 'boolean', default: false },
});
