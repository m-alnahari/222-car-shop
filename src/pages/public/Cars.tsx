import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaTiktok,
} from 'react-icons/fa'

import Public_Navbar from '../../components/public/Public_Navbar'
import { supabase } from '../../lib/supabase'
import LogoMarquee from '../../components/public/LogoMarquee'

type ShopSettings = {
  phone: string | null
  whatsapp: string | null
  email: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
}

type CarImage = {
  id: string
  image_url: string
}

type Car = {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  mileage: number | null
  color: string | null
  description: string | null
  status: 'available' | 'sold' | 'reserved'
  slug: string
  created_at: string
  car_images: CarImage[]
}

type SortOption =
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'year-new'
  | 'mileage-low'

function formatPrice(price: number | null) {
  if (price === null) {
    return 'Price on request'
  }

  return `QAR ${new Intl.NumberFormat('en-US').format(price)}`
}

function formatMileage(mileage: number | null) {
  if (mileage === null) {
    return '—'
  }

  return `${new Intl.NumberFormat('en-US').format(mileage)} KM`
}

function getWhatsAppUrl(phone: string | null) {
  if (!phone) return null

  const number = phone.replace(/\D/g, '')

  if (!number) return null

  return `https://wa.me/${number}`
}

function Cars() {
  const [shop, setShop] = useState<ShopSettings | null>(null)
  const [cars, setCars] = useState<Car[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  useEffect(() => {
    loadShop()
    fetchCars()
  }, [])

  async function loadShop() {
    const { data, error } = await supabase
      .from('shop_settings')
      .select(
        'phone, whatsapp, email, instagram, facebook, tiktok'
      )
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Shop settings error:', error)
      return
    }

    setShop(data)
  }

  async function fetchCars() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('cars')
      .select(`
        id,
        brand,
        model,
        year,
        price,
        mileage,
        color,
        description,
        status,
        slug,
        created_at,
        car_images (
          id,
          image_url
        )
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cars:', error)
      setError('Unable to load the collection.')
      setCars([])
      setLoading(false)
      return
    }

    setCars(data ?? [])
    setLoading(false)
  }

  const whatsappUrl = getWhatsAppUrl(
    shop?.whatsapp || shop?.phone || null
  )

  const brands = useMemo(() => {
    const uniqueBrands = Array.from(
      new Set(cars.map((car) => car.brand))
    )

    return uniqueBrands.sort()
  }, [cars])

  const filteredCars = useMemo(() => {
    let result = [...cars]

    const searchValue = search.trim().toLowerCase()

    if (searchValue) {
      result = result.filter((car) => {
        return (
          car.brand.toLowerCase().includes(searchValue) ||
          car.model.toLowerCase().includes(searchValue) ||
          `${car.brand} ${car.model}`
            .toLowerCase()
            .includes(searchValue) ||
          car.year?.toString().includes(searchValue)
        )
      })
    }

    if (selectedBrand !== 'all') {
      result = result.filter(
        (car) => car.brand === selectedBrand
      )
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (
            (a.price ?? Infinity) - (b.price ?? Infinity)
          )

        case 'price-high':
          return (
            (b.price ?? -Infinity) - (a.price ?? -Infinity)
          )

        case 'year-new':
          return (b.year ?? 0) - (a.year ?? 0)

        case 'mileage-low':
          return (
            (a.mileage ?? Infinity) -
            (b.mileage ?? Infinity)
          )

        case 'newest':
        default:
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
      }
    })

    return result
  }, [cars, search, selectedBrand, sortBy])

  function clearFilters() {
    setSearch('')
    setSelectedBrand('all')
    setSortBy('newest')
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Public_Navbar />

      {/* ========================================================= */}
      {/* PAGE HERO */}
      {/* ========================================================= */}

      <section className="relative flex min-h-[60vh] items-center overflow-hidden bg-[#050505] sm:min-h-[65vh] lg:min-h-[70vh]">

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-3xl sm:h-[500px] sm:w-[500px] lg:h-[700px] lg:w-[700px]" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[9rem] font-bold leading-none tracking-[-0.1em] text-white/[0.025] sm:text-[16rem] lg:text-[28rem]">
          222
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6 sm:pt-28 lg:px-10 lg:pt-32">

          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 sm:text-xs sm:tracking-[0.4em]">
            222 Car Shop
          </p>

          <h1 className="mt-5 max-w-4xl text-4xl font-light uppercase leading-[0.95] tracking-[0.05em] text-white sm:mt-6 sm:text-6xl lg:text-8xl lg:tracking-[0.08em]">
            The Collection.
          </h1>

          <div className="mt-7 h-px w-16 bg-neutral-600 sm:mt-10 sm:w-24" />

          <p className="mt-6 max-w-xl text-sm leading-7 text-neutral-500 sm:mt-8">
            Explore our current collection of carefully
            selected luxury automobiles.
          </p>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 222 MARQUEE */}
      {/* ========================================================= */}

      <div className="py-6 sm:py-8">
        <LogoMarquee />
      </div>

      {/* ========================================================= */}
      {/* COLLECTION */}
      {/* ========================================================= */}

      <section className="bg-[#050505] px-4 py-16 sm:px-6 sm:py-20 lg:px-12 lg:py-28">

        <div className="mx-auto max-w-[1400px]">

          {/* FILTERS */}

          <div className="border-b border-white/10 pb-6 sm:pb-8">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              {/* Search */}

              <div className="relative w-full lg:max-w-md">

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="SEARCH BRAND OR MODEL"
                  className="w-full border border-white/10 bg-black px-4 py-3.5 text-[10px] uppercase tracking-[0.15em] text-white outline-none placeholder:text-neutral-700 focus:border-white/30 sm:px-5 sm:py-4 sm:text-xs sm:tracking-[0.2em]"
                />

              </div>

              {/* Filters */}

              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">

                <select
                  value={selectedBrand}
                  onChange={(event) =>
                    setSelectedBrand(event.target.value)
                  }
                  className="w-full border border-white/10 bg-black px-4 py-3.5 text-[10px] uppercase tracking-[0.12em] text-neutral-400 outline-none focus:border-white/30 sm:px-5 sm:py-4 sm:text-xs sm:tracking-[0.15em]"
                >
                  <option value="all">
                    All Brands
                  </option>

                  {brands.map((brand) => (
                    <option
                      key={brand}
                      value={brand}
                    >
                      {brand}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as SortOption
                    )
                  }
                  className="w-full border border-white/10 bg-black px-4 py-3.5 text-[10px] uppercase tracking-[0.12em] text-neutral-400 outline-none focus:border-white/30 sm:px-5 sm:py-4 sm:text-xs sm:tracking-[0.15em]"
                >
                  <option value="newest">
                    Newest
                  </option>

                  <option value="price-low">
                    Price: Low to High
                  </option>

                  <option value="price-high">
                    Price: High to Low
                  </option>

                  <option value="year-new">
                    Newest Year
                  </option>

                  <option value="mileage-low">
                    Lowest Mileage
                  </option>
                </select>

              </div>

            </div>

            <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600 sm:text-[10px] sm:tracking-[0.25em]">
                {loading
                  ? 'Loading collection'
                  : `${filteredCars.length} ${
                      filteredCars.length === 1
                        ? 'vehicle'
                        : 'vehicles'
                    }`}
              </p>

              {(search ||
                selectedBrand !== 'all' ||
                sortBy !== 'newest') && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="self-start text-[9px] uppercase tracking-[0.2em] text-neutral-500 transition hover:text-white sm:self-auto sm:text-[10px] sm:tracking-[0.25em]"
                >
                  Clear Filters
                </button>
              )}

            </div>

          </div>

          {/* ===================================================== */}
          {/* LOADING */}
          {/* ===================================================== */}

          {loading && (
            <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-5 md:grid-cols-3">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[450px] animate-pulse rounded-[18px] bg-neutral-900 sm:h-[520px] sm:rounded-[22px]"
                />
              ))}

            </div>
          )}

          {/* ===================================================== */}
          {/* ERROR */}
          {/* ===================================================== */}

          {!loading && error && (
            <div className="mt-8 rounded-2xl border border-white/10 px-5 py-20 text-center sm:mt-12 sm:rounded-3xl sm:py-24">

              <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-600 sm:text-[10px] sm:tracking-[0.3em]">
                Collection Error
              </p>

              <h2 className="mt-4 text-xl font-light uppercase tracking-[0.05em] sm:text-2xl sm:tracking-[0.08em]">
                Unable to load vehicles
              </h2>

              <p className="mt-4 text-sm text-neutral-600">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchCars}
                className="mt-7 border border-white/20 px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black sm:mt-8 sm:px-7 sm:py-4 sm:text-xs sm:tracking-[0.25em]"
              >
                Try Again
              </button>

            </div>
          )}

          {/* ===================================================== */}
          {/* EMPTY */}
          {/* ===================================================== */}

          {!loading &&
            !error &&
            filteredCars.length === 0 && (
              <div className="mt-8 rounded-2xl border border-white/10 px-5 py-20 text-center sm:mt-12 sm:rounded-3xl sm:py-24">

                <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-600 sm:text-[10px] sm:tracking-[0.3em]">
                  No Results
                </p>

                <h2 className="mt-4 text-xl font-light uppercase tracking-[0.05em] sm:text-2xl sm:tracking-[0.08em]">
                  No vehicles found
                </h2>

                <p className="mt-4 text-sm text-neutral-600">
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-7 border border-white/20 px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black sm:mt-8 sm:px-7 sm:py-4 sm:text-xs sm:tracking-[0.25em]"
                >
                  Clear Filters
                </button>

              </div>
            )}

          {/* ===================================================== */}
          {/* CAR GRID */}
          {/* ===================================================== */}

          {!loading &&
            !error &&
            filteredCars.length > 0 && (
              <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-5 md:grid-cols-3">

                {filteredCars.map((car, index) => {

                  const image =
                    car.car_images?.[0]?.image_url

                  return (
                    <article
                      key={car.id}
                      className="group relative overflow-hidden rounded-[18px] border border-white/15 bg-[#0a0a0a] sm:rounded-[22px]"
                    >

                      {/* IMAGE */}

                      <div className="relative h-[270px] overflow-hidden sm:h-[330px]">

                        {image && (
                          <img
                            src={image}
                            alt=""
                            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
                          />
                        )}

                        {image ? (
                          <img
                            src={image}
                            alt={`${car.brand} ${car.model}`}
                            className="relative z-10 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="relative z-10 flex h-full items-center justify-center text-[9px] uppercase tracking-[0.25em] text-neutral-700 sm:text-[10px] sm:tracking-[0.3em]">
                            No image
                          </div>
                        )}

                        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-transparent to-black/10" />

                        {car.status === 'available' &&
                          index === 0 && (
                            <div className="absolute left-3 top-3 z-30 rounded-lg border border-white/40 bg-white/15 px-3 py-1.5 text-[9px] font-medium tracking-[0.12em] backdrop-blur-md sm:left-4 sm:top-4 sm:rounded-xl sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.15em]">
                              NEW
                            </div>
                          )}

                        <div className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/40 text-lg backdrop-blur-md transition hover:bg-white hover:text-black sm:right-4 sm:top-4 sm:h-10 sm:w-10 sm:text-xl">
                          ♡
                        </div>

                      </div>

                      {/* DETAILS */}

                      <div className="relative z-30 bg-[#090909] px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">

                        <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 sm:text-[10px] sm:tracking-[0.25em]">
                          {car.brand}
                        </p>

                        <h3 className="mt-1 truncate text-xl font-medium tracking-tight sm:text-2xl">
                          {car.model}
                        </h3>

                        <div className="mt-5 grid grid-cols-3 border-y border-white/10 py-3.5 sm:mt-6 sm:py-4">

                          <div className="min-w-0 border-r border-white/10 pr-2">

                            <p className="text-[7px] uppercase tracking-[0.1em] text-neutral-600 sm:text-[8px] sm:tracking-[0.15em]">
                              Price
                            </p>

                            <p className="mt-2 truncate text-[10px] font-medium sm:text-xs">
                              {formatPrice(car.price)}
                            </p>

                          </div>

                          <div className="min-w-0 border-r border-white/10 px-2">

                            <p className="text-[7px] uppercase tracking-[0.1em] text-neutral-600 sm:text-[8px] sm:tracking-[0.15em]">
                              Kilometres
                            </p>

                            <p className="mt-2 truncate text-[10px] font-medium sm:text-xs">
                              {formatMileage(car.mileage)}
                            </p>

                          </div>

                          <div className="min-w-0 pl-2">

                            <p className="text-[7px] uppercase tracking-[0.1em] text-neutral-600 sm:text-[8px] sm:tracking-[0.15em]">
                              Year
                            </p>

                            <p className="mt-2 text-[10px] font-medium sm:text-xs">
                              {car.year || '—'}
                            </p>

                          </div>

                        </div>

                        <Link
                          to={`/cars/${car.slug}`}
                          className="mt-4 flex items-center justify-between rounded-xl border border-white/20 bg-gradient-to-b from-white/20 to-white/5 px-4 py-3 text-[10px] transition duration-300 hover:border-white hover:bg-white hover:text-black sm:mt-5 sm:px-5 sm:py-3 sm:text-xs"
                        >
                          <span>View Details</span>

                          <span className="text-base transition-transform duration-300 group-hover:translate-x-1 sm:text-lg">
                            →
                          </span>
                        </Link>

                      </div>

                    </article>
                  )
                })}

              </div>
            )}

        </div>
      </section>

      {/* ========================================================= */}
      {/* MARQUEE */}
      {/* ========================================================= */}

      <div className="py-6 sm:py-8">
        <LogoMarquee />
      </div>

      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

      <footer className="bg-[#050505] px-4 pb-6 pt-12 sm:px-6 sm:pb-8 sm:pt-16 lg:px-12">

        <div className="mx-auto max-w-[1500px]">

          <div className="grid gap-10 border-b border-white/10 pb-10 sm:gap-12 sm:pb-12 md:grid-cols-2 lg:grid-cols-4">

            {/* BRAND */}

            <div className="lg:col-span-2">

              <p className="text-4xl font-light tracking-[-0.06em] sm:text-5xl">
                222
              </p>

              <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
                A curated collection of exceptional automobiles,
                selected for those who appreciate performance,
                design, and individuality.
              </p>

              {/* SOCIAL */}

              <div className="mt-6 flex gap-3 sm:mt-7">

                {shop?.instagram && (
                  <a
                    href={shop.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-400 transition duration-300 hover:border-white hover:bg-white hover:text-black"
                  >
                    <FaInstagram size={16} />
                  </a>
                )}

                {shop?.tiktok && (
                  <a
                    href={shop.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-400 transition duration-300 hover:border-white hover:bg-white hover:text-black"
                  >
                    <FaTiktok size={16} />
                  </a>
                )}

                {shop?.facebook && (
                  <a
                    href={shop.facebook}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-400 transition duration-300 hover:border-white hover:bg-white hover:text-black"
                  >
                    <FaFacebook size={16} />
                  </a>
                )}

                {shop?.whatsapp && whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-400 transition duration-300 hover:border-white hover:bg-white hover:text-black"
                  >
                    <FaWhatsapp size={16} />
                  </a>
                )}

              </div>

            </div>

            {/* EXPLORE */}

            <div>

              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                Explore
              </p>

              <div className="mt-5 flex flex-col gap-3">

                <Link
                  to="/"
                  className="w-fit text-sm text-neutral-400 transition hover:text-white"
                >
                  Home
                </Link>

                <a
                  href="/#cars"
                  className="w-fit text-sm text-neutral-400 transition hover:text-white"
                >
                  Collection
                </a>

                <a
                  href="/#about"
                  className="w-fit text-sm text-neutral-400 transition hover:text-white"
                >
                  Showroom
                </a>

                <Link
                  to="/cars"
                  className="w-fit text-sm text-neutral-400 transition hover:text-white"
                >
                  All Cars
                </Link>

              </div>

            </div>

            {/* CONTACT */}

            <div>

              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                Contact
              </p>

              <div className="mt-5 space-y-4">

                {shop?.phone && (
                  <a
                    href={`tel:${shop.phone}`}
                    className="block text-sm text-neutral-400 transition hover:text-white"
                  >
                    {shop.phone}
                  </a>
                )}

                {shop?.email && (
                  <a
                    href={`mailto:${shop.email}`}
                    className="block break-all text-sm text-neutral-400 transition hover:text-white"
                  >
                    {shop.email}
                  </a>
                )}

              </div>

            </div>

          </div>

          {/* BOTTOM */}

          <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-7">

            <p className="text-[8px] uppercase tracking-[0.2em] text-neutral-700 sm:text-[9px] sm:tracking-[0.25em]">
              © {new Date().getFullYear()} 222 Luxury Automotive
            </p>

            <div className="flex flex-wrap gap-4 sm:gap-6">

              <span className="text-[8px] uppercase tracking-[0.15em] text-neutral-700 sm:text-[9px] sm:tracking-[0.2em]">
                Doha, Qatar
              </span>

              <span className="text-[8px] uppercase tracking-[0.15em] text-neutral-700 sm:text-[9px] sm:tracking-[0.2em]">
                All Rights Reserved
              </span>

            </div>

          </div>

        </div>

      </footer>

    </main>
  )
}

export default Cars