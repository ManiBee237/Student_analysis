import axios from "axios";

const BASE = process.env.PY_SERVICE_URL || "http://localhost:5001";

export const python = {
  predict:  (rows) => axios.post(`${BASE}/predict`,  { rows }).then(r => r.data),
  classify: (rows) => axios.post(`${BASE}/classify`, { rows }).then(r => r.data),
  cluster:  (rows) => axios.post(`${BASE}/cluster`,  { rows }).then(r => r.data),
};
