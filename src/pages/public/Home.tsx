import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  FaPhone,
  FaClock,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaTiktok,
} from 'react-icons/fa'

import Public_Navbar from '../../components/public/Public_Navbar'
import CarModel from '../../components/public/CarModel'
import { supabase } from '../../lib/supabase'
import LogoMarquee from '../../components/public/LogoMarquee'

type OpeningHours = {
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string
}

type ShopSettings = {
  shop_name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  google_maps_embed: string | null
  opening_hours: OpeningHours | null
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
  status: 'available' | 'sold' | 'reserved'
  slug: string
  car_images: CarImage[]
}

const defaultHours: OpeningHours = {
  monday: '10 AM–8 PM',
  tuesday: '10 AM–8 PM',
  wednesday: '10 AM–8 PM',
  thursday: '10 AM–8 PM',
  friday: '4 PM–8 PM',
  saturday: '10 AM–8 PM',
  sunday: 'Closed',
}

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

function Home() {
  const [shop, setShop] = useState<ShopSettings | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [loadingCars, setLoadingCars] = useState(true)

  useEffect(() => {
    loadShop()
    loadCars()
  }, [])

  async function loadShop() {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Shop settings error:', error)
      return
    }

    setShop(data)
  }

  async function loadCars() {
    setLoadingCars(true)

    const { data, error } = await supabase
      .from('cars')
      .select(`
        id,
        brand,
        model,
        year,
        price,
        mileage,
        status,
        slug,
        car_images (
          id,
          image_url
        )
      `)
      .order('created_at', {
        ascending: false,
      })
      .limit(3)

    if (error) {
      console.error('Cars error:', error)
      setLoadingCars(false)
      return
    }

    setCars((data as Car[]) || [])
    setLoadingCars(false)
  }

  const hours = shop?.opening_hours || defaultHours

  const whatsappUrl = getWhatsAppUrl(
    shop?.whatsapp || shop?.phone || null
  )

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      <Public_Navbar />

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section
        id="home"
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/hero-bg.png')",
          }}
        />

        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#050505] to-transparent sm:h-56" />

        {/* 3D LOGO */}
        <div className="relative z-10 flex h-screen w-full items-center justify-center overflow-hidden">
          <div className="
            translate-x-28 translate-y-8 scale-[0.55]
            sm:translate-x-30 sm:translate-y-20 sm:scale-[0.75]
            md:translate-x-30 md:translate-y-20 md:scale-[0.65]
            lg:translate-x-30 lg:translate-y-20 lg:scale-[0.6]
            xl:translate-x-25 xl:translate-y-15 xl:scale-[0.7]
          ">
            <CarModel />
          </div>
        </div>
        {/* HERO BOTTOM TEXT */}
        <div className="absolute bottom-7 left-0 right-0 z-20 px-4 sm:bottom-10 sm:px-6">
          <div className="mx-auto flex max-w-[1500px] items-end justify-between">

            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/50 sm:text-[10px] sm:tracking-[0.4em]">
                Luxury Automotive
              </p>

              <p className="mt-1.5 text-xs text-white/60 sm:mt-2 sm:text-sm">
                Doha, Qatar
              </p>
            </div>

            <a
              href="#cars"
              className="hidden text-[10px] uppercase tracking-[0.35em] text-white/50 transition hover:text-white sm:block"
            >
              Scroll to collection ↓
            </a>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CARS */}
      {/* ========================================================= */}

      <section
        id="cars"
        className="scroll-mt-24 bg-[#050505] px-4 py-16 sm:px-6 sm:py-20 lg:px-12 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px]">

          <div className="mb-8 flex flex-col justify-between gap-6 sm:mb-12 md:flex-row md:items-end">

            <div>
              <p className="mb-3 text-[9px] uppercase tracking-[0.3em] text-neutral-600 sm:text-[10px] sm:tracking-[0.35em]">
                Our Collection
              </p>

              <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
                Exceptional
                <br />
                <span className="text-neutral-500">
                  automobiles.
                </span>
              </h2>
            </div>

            <Link
              to="/cars"
              className="group flex w-full items-center justify-between border border-white/15 bg-white/[0.02] px-5 py-4 text-[10px] uppercase tracking-[0.18em] text-white/70 transition-all duration-500 hover:border-white hover:bg-white hover:text-black sm:w-[280px] sm:px-7 sm:py-5 sm:text-xs sm:tracking-[0.22em]"
            >
              <span>View All Cars</span>

              <span className="text-white/30 transition-all duration-500 group-hover:translate-x-1 group-hover:text-black">
                →
              </span>
            </Link>

          </div>

          {loadingCars ? (

            <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[450px] animate-pulse rounded-[18px] bg-neutral-900 sm:h-[520px] sm:rounded-[22px]"
                />
              ))}
            </div>

          ) : cars.length === 0 ? (

            <div className="rounded-2xl border border-white/10 px-5 py-20 text-center sm:rounded-3xl sm:py-24">
              <p className="text-sm text-neutral-500">
                No cars available at the moment.
              </p>
            </div>

          ) : (

            <div className="grid gap-4 sm:gap-5 md:grid-cols-3">

              {cars.map((car, index) => {

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

                      <button
                        type="button"
                        className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/40 text-lg backdrop-blur-md transition hover:bg-white hover:text-black sm:right-4 sm:top-4 sm:h-10 sm:w-10 sm:text-xl"
                        aria-label="Favorite"
                      >
                        ♡
                      </button>

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
                        className="mt-4 flex items-center justify-between rounded-xl border border-white/20 bg-gradient-to-b from-white/20 to-white/5 px-4 py-3 text-[10px] transition duration-300 hover:border-white hover:bg-white hover:text-black sm:mt-5 sm:px-5 sm:text-xs"
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
      {/* CONTACT / SHOWROOM */}
      {/* ========================================================= */}

      <section
        id="about"
        className="scroll-mt-24 bg-[#070809] px-4 py-16 sm:px-6 sm:py-20 lg:px-12 lg:py-28"
      >
        <div className="mx-auto max-w-[1500px]">

          <div className="mb-8 sm:mb-12">
            <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-600 sm:text-[10px] sm:tracking-[0.35em]">
              Visit us
            </p>

            <h2 className="mt-3 text-3xl font-light sm:mt-4 sm:text-5xl">
              Our Showroom
            </h2>
          </div>

          <div className="grid items-stretch gap-4 sm:gap-6 lg:grid-cols-[1.35fr_0.65fr]">

            {/* MAP */}
            <div className="h-[350px] overflow-hidden rounded-2xl border border-white/10 bg-[#111] sm:h-[420px] lg:h-full lg:min-h-[420px]">

              {shop?.google_maps_embed ? (

                <div
                  className="h-full w-full [&_iframe]:h-full [&_iframe]:min-h-full [&_iframe]:w-full [&_iframe]:border-0 [&_iframe]:grayscale"
                  dangerouslySetInnerHTML={{
                    __html: shop.google_maps_embed,
                  }}
                />

              ) : (

                <div className="flex h-full items-center justify-center text-sm text-neutral-600">
                  Map unavailable
                </div>

              )}

            </div>

            {/* CONTACT INFO */}
            <div className="h-full rounded-2xl border border-white/10 bg-[#090a0b] p-5 sm:p-7 md:p-9">

              {/* PHONE */}
              <div className="flex gap-4 border-b border-white/10 pb-6 sm:pb-7">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70">
                  <FaPhone
                    size={14}
                    className="scale-x-[-1]"
                  />
                </div>

                <div className="min-w-0">

                  <h3 className="text-sm font-medium">
                    Phone
                  </h3>

                  {shop?.phone ? (

                    <a
                      href={`tel:${shop.phone}`}
                      className="mt-2 block break-all text-sm text-neutral-400 transition hover:text-white"
                    >
                      {shop.phone}
                    </a>

                  ) : (

                    <p className="mt-2 text-sm text-neutral-600">
                      Not available
                    </p>

                  )}

                </div>

              </div>

              {/* HOURS */}
              <div className="flex gap-4 border-b border-white/10 py-6 sm:py-7">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70">
                  <FaClock size={15} />
                </div>

                <div className="min-w-0">

                  <h3 className="text-sm font-medium">
                    Working Hours
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-neutral-400">
                    <p>
                      Mon - Sat: {hours.monday}
                    </p>

                    <p>
                      Sunday: {hours.sunday}
                    </p>
                  </div>

                </div>

              </div>

              {/* SOCIAL */}
              <div className="pt-6 sm:pt-7">

                <p className="text-sm font-medium">
                  Follow Us
                </p>

                <div className="mt-4 flex gap-3">

                  {shop?.instagram && (
                    <a
                      href={shop.instagram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 sm:h-11 sm:w-11"
                    >
                      <FaInstagram size={17} />
                    </a>
                  )}

                  {shop?.tiktok && (
                    <a
                      href={shop.tiktok}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="TikTok"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 sm:h-11 sm:w-11"
                    >
                      <FaTiktok size={17} />
                    </a>
                  )}

                  {shop?.facebook && (
                    <a
                      href={shop.facebook}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 sm:h-11 sm:w-11"
                    >
                      <FaFacebook size={17} />
                    </a>
                  )}

                  {shop?.whatsapp && whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="WhatsApp"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 sm:h-11 sm:w-11"
                    >
                      <FaWhatsapp size={17} />
                    </a>
                  )}

                </div>

              </div>

            </div>

          </div>

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

          {/* TOP */}
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

            {/* NAVIGATION */}
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

export default Home