import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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
  updated_at: string
}

type CarImage = {
  id: string
  car_id: string
  image_url: string
  storage_path: string
  created_at: string
}

function CarDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [car, setCar] = useState<Car | null>(null)
  const [images, setImages] = useState<CarImage[]>([])

  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('Car ID is missing.')
      setLoading(false)
      return
    }

    fetchCar()
    checkAdmin()
  }, [id])

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsAdmin(false)
      return
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) {
      console.error(profileError)
      setIsAdmin(false)
      return
    }

    setIsAdmin(profile?.role === 'admin')
  }

  async function fetchCar() {
    if (!id) return

    setLoading(true)
    setError('')

    const { data: carData, error: carError } =
      await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single()

    if (carError) {
      console.error(carError)
      setError('Failed to load car.')
      setLoading(false)
      return
    }

    const { data: imageData, error: imageError } =
      await supabase
        .from('car_images')
        .select('*')
        .eq('car_id', id)
        .order('created_at', { ascending: true })

    if (imageError) {
      console.error(imageError)
      setError(
        'Car loaded, but images could not be loaded.'
      )
    }

    setCar(carData)
    setImages(imageData ?? [])
    setLoading(false)
  }

  async function handleDeleteCar() {
    if (!car || deleting) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${car.brand} ${car.model}?`
    )

    if (!confirmed) return

    setDeleting(true)
    setError('')

    try {
      // Get all storage paths first
      const { data: imageData, error: imageError } =
        await supabase
          .from('car_images')
          .select('storage_path')
          .eq('car_id', car.id)

      if (imageError) {
        throw imageError
      }

      const storagePaths =
        imageData
          ?.map((image) => image.storage_path)
          .filter(Boolean) ?? []

      // Delete images from Storage
      if (storagePaths.length > 0) {
        const { error: storageError } =
          await supabase.storage
            .from('car-images')
            .remove(storagePaths)

        if (storageError) {
          throw storageError
        }
      }

      // Delete car from database
      // car_images rows will be deleted automatically because
      // car_id uses ON DELETE CASCADE.
      const { error: deleteError } =
        await supabase
          .from('cars')
          .delete()
          .eq('id', car.id)

      if (deleteError) {
        throw deleteError
      }

      navigate('/dashboard/cars')
    } catch (err) {
      console.error(err)
      setError('Failed to delete car.')
      setDeleting(false)
    }
  }

  function getStatusClasses(status: Car['status']) {
    if (status === 'available') {
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    }

    if (status === 'reserved') {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }

    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  function formatPrice(price: number | null) {
    if (price === null) return '—'

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'QAR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  function formatMileage(mileage: number | null) {
    if (mileage === null) return '—'

    return `${new Intl.NumberFormat('en-US').format(
      mileage
    )} km`
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <main className="p-4 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 text-white sm:p-8">
          Loading car...
        </div>
      </main>
    )
  }

  if (!car) {
    return (
      <main className="p-4 sm:p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400 sm:p-8">
          {error || 'Car not found.'}
        </div>

        <Link
          to="/dashboard/cars"
          className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Back to Cars
        </Link>
      </main>
    )
  }

  return (
    <main className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <Link
            to="/dashboard/cars"
            className="mb-3 inline-block text-sm text-neutral-400 hover:text-white"
          >
            ← Back to Cars
          </Link>

          <h1 className="break-words text-2xl font-bold text-white sm:text-3xl">
            {car.brand} {car.model}
          </h1>

          <p className="mt-1 text-sm text-neutral-400">
            Car details
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <Link
            to={`/dashboard/cars/${car.id}/edit`}
            className="w-full rounded-lg border border-white/10 bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-neutral-800 sm:w-auto"
          >
            Edit Car
          </Link>

          {isAdmin && (
            <button
              type="button"
              onClick={handleDeleteCar}
              disabled={deleting}
              className="w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {deleting ? 'Deleting...' : 'Delete Car'}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Images */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">
                Car Images
              </h2>

              <span className="shrink-0 text-sm text-neutral-400">
                {images.length} image
                {images.length !== 1 ? 's' : ''}
              </span>
            </div>

            {images.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-white/10 bg-neutral-950 sm:min-h-80">
                <p className="text-sm text-neutral-500">
                  No images uploaded.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-neutral-950"
                  >
                    <img
                      src={image.image_url}
                      alt={`${car.brand} ${car.model}`}
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Main Info */}
        <section>
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-neutral-500">
                  {car.brand}
                </p>

                <h2 className="break-words text-2xl font-bold text-white">
                  {car.model}
                </h2>
              </div>

              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusClasses(
                  car.status
                )}`}
              >
                {car.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Price
                </p>

                <p className="mt-1 text-xl font-semibold text-white">
                  {formatPrice(car.price)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Year
                  </p>

                  <p className="mt-1 text-white">
                    {car.year ?? '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Mileage
                  </p>

                  <p className="mt-1 text-white">
                    {formatMileage(car.mileage)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Color
                </p>

                <p className="mt-1 break-words text-white">
                  {car.color || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Added
                </p>

                <p className="mt-1 text-white">
                  {formatDate(car.created_at)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Last Updated
                </p>

                <p className="mt-1 text-white">
                  {formatDate(car.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="lg:col-span-3">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:p-5">
            <h2 className="mb-3 text-lg font-semibold text-white">
              Description
            </h2>

            {car.description ? (
              <p className="whitespace-pre-wrap break-words leading-7 text-neutral-300">
                {car.description}
              </p>
            ) : (
              <p className="text-neutral-500">
                No description added.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default CarDetails