import "dotenv/config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mlRoutes from "./routes/ml.js";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ ok: true, service: "node-api" }));

// 👇 This line MUST exist (and path/case must be correct)
app.use("/api", mlRoutes);

app.listen(PORT, () => {
  console.log(`Node API on http://localhost:${PORT}`);
});
