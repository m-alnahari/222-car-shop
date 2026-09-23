import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          Loading...
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute