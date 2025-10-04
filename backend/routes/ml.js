import express from 'express';
import { callFastAPI } from '../services/pythonClient.js';

const router = express.Router();

// Example: call prediction endpoint in FastAPI
router.post('/predict', async (req, res) => {
  try {
    const result = await callFastAPI('/predict', req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get prediction from FastAPI' });
  }
});

export default router;
