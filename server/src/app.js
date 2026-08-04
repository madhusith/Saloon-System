import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import apiRoutes from './routes/index.js';

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.nodeEnv === 'development' ? 10000 : 100, // Increase limit in development mode
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    errors: []
  }
});


app.use(helmet());
const allowedOrigins = [env.clientUrl];
const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  const isAllowed = allowedOrigins.includes(origin) ||
    (env.nodeEnv === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin));
  
  if (isAllowed) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter, apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;

