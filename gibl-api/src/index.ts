import { ignite, gracefulShutdown } from "express-file-cluster";

// PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGINS are read from .env automatically
ignite({
  cluster: true,
  workers: 1,
  tasks: { backend: "bullmq" },
})
  .then(gracefulShutdown)
  .catch(console.error);
