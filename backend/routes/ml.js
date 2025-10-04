import { Router } from "express";
import { python } from "../services/pythonClient.js";

const r = Router();

r.get("/health", (_req, res) => res.json({ ok: true }));

const requireRows = (req, res, next) => {
  if (!Array.isArray(req.body?.rows) || req.body.rows.length === 0) {
    return res.status(400).json({ success: false, message: "rows[] required" });
  }
  next();
};

r.post("/predict", requireRows, async (req, res) => {
  try {
    const data = await python.predict(req.body.rows);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(502).json({ success: false, message: "ML service error", error: e.message });
  }
});

r.post("/classify", requireRows, async (req, res) => {
  try {
    const data = await python.classify(req.body.rows);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(502).json({ success: false, message: "ML service error", error: e.message });
  }
});

r.post("/cluster", requireRows, async (req, res) => {
  try {
    const data = await python.cluster(req.body.rows);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(502).json({ success: false, message: "ML service error", error: e.message });
  }
});

export default r;
