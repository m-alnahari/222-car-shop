import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Car = {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  mileage: number | null
  color: string | null
  status: 'available' | 'reserved' | 'sold'
  created_at: string
}

function Dashboard() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
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
        status,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setError(error.message)
      setLoading(false)
      return
    }

    setCars(data ?? [])
    setLoading(false)
  }

  const totalCars = cars.length

  const availableCars = cars.filter(
    (car) => car.status === 'available'
  ).length

  const reservedCars = cars.filter(
    (car) => car.status === 'reserved'
  ).length

  const soldCars = cars.filter(
    (car) => car.status === 'sold'
  ).length

  const recentCars = cars.slice(0, 5)

  return (
    <main className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-neutral-400 sm:text-base">
            Overview of your car shop.
          </p>
        </div>

        <Link
          to="/dashboard/cars/add"
          className="w-full rounded-lg bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-neutral-200 sm:w-auto"
        >
          + Add Car
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-900 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchDashboardData}
            className="mt-3 text-sm text-white underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {/* Total */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
          <p className="text-sm text-neutral-500">
            Total Cars
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {loading ? '-' : totalCars}
          </p>

          <p className="mt-2 text-sm text-neutral-600">
            Cars in inventory
          </p>
        </div>

        {/* Available */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
          <p className="text-sm text-neutral-500">
            Available
          </p>

          <p className="mt-3 text-3xl font-bold text-green-400">
            {loading ? '-' : availableCars}
          </p>

          <p className="mt-2 text-sm text-neutral-600">
            Ready for sale
          </p>
        </div>

        {/* Reserved */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
          <p className="text-sm text-neutral-500">
            Reserved
          </p>

          <p className="mt-3 text-3xl font-bold text-yellow-400">
            {loading ? '-' : reservedCars}
          </p>

          <p className="mt-2 text-sm text-neutral-600">
            Currently reserved
          </p>
        </div>

        {/* Sold */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
          <p className="text-sm text-neutral-500">
            Sold
          </p>

          <p className="mt-3 text-3xl font-bold text-red-400">
            {loading ? '-' : soldCars}
          </p>

          <p className="mt-2 text-sm text-neutral-600">
            Sold vehicles
          </p>
        </div>
      </div>

      {/* Recent Cars */}
      <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 sm:mt-8">
        <div className="flex flex-col gap-3 border-b border-neutral-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">
              Recent Cars
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Recently added vehicles.
            </p>
          </div>

          <Link
            to="/dashboard/cars"
            className="text-sm text-neutral-400 transition hover:text-white"
          >
            View all
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <p className="text-sm text-neutral-500">
              Loading recent cars...
            </p>
          </div>
        )}

        {/* No cars */}
        {!loading && !error && recentCars.length === 0 && (
          <div className="p-8 text-center sm:p-10">
            <h3 className="font-medium text-white">
              No cars yet
            </h3>

            <p className="mt-2 text-sm text-neutral-500">
              Add your first vehicle to see it here.
            </p>

            <Link
              to="/dashboard/cars/add"
              className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-neutral-200"
            >
              + Add Car
            </Link>
          </div>
        )}

        {/* Cars */}
        {!loading && recentCars.length > 0 && (
          <div className="divide-y divide-neutral-800">
            {recentCars.map((car) => (
              <div
                key={car.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6"
              >
                {/* Car Info */}
                <div className="min-w-0">
                  <h3 className="truncate font-medium text-white">
                    {car.brand} {car.model}
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    {car.year ?? '-'} •{' '}
                    {car.mileage !== null
                      ? `${car.mileage.toLocaleString()} km`
                      : 'No mileage'}
                  </p>
                </div>

                {/* Right Side */}
                <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
                  <div className="text-left sm:text-right">
                    <p className="font-medium text-white">
                      {car.price !== null
                        ? `QAR ${car.price.toLocaleString()}`
                        : '-'}
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${
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

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/dashboard/cars/${car.id}`}
                      className="shrink-0 text-sm text-neutral-400 transition hover:text-white"
                    >
                      View Details
                    </Link>

                    <Link
                      to={`/dashboard/cars/${car.id}/edit`}
                      className="shrink-0 text-sm text-neutral-400 transition hover:text-white"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Dashboard