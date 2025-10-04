def predict_grade(features: dict, pass_mark: float = 40):
    """
    Basic heuristic prediction for demo.
    Replace with actual ML pipeline (scikit-learn, tensorflow, etc.)
    """
    attendance = float(features.get("attendancePct") or (features.get("attendance", 0) * 100) or 0.0)
    hours = float(features.get("hours") or features.get("studyHours") or 0.0)
    prev = float(features.get("previousGrade") or features.get("prev") or 0.0)
    activities = float(features.get("extracurricularCount") or features.get("activities") or 0.0)
    parent = features.get("parentalSupport") or features.get("parent") or "Medium"
    online = 1.0 if features.get("online") else 0.0

    # Encode parental support
    pmap = {"Low": 0, "Medium": 1, "High": 2}
    p = float(pmap.get(str(parent), 1))

    # Simple weighted model
    pred = 0.5 * prev + 0.25 * attendance + 0.2 * hours + 2 * activities + 3 * p + 2 * online

    # Probability of passing
    pass_prob = max(0.0, min(1.0, (pred - (pass_mark - 15)) / 30.0))

    # Risk classification
    risk = "Low" if pred >= pass_mark + 10 else ("Medium" if pred >= pass_mark - 5 else "High")

    return {"predicted": round(pred, 1), "passProb": round(pass_prob, 3), "risk": risk}
