import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function AddCar() {
  const navigate = useNavigate()

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [price, setPrice] = useState('')
  const [mileage, setMileage] = useState('')
  const [color, setColor] = useState('')
  const [status, setStatus] = useState('available')
  const [description, setDescription] = useState('')

  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleImagesChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? []
    )

    setImages((currentImages) => [
      ...currentImages,
      ...selectedFiles,
    ])

    event.target.value = ''
  }

  function removeSelectedImage(index: number) {
    setImages((currentImages) =>
      currentImages.filter(
        (_, imageIndex) => imageIndex !== index
      )
    )
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setLoading(true)
    setError('')

    const slugBase = `${brand}-${model}-${year}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const slug = `${slugBase}-${Date.now()}`

    // 1. Create the car
    const { data: car, error: carError } = await supabase
      .from('cars')
      .insert({
        brand: brand.trim(),
        model: model.trim(),
        year: year ? Number(year) : null,
        price: price ? Number(price) : null,
        mileage: mileage ? Number(mileage) : null,
        color: color.trim() || null,
        status,
        description: description.trim() || null,
        slug,
      })
      .select()
      .single()

    if (carError || !car) {
      console.error(carError)

      setError(
        carError?.message ?? 'Failed to create car.'
      )

      setLoading(false)
      return
    }

    const uploadedPaths: string[] = []

    // 2. Upload images
    for (const image of images) {
      const fileExtension =
        image.name.split('.').pop()?.toLowerCase() || 'jpg'

      const fileName = `${crypto.randomUUID()}.${fileExtension}`

      const storagePath = `${car.id}/${fileName}`

      const { error: uploadError } =
        await supabase.storage
          .from('car-images')
          .upload(storagePath, image, {
            cacheControl: '3600',
            upsert: false,
          })

      if (uploadError) {
        console.error(uploadError)

        // Remove images already uploaded
        if (uploadedPaths.length > 0) {
          await supabase.storage
            .from('car-images')
            .remove(uploadedPaths)
        }

        // Remove the car because creation failed
        await supabase
          .from('cars')
          .delete()
          .eq('id', car.id)

        setError(uploadError.message)
        setLoading(false)
        return
      }

      uploadedPaths.push(storagePath)

      // 3. Get public URL
      const { data: publicUrlData } =
        supabase.storage
          .from('car-images')
          .getPublicUrl(storagePath)

      // 4. Save image information
      const { error: imageRecordError } =
        await supabase
          .from('car_images')
          .insert({
            car_id: car.id,
            image_url: publicUrlData.publicUrl,
            storage_path: storagePath,
          })

      if (imageRecordError) {
        console.error(imageRecordError)

        // Remove uploaded files
        await supabase.storage
          .from('car-images')
          .remove(uploadedPaths)

        // Remove the car
        await supabase
          .from('cars')
          .delete()
          .eq('id', car.id)

        setError(imageRecordError.message)
        setLoading(false)
        return
      }
    }

    // 5. Everything worked
    setLoading(false)
    navigate('/dashboard/cars')
  }

  return (
    <main className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div>
        <Link
          to="/dashboard/cars"
          className="text-sm text-neutral-500 transition hover:text-white"
        >
          ← Back to Cars
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
          Add Car
        </h1>

        <p className="mt-2 text-sm text-neutral-400 sm:text-base">
          Add a new vehicle to your showroom.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 w-full max-w-4xl rounded-lg border border-red-900 bg-red-950/30 p-4">
          <p className="text-sm break-words text-red-400">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 w-full max-w-4xl space-y-6 sm:mt-8 sm:space-y-8"
      >
        {/* Basic Information */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Basic Information
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm text-neutral-400">
                Brand
              </label>

              <input
                type="text"
                value={brand}
                onChange={(event) =>
                  setBrand(event.target.value)
                }
                required
                placeholder="e.g. BMW"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400">
                Model
              </label>

              <input
                type="text"
                value={model}
                onChange={(event) =>
                  setModel(event.target.value)
                }
                required
                placeholder="e.g. M4"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400">
                Year
              </label>

              <input
                type="number"
                value={year}
                onChange={(event) =>
                  setYear(event.target.value)
                }
                placeholder="e.g. 2024"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400">
                Price (QAR)
              </label>

              <input
                type="number"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="e.g. 320000"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400">
                Mileage (km)
              </label>

              <input
                type="number"
                value={mileage}
                onChange={(event) =>
                  setMileage(event.target.value)
                }
                placeholder="e.g. 8500"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400">
                Color
              </label>

              <input
                type="text"
                value={color}
                onChange={(event) =>
                  setColor(event.target.value)
                }
                placeholder="e.g. Black"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600"
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Status
          </h2>

          <div className="mt-5 w-full max-w-md">
            <label className="text-sm text-neutral-400">
              Car Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
            >
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
        </section>

        {/* Description */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Description
          </h2>

          <textarea
            rows={6}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Write a description about the car..."
            className="mt-5 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
        </section>

        {/* Images */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Car Images
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Select one or more images.
          </p>

          <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-950 px-4 py-10 text-center transition hover:border-neutral-500 sm:min-h-48 sm:px-6 sm:py-12">
            <span className="text-sm text-white sm:text-base">
              Click to select images
            </span>

            <span className="mt-2 text-xs text-neutral-500 sm:text-sm">
              PNG, JPG or WEBP
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleImagesChange}
              className="hidden"
            />
          </label>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {images.map((image, index) => (
                <div
                  key={`${image.name}-${index}`}
                  className="group relative overflow-hidden rounded-lg border border-neutral-800"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={image.name}
                    className="aspect-square w-full object-cover"
                  />

                  {/* Mobile: always visible / Desktop: hover */}
                  <button
                    type="button"
                    onClick={() =>
                      removeSelectedImage(index)
                    }
                    className="absolute right-2 top-2 rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    Remove
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                    <p className="truncate text-xs text-white">
                      {image.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Buttons */}
        <div className="flex flex-col-reverse gap-3 pb-4 sm:flex-row sm:justify-end sm:gap-4">
          <Link
            to="/dashboard/cars"
            className="w-full rounded-lg border border-neutral-800 px-5 py-3 text-center text-sm font-medium text-neutral-300 transition hover:bg-neutral-900 hover:text-white sm:w-auto"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? 'Adding Car...' : 'Add Car'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default AddCar