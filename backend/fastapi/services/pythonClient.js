// backend/services/pythonClient.js
import axios from 'axios';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

export async function callFastAPI(endpoint, payload = {}) {
  try {
    const res = await axios.post(`${FASTAPI_URL}${endpoint}`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  } catch (err) {
    console.error('Error calling FastAPI:', err.message);
    throw err;
  }
}
