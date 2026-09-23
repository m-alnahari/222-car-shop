import { Link } from 'react-router-dom'

function Public_Navbar() {
  const navClass =
    'text-sm uppercase tracking-[0.18em] text-neutral-500 transition duration-300 hover:text-white'

  return (
    <header className="fixed left-0 top-0 z-50 w-full">
      <div className="mx-auto flex h-24 max-w-[1400px] items-center justify-center px-6 lg:px-10">

        <nav className="flex items-center gap-10">

          <Link
            to="/"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              })
            }
            className={navClass}
          >
            Home
          </Link>

          <a
            href="/#cars"
            className={navClass}
          >
            Cars
          </a>

          <a
            href="/#about"
            className={navClass}
          >
            About
          </a>

        </nav>

      </div>
    </header>
  )
}

export default Public_Navbar