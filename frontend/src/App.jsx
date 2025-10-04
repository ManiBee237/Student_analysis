import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Overview from './pages/Overview.jsx'                 // ← add this
import Prediction from './components/tabs/Prediction.jsx'
import Classification from './components/tabs/Classification.jsx'
import Clustering from './components/tabs/Clustering.jsx'
import Insights from './components/tabs/Insights.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './components/tabs/Upload.jsx'           // ensure case matches
import Settings from './components/tabs/settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        {/* Make Overview the landing tab (optional) */}
        <Route index element={<Navigate to="overview" replace />} />

        {/* ADD THIS ROUTE */}
        <Route path="overview" element={<Overview />} />

        <Route path="prediction" element={<Prediction />} />
        <Route path="classification" element={<Classification />} />
        <Route path="clustering" element={<Clustering />} />
        <Route path="insights" element={<Insights />} />
        <Route path='settings' element={<Settings />} />
        <Route path="upload" element={<Upload />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
