from pydantic import BaseModel
from typing import Dict, Any, Optional

class PredictReq(BaseModel):
    features: Dict[str, Any]
    passMark: Optional[float] = 40

class PredictResp(BaseModel):
    predicted: float
    passProb: float
    risk: str
