import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type CarImage = {
  id: string
  car_id: string
  image_url: string
  storage_path: string
  created_at: string
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
  status: 'available' | 'reserved' | 'sold'
  slug: string
  created_at: string
  updated_at: string
  images: CarImage[]
}

function Cars() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchCars()
    checkAdmin()
  }, [])

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

  async function fetchCars() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        images:car_images(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setError('Failed to load cars.')
      setLoading(false)
      return
    }

    setCars(data ?? [])
    setLoading(false)
  }

  async function deleteCar(carId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this car? This will also delete all of its images.'
    )

    if (!confirmed) return

    // Get image paths
    const { data: images, error: imagesError } =
      await supabase
        .from('car_images')
        .select('storage_path')
        .eq('car_id', carId)

    if (imagesError) {
      console.error(imagesError)
      alert(imagesError.message)
      return
    }

    // Delete images from Storage
    const storagePaths =
      images?.map((image) => image.storage_path) ?? []

    if (storagePaths.length > 0) {
      const { error: storageError } =
        await supabase.storage
          .from('car-images')
          .remove(storagePaths)

      if (storageError) {
        console.error(storageError)
        alert(storageError.message)
        return
      }
    }

    // Delete car
    const { error: deleteError } =
      await supabase
        .from('cars')
        .delete()
        .eq('id', carId)

    if (deleteError) {
      console.error(deleteError)
      alert(deleteError.message)
      return
    }

    // Remove from screen
    setCars((currentCars) =>
      currentCars.filter((car) => car.id !== carId)
    )
  }

  // Search + filter + sorting
  const filteredCars = useMemo(() => {
    const searchValue = search.toLowerCase().trim()

    let result = cars.filter((car) => {
      // Search
      const matchesSearch =
        searchValue === '' ||
        car.brand.toLowerCase().includes(searchValue) ||
        car.model.toLowerCase().includes(searchValue) ||
        (car.color?.toLowerCase().includes(searchValue) ??
          false)

      // Status
      const matchesStatus =
        statusFilter === 'all' ||
        car.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        )
      }

      if (sortBy === 'oldest') {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        )
      }

      if (sortBy === 'price-high') {
        return (b.price ?? 0) - (a.price ?? 0)
      }

      if (sortBy === 'price-low') {
        return (a.price ?? 0) - (b.price ?? 0)
      }

      if (sortBy === 'year-new') {
        return (b.year ?? 0) - (a.year ?? 0)
      }

      if (sortBy === 'year-old') {
        return (a.year ?? 0) - (b.year ?? 0)
      }

      return 0
    })

    return result
  }, [cars, search, statusFilter, sortBy])

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setSortBy('newest')
  }

  return (
    <main className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Cars
          </h1>

          <p className="mt-2 text-sm text-neutral-400 sm:text-base">
            Manage the vehicles in your showroom.
          </p>
        </div>

        <Link
          to="/dashboard/cars/add"
          className="w-full rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-neutral-200 sm:w-auto"
        >
          + Add Car
        </Link>
      </div>

      {/* Search + Filters */}
      {!loading && !error && cars.length > 0 && (
        <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:mt-8 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="text-sm text-neutral-400">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search brand, model or color..."
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-sm text-neutral-400">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="available">
                  Available
                </option>

                <option value="reserved">
                  Reserved
                </option>

                <option value="sold">
                  Sold
                </option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm text-neutral-400">
                Sort By
              </label>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="oldest">
                  Oldest
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="year-new">
                  Year: Newest
                </option>

                <option value="year-old">
                  Year: Oldest
                </option>
              </select>
            </div>
          </div>

          {/* Filter bottom row */}
          <div className="mt-4 flex flex-col gap-3 border-t border-neutral-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Showing{' '}
              <span className="text-neutral-300">
                {filteredCars.length}
              </span>{' '}
              of{' '}
              <span className="text-neutral-300">
                {cars.length}
              </span>{' '}
              cars
            </p>

            {(search ||
              statusFilter !== 'all' ||
              sortBy !== 'newest') && (
              <button
                type="button"
                onClick={clearFilters}
                className="self-start text-sm text-neutral-400 transition hover:text-white sm:self-auto"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center sm:mt-8">
          <p className="text-neutral-400">
            Loading cars and images...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-6 text-center sm:mt-8 sm:p-8">
          <p className="text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchCars}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* No cars */}
      {!loading && !error && cars.length === 0 && (
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center sm:mt-8 sm:p-12">
          <h2 className="text-xl font-semibold text-white">
            No cars yet
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Add your first car to the showroom.
          </p>

          <Link
            to="/dashboard/cars/add"
            className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-neutral-200"
          >
            + Add Car
          </Link>
        </div>
      )}

      {/* No search results */}
      {!loading &&
        !error &&
        cars.length > 0 &&
        filteredCars.length === 0 && (
          <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center sm:mt-8 sm:p-12">
            <h2 className="text-xl font-semibold text-white">
              No matching cars
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-neutral-200"
            >
              Clear Filters
            </button>
          </div>
        )}

      {/* Cars */}
      {!loading &&
        !error &&
        filteredCars.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-8 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCars.map((car) => (
              <div
                key={car.id}
                className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
              >
                {/* Image */}
                <div className="aspect-video bg-neutral-950">
                  {car.images.length > 0 ? (
                    <img
                      src={car.images[0].image_url}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-600">
                      No image
                    </div>
                  )}
                </div>

                {/* Information */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words font-semibold text-white">
                        {car.brand} {car.model}
                      </h2>

                      <p className="mt-1 text-sm text-neutral-500">
                        {car.year ?? '-'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        car.status === 'available'
                          ? 'bg-green-500/10 text-green-400'
                          : car.status === 'reserved'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {car.status.charAt(0).toUpperCase() +
                        car.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-neutral-400">
                    <p>
                      Price:{' '}
                      {car.price !== null
                        ? `QAR ${car.price.toLocaleString()}`
                        : '-'}
                    </p>

                    <p>
                      Mileage:{' '}
                      {car.mileage !== null
                        ? `${car.mileage.toLocaleString()} km`
                        : '-'}
                    </p>

                    <p>
                      Color: {car.color ?? '-'}
                    </p>

                    <p>
                      Images: {car.images.length}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-col gap-2 border-t border-neutral-800 pt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                    <Link
                      to={`/dashboard/cars/${car.id}`}
                      className="w-full rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-white transition hover:bg-white/5 sm:w-auto"
                    >
                      View Details
                    </Link>

                    <Link
                      to={`/dashboard/cars/${car.id}/edit`}
                      className="w-full rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-white transition hover:bg-white/5 sm:w-auto"
                    >
                      Edit
                    </Link>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteCar(car.id)}
                        className="w-full rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 sm:w-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </main>
  )
}

export default Cars