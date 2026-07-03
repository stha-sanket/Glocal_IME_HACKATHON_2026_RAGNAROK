import type { EFCConfig } from 'express-file-cluster';

// Structural config only — runtime values (PORT, DATABASE_URL, JWT_SECRET, etc.) are read from .env
const config: EFCConfig = {
  authStrategy: 'localStorage',
  tasks: { backend: 'bullmq', concurrency: 5 },
  globalMiddlewares: [],
};

export default config;
