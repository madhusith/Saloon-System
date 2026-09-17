import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import apiRoutes from './routes/index.js';

const app = express();
app.set('trust proxy', 1);

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


app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
const allowedOrigins = [env.clientUrl];
const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  const isAllowed = allowedOrigins.includes(origin) ||
    /\.vercel\.app$/.test(new URL(origin).hostname) ||
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
app.use('/uploads', express.static('uploads'));

import fs from 'fs';

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/debug-tables', async (_req, res) => {
  try {
    const [tables] = await pool.query("SHOW TABLES");
    res.json({ tables: tables.map(t => Object.values(t)[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/run-setup', async (_req, res) => {
  try {
    const sqlUrl = new URL('./database/production_setup.sql', import.meta.url);
    const sqlContent = fs.readFileSync(sqlUrl, 'utf8');
    const statements = sqlContent
      .replace(/--.*$/gm, '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const results = [];
    for (const statement of statements) {
      try {
        await pool.query(statement);
        results.push({ success: true, preview: statement.slice(0, 35) });
      } catch (stmtErr) {
        results.push({ success: false, preview: statement.slice(0, 35), error: stmtErr.message });
      }
    }
    res.json({ status: 'done', executedCount: statements.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api', apiLimiter, apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;

