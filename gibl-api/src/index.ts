import { ignite, gracefulShutdown } from 'express-file-cluster';

// PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGINS are read from .env automatically
ignite({
  cluster: true,
  tasks: { backend: 'bullmq' },
}).then(gracefulShutdown).catch(console.error);
