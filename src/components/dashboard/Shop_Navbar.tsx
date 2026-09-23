import { useAuth } from '../../context/AuthContext'

function Navbar() {
  const { profile } = useAuth()

  return (
    <header className="flex h-20 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 text-white sm:px-6 md:px-8">
      <div className="ml-14 md:ml-0">
        <h2 className="text-lg font-semibold sm:text-xl">
          Overview
        </h2>

        <p className="hidden text-xs text-neutral-500 sm:block">
          Manage your luxury car shop
        </p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <span className="text-xs uppercase tracking-wider text-neutral-400 sm:text-sm">
          {profile?.role ?? 'User'}
        </span>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm sm:h-10 sm:w-10">
          {profile?.full_name
            ? profile.full_name.charAt(0).toUpperCase()
            : profile?.role === 'admin'
              ? 'A'
              : 'S'}
        </div>
      </div>
    </header>
  )
}

export default Navbar