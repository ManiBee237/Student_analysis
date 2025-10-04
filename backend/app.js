import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import mlRoutes from './routes/ml.js';

dotenv.config();

const app = express();
app.use(cors({ origin: ['http://127.0.0.1:5173','http://localhost:5173'] }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/ml', mlRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Express running on http://127.0.0.1:${port}`));
