import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'

import ProtectedRoute from './components/auth/ProtectedRoute'

import Shop_Sidebar from './components/dashboard/Shop_Sidebar'
import Shop_Navbar from './components/dashboard/Shop_Navbar'

import Home from './pages/public/Home'
import PublicCars from './pages/public/Cars'
import CarDetails from './pages/public/CarDetails'

import Login from './pages/auth/Login'

import Dashboard from './pages/dashboard/Dashboard'
import DashboardCars from './pages/dashboard/Cars'
import AddCar from './pages/dashboard/AddCar'
import CarDetailsDashboard from './pages/dashboard/CarDetails'
import EditCar from './pages/dashboard/EditCar'
import Settings from './pages/dashboard/Settings'

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-950">
      <Shop_Sidebar />

      <div className="flex-1">
        <Shop_Navbar />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cars" element={<DashboardCars />} />
          <Route path="/cars/add" element={<AddCar />} />
          <Route path="/cars/:id" element={<CarDetailsDashboard />} />
          <Route path="/cars/:id/edit" element={<EditCar />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<PublicCars />} />
          <Route path="/cars/:slug" element={<CarDetails />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED DASHBOARD */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/*" element={<DashboardLayout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App