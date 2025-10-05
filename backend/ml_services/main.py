# backend/ml_services/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
from sklearn.cluster import KMeans

app = FastAPI(title="Student ML Service")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Root ----------
@app.get("/")
def root():
    return {"status": "ok", "service": "student-ml"}

# ---------- Schemas ----------
class StudentIn(BaseModel):
    id: str
    name: str
    attendance: float = Field(ge=0, le=1)
    hours: float
    prev: float
    final: Optional[float] = None
    parent: Optional[str] = "Medium"
    online: Optional[bool] = False
    activities: Optional[float] = None

class PredictRequest(BaseModel):
    rows: List[StudentIn]

class PredictOut(BaseModel):
    id: str
    name: str
    predicted_final: float
    risk: str

class PredictResponse(BaseModel):
    results: List[PredictOut]

class ClassifyOut(BaseModel):
    id: str
    name: str
    label: str
    reasons: List[str]

class ClassifyResponse(BaseModel):
    results: List[ClassifyOut]

class ClusterOut(BaseModel):
    id: str
    name: str
    cluster: int

class ClusterResponse(BaseModel):
    k: int
    centers: List[List[float]]
    results: List[ClusterOut]

# ---------- Logic ----------
def predict_final(row: StudentIn) -> float:
    # toy regression-ish formula; replace with trained model later
    base = 0.40 * row.prev + 0.45 * (row.attendance * 100) + 0.15 * row.hours * 2
    adj = 3 if row.online else 0
    return float(max(0, min(100, base + adj)))

def risk_band(score: float) -> str:
    if score >= 75:
        return "Low"
    if score >= 50:
        return "Medium"
    return "High"

def label_student(row: StudentIn) -> (str, list):
    reasons = []
    if row.attendance < 0.6:
        reasons.append("Low attendance")
    if row.hours < 5:
        reasons.append("Low study hours")
    if row.prev < 50:
        reasons.append("Weak prior grade")
    label = "At Risk" if reasons else "On Track"
    return label, reasons

# ---------- Routes ----------
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    out = []
    for r in req.rows:
        pred = predict_final(r)
        out.append(PredictOut(
            id=r.id, name=r.name,
            predicted_final=round(pred, 2),
            risk=risk_band(pred)
        ))
    return PredictResponse(results=out)

@app.post("/classify", response_model=ClassifyResponse)
def classify(req: PredictRequest):
    out = []
    for r in req.rows:
        label, reasons = label_student(r)
        out.append(ClassifyOut(id=r.id, name=r.name, label=label, reasons=reasons))
    return ClassifyResponse(results=out)

@app.post("/cluster", response_model=ClusterResponse)
def cluster(req: PredictRequest):
    X = np.array([[r.attendance * 100, r.hours, r.prev] for r in req.rows])
    k = 3 if len(req.rows) >= 3 else max(1, len(req.rows))
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    centers = kmeans.cluster_centers_.tolist()
    labels = kmeans.labels_.tolist()
    results = [ClusterOut(id=r.id, name=r.name, cluster=int(c)) for r, c in zip(req.rows, labels)]
    return ClusterResponse(k=k, centers=centers, results=results)
