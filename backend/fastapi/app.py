from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
from utils.ml import predict_grade

app = FastAPI(
    title="Student ML Service",
    version="1.0.0",
    description="Provides ML predictions and analytics for Student Analysis"
)

# Allow your React/Express during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:4000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    # Redirect root to Swagger UI
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"ok": True}

class PredictReq(BaseModel):
    features: Dict[str, Any]
    passMark: Optional[float] = 40

@app.post("/predict")
def predict(req: PredictReq):
    return predict_grade(req.features, req.passMark)
