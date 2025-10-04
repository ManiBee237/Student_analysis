import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Prediction from './components/tabs/Prediction.jsx'
import Classification from './components/tabs/Classification.jsx'
import Clustering from './components/tabs/Clustering.jsx'
import Insights from './components/tabs/Insights.jsx'
import Dashboard from './pages/dashboard.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<Navigate to="prediction" replace />} />
        <Route path="/prediction" element={<Prediction />} />
        <Route path="/classification" element={<Classification />} />
        <Route path="/clustering" element={<Clustering />} />
        <Route path="/insights" element={<Insights />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
