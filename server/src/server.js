import http from 'http';
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { initSocket } from './sockets/socket.js';

// Initialize and validate configurations
validateEnv();

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, env.clientUrl);

server.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing server.`);
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

