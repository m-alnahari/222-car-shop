import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaArrowRight,
  FaPhone,
  FaWhatsapp,
} from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import Public_Navbar from '../../components/public/Public_Navbar'

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
  car_images: CarImage[]
}

type ShopSettings = {
  phone: string | null
  whatsapp: string | null
}

function formatPrice(price: number | null) {
  if (price === null || price === undefined) {
    return 'Price on request'
  }

  return `${new Intl.NumberFormat('en-US').format(price)} QAR`
}

function formatMileage(mileage: number | null) {
  if (mileage === null || mileage === undefined) {
    return '—'
  }

  return `${new Intl.NumberFormat('en-US').format(mileage)} km`
}

function CarDetails() {
  const { slug } = useParams<{ slug: string }>()

  const [car, setCar] = useState<Car | null>(null)
  const [shop, setShop] = useState<ShopSettings | null>(null)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    async function fetchCar() {
      if (!slug) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setLoading(true)
      setNotFound(false)

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
          car_images (
            id,
            image_url
          )
        `)
        .eq('slug', slug)
        .single()

      if (error || !data) {
        console.error('Error loading car:', error)
        setNotFound(true)
        setCar(null)
        setLoading(false)
        return
      }

      setCar(data as Car)
      setSelectedImage(0)
      setLoading(false)
    }

    async function fetchShop() {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('phone, whatsapp')
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error(
          'Error loading shop settings:',
          error
        )
        return
      }

      setShop(data)
    }

    fetchCar()
    fetchShop()
  }, [slug])

  const images = car?.car_images || []

  function nextImage() {
    if (images.length <= 1) return

    setSelectedImage((current) =>
      current === images.length - 1 ? 0 : current + 1
    )
  }

  function previousImage() {
    if (images.length <= 1) return

    setSelectedImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    )
  }

  function getWhatsAppUrl() {
    if (!shop?.whatsapp) return null

    const phone = shop.whatsapp.replace(/\D/g, '')

    if (!phone) return null

    const message = encodeURIComponent(
      car
        ? `Hello, I'm interested in the ${car.brand} ${car.model} (${car.year || ''}).`
        : 'Hello, I am interested in one of your cars.'
    )

    return `https://wa.me/${phone}?text=${message}`
  }

  const whatsappUrl = getWhatsAppUrl()

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <Public_Navbar />

        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border border-white/20 border-t-white" />

            <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-neutral-600">
              Loading vehicle
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (notFound || !car) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <Public_Navbar />

        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
              Vehicle
            </p>

            <h1 className="mt-4 text-3xl font-light sm:text-4xl">
              Car not found
            </h1>

            <p className="mt-4 text-sm text-neutral-500">
              This vehicle may no longer be available.
            </p>

            <Link
              to="/cars"
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-xs transition duration-300 hover:border-white hover:bg-white hover:text-black sm:w-auto"
            >
              <FaArrowLeft size={11} />
              Back to Collection
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Public_Navbar />

      {/* MAIN */}
      <section className="px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-12 lg:pt-36">
        <div className="mx-auto max-w-[1500px]">

          {/* BACK */}
          <Link
            to="/cars"
            className="mb-6 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-neutral-500 transition hover:text-white sm:mb-8"
          >
            <FaArrowLeft size={10} />
            Back to Collection
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:gap-10">

            {/* IMAGE SIDE */}
            <div>

              {/* MAIN IMAGE */}
              <div className="group relative overflow-hidden rounded-[18px] border border-white/15 bg-[#0a0a0a] sm:rounded-[22px]">

                {images.length > 0 ? (
                  <>
                    {/* Blurred background */}
                    <img
                      src={images[selectedImage].image_url}
                      alt=""
                      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-3xl"
                    />

                    {/* Image */}
                    <div className="relative z-10 flex h-[300px] items-center justify-center xs:h-[350px] sm:h-[500px] md:h-[600px] lg:h-[650px]">
                      <img
                        src={
                          images[selectedImage].image_url
                        }
                        alt={`${car.brand} ${car.model}`}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Gradient */}
                    <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                    {/* Status */}
                    <div className="absolute left-3 top-3 z-30 sm:left-5 sm:top-5">
                      <div className="rounded-lg border border-white/25 bg-black/40 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] backdrop-blur-md sm:rounded-xl sm:px-4 sm:py-2 sm:text-[10px]">
                        {car.status}
                      </div>
                    </div>

                    {/* Counter */}
                    <div className="absolute bottom-3 right-3 z-30 rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-[9px] tracking-[0.15em] text-white/70 backdrop-blur-md sm:bottom-5 sm:right-5 sm:rounded-xl sm:px-4 sm:py-2 sm:text-[10px]">
                      {selectedImage + 1} / {images.length}
                    </div>

                    {/* Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={previousImage}
                          aria-label="Previous image"
                          className="absolute left-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:border-white hover:bg-white hover:text-black sm:left-5 sm:h-11 sm:w-11"
                        >
                          <FaArrowLeft size={10} />
                        </button>

                        <button
                          type="button"
                          onClick={nextImage}
                          aria-label="Next image"
                          className="absolute right-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:border-white hover:bg-white hover:text-black sm:right-5 sm:h-11 sm:w-11"
                        >
                          <FaArrowRight size={10} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-[300px] items-center justify-center sm:h-[500px] lg:h-[650px]">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-700">
                      No images available
                    </p>
                  </div>
                )}
              </div>

              {/* THUMBNAILS */}
              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:mt-4 sm:grid-cols-5 sm:gap-3 md:grid-cols-6">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() =>
                        setSelectedImage(index)
                      }
                      className={`relative aspect-[4/3] overflow-hidden rounded-lg border transition sm:rounded-xl ${
                        selectedImage === index
                          ? 'border-white'
                          : 'border-white/10 opacity-60 hover:border-white/40 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DETAILS SIDE */}
            <div className="lg:pt-4">

              {/* BRAND */}
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                {car.brand}
              </p>

              {/* MODEL */}
              <h1 className="mt-2 break-words text-3xl font-light tracking-[-0.04em] sm:mt-3 sm:text-5xl lg:text-6xl">
                {car.model}
              </h1>

              {/* YEAR */}
              {car.year && (
                <p className="mt-2 text-sm text-neutral-500 sm:mt-3">
                  {car.year}
                </p>
              )}

              {/* PRICE */}
              <div className="mt-6 border-y border-white/10 py-5 sm:mt-8 sm:py-6">
                <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-600">
                  Price
                </p>

                <p className="mt-2 text-xl font-medium sm:text-2xl">
                  {formatPrice(car.price)}
                </p>
              </div>

              {/* SPECS */}
              <div className="mt-6 grid grid-cols-2 border-y border-white/10 sm:mt-8">

                <div className="border-r border-white/10 py-4 pr-4 sm:py-5 sm:pr-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                    Year
                  </p>

                  <p className="mt-2 text-sm">
                    {car.year || '—'}
                  </p>
                </div>

                <div className="py-4 pl-4 sm:py-5 sm:pl-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                    Mileage
                  </p>

                  <p className="mt-2 text-sm">
                    {formatMileage(car.mileage)}
                  </p>
                </div>

                <div className="border-r border-t border-white/10 py-4 pr-4 sm:py-5 sm:pr-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                    Color
                  </p>

                  <p className="mt-2 break-words text-sm">
                    {car.color || '—'}
                  </p>
                </div>

                <div className="border-t border-white/10 py-4 pl-4 sm:py-5 sm:pl-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-600">
                    Status
                  </p>

                  <p className="mt-2 text-sm capitalize">
                    {car.status}
                  </p>
                </div>
              </div>

              {/* DESCRIPTION */}
              {car.description && (
                <div className="mt-6 sm:mt-8">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-neutral-600">
                    Description
                  </p>

                  <p className="mt-3 text-sm leading-7 text-neutral-400 sm:mt-4">
                    {car.description}
                  </p>
                </div>
              )}

              {/* CONTACT */}
              <div className="mt-7 space-y-3 sm:mt-9">

                {shop?.phone && (
                  <a
                    href={`tel:${shop.phone}`}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-gradient-to-b from-white/20 to-white/5 px-6 py-4 text-xs transition duration-300 hover:border-white hover:bg-white hover:text-black"
                  >
                    <FaPhone
                      size={13}
                      className="scale-x-[-1]"
                    />

                    Call Us
                  </a>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 px-6 py-4 text-xs text-neutral-300 transition duration-300 hover:border-white hover:bg-white hover:text-black"
                  >
                    <FaWhatsapp size={15} />

                    WhatsApp
                  </a>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default CarDetails