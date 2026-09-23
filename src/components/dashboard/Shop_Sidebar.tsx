import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Shop_Sidebar() {
  const { logout, profile } = useAuth()
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-4 py-3 transition ${
      isActive
        ? 'bg-white text-black'
        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
    }`

  async function handleLogout() {
    await logout()
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-neutral-900 text-white shadow-lg md:hidden"
        aria-label="Open menu"
      >
        <div className="space-y-1.5">
          <span className="block h-0.5 w-5 bg-white" />
          <span className="block h-0.5 w-5 bg-white" />
          <span className="block h-0.5 w-5 bg-white" />
        </div>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 border-r border-neutral-800
          bg-neutral-900 p-6 text-white
          transition-transform duration-300
          md:relative md:z-auto md:w-64
          md:translate-x-0
          ${
            isOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }
        `}
      >
        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <span className="text-2xl leading-none">×</span>
        </button>

        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-widest">
            222
          </h1>

          <p className="mt-1 text-sm text-neutral-400">
            Luxury Car Shop
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavLink
            to="/dashboard"
            end
            className={linkClass}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/dashboard/cars"
            end
            className={linkClass}
          >
            Cars
          </NavLink>

          <NavLink
            to="/dashboard/cars/add"
            end
            className={linkClass}
          >
            Add Car
          </NavLink>

          {/* Admin only */}
          {profile?.role === 'admin' && (
            <NavLink
              to="/dashboard/settings"
              end
              className={linkClass}
            >
              Settings
            </NavLink>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded-lg px-4 py-3 text-left text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            Logout
          </button>
        </nav>
      </aside>
    </>
  )
}

export default Shop_Sidebar