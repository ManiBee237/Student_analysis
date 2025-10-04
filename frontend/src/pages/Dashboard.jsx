// src/pages/Dashboard.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import LeftTabs from '../layouts/LeftTabs' // path per your structure

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-[#0b1220] text-[#e9f0ff]">
      <LeftTabs />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
