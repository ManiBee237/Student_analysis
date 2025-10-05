// server.js (Node/Express on 5050)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import axios from "axios";
import "dotenv/config";

const app = express();

// --- config ---
const PORT = process.env.PORT || 5050;
const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000"; // ensure this matches uvicorn

// --- middleware ---
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// --- health ---
app.get("/", (_req, res) => {
  res.json({ status: "ok", gateway: "node-5050", upstream: FASTAPI_URL });
});

// --- proxy routes ---
// NOTE: We rewrite '/api/predict' -> '/predict' for FastAPI
app.post("/api/predict", async (req, res) => {
  try {
    const { data } = await axios.post(`${FASTAPI_URL}/predict`, req.body, {
      timeout: 10000, // 10s
      headers: { "Content-Type": "application/json" },
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    const detail = err.response?.data || err.message || "Upstream error";
    console.error("Proxy /api/predict error:", detail);
    res.status(502).json({ error: "Bad Gateway", detail });
  }
});

app.post("/api/classify", async (req, res) => {
  try {
    const { data } = await axios.post(`${FASTAPI_URL}/classify`, req.body, {
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    const detail = err.response?.data || err.message || "Upstream error";
    console.error("Proxy /api/classify error:", detail);
    res.status(502).json({ error: "Bad Gateway", detail });
  }
});

app.post("/api/cluster", async (req, res) => {
  try {
    const { data } = await axios.post(`${FASTAPI_URL}/cluster`, req.body, {
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    const detail = err.response?.data || err.message || "Upstream error";
    console.error("Proxy /api/cluster error:", detail);
    res.status(502).json({ error: "Bad Gateway", detail });
  }
});

app.listen(PORT, () => {
  console.log(`Gateway listening http://localhost:${PORT} → upstream ${FASTAPI_URL}`);
});
