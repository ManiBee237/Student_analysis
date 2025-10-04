// Simple, explainable demo predictor (replace with API later)
export function predictGrade({ attendancePct, studyHours, previousGrade, extracurricularCount, parentalSupport, online }) {
  const parentScore = parentalSupport === 'High' ? 10 : parentalSupport === 'Medium' ? 5 : 0
  const onlineBoost = online ? 2 : 0

  const attendanceTerm = Math.min(100, Math.max(0, attendancePct)) * 0.25
  const hoursTerm = Math.min(40, Math.max(0, studyHours)) * 0.6
  const prevTerm = Math.min(100, Math.max(0, previousGrade)) * 0.5
  const extraTerm = Math.min(5, Math.max(0, extracurricularCount)) * 1.2
  const score = Math.max(0, Math.min(100, attendanceTerm + hoursTerm + prevTerm + extraTerm + parentScore + onlineBoost))

  const passProb = Math.min(0.99, Math.max(0.01, (score/100)*0.85 + (previousGrade/100)*0.15))
  const risk = score < 40 ? 'High' : score < 50 ? 'Medium' : 'Low'

  return { predicted: Math.round(score), passProb, risk }
}
