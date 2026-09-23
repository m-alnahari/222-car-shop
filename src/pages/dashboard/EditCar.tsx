import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type CarImage = {
  id: string
  car_id: string
  image_url: string
  storage_path: string
  created_at: string
}

function EditCar() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [price, setPrice] = useState('')
  const [mileage, setMileage] = useState('')
  const [color, setColor] = useState('')
  const [status, setStatus] = useState('available')
  const [description, setDescription] = useState('')

  const [existingImages, setExistingImages] = useState<CarImage[]>([])
  const [newImages, setNewImages] = useState<File[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCar()
      checkAdmin()
    }
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

    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        images:car_images(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error(error)
      setError(error.message)
      setLoading(false)
      return
    }

    setBrand(data.brand ?? '')
    setModel(data.model ?? '')
    setYear(data.year?.toString() ?? '')
    setPrice(data.price?.toString() ?? '')
    setMileage(data.mileage?.toString() ?? '')
    setColor(data.color ?? '')
    setStatus(data.status ?? 'available')
    setDescription(data.description ?? '')
    setExistingImages(data.images ?? [])

    setLoading(false)
  }

  function handleNewImages(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? []
    )

    setNewImages((currentImages) => [
      ...currentImages,
      ...selectedFiles,
    ])

    event.target.value = ''
  }

  function removeNewImage(index: number) {
    setNewImages((currentImages) =>
      currentImages.filter(
        (_, imageIndex) => imageIndex !== index
      )
    )
  }

  async function deleteExistingImage(image: CarImage) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this image?'
    )

    if (!confirmed) return

    setError('')

    const { error: storageError } =
      await supabase.storage
        .from('car-images')
        .remove([image.storage_path])

    if (storageError) {
      console.error(storageError)
      setError(storageError.message)
      return
    }

    const { error: databaseError } =
      await supabase
        .from('car_images')
        .delete()
        .eq('id', image.id)

    if (databaseError) {
      console.error(databaseError)

      setError(
        'The image file was deleted, but its database record could not be deleted.'
      )

      return
    }

    setExistingImages((currentImages) =>
      currentImages.filter(
        (currentImage) => currentImage.id !== image.id
      )
    )
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!id) return

    setSaving(true)
    setError('')

    // 1. Update car information
    const { error: updateError } = await supabase
      .from('cars')
      .update({
        brand: brand.trim(),
        model: model.trim(),
        year: year ? Number(year) : null,
        price: price ? Number(price) : null,
        mileage: mileage ? Number(mileage) : null,
        color: color.trim() || null,
        status,
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error(updateError)
      setError(updateError.message)
      setSaving(false)
      return
    }

    const uploadedPaths: string[] = []

    // 2. Upload new images
    for (const image of newImages) {
      const extension =
        image.name.split('.').pop()?.toLowerCase() || 'jpg'

      const fileName = `${crypto.randomUUID()}.${extension}`
      const storagePath = `${id}/${fileName}`

      const { error: uploadError } =
        await supabase.storage
          .from('car-images')
          .upload(storagePath, image, {
            cacheControl: '3600',
            upsert: false,
          })

      if (uploadError) {
        console.error(uploadError)

        if (uploadedPaths.length > 0) {
          await supabase.storage
            .from('car-images')
            .remove(uploadedPaths)
        }

        setError(uploadError.message)
        setSaving(false)
        return
      }

      uploadedPaths.push(storagePath)

      // 3. Get public URL
      const { data: publicUrlData } =
        supabase.storage
          .from('car-images')
          .getPublicUrl(storagePath)

      // 4. Save image record
      const { error: imageRecordError } =
        await supabase
          .from('car_images')
          .insert({
            car_id: id,
            image_url: publicUrlData.publicUrl,
            storage_path: storagePath,
          })

      if (imageRecordError) {
        console.error(imageRecordError)

        await supabase.storage
          .from('car-images')
          .remove(uploadedPaths)

        setError(imageRecordError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    navigate('/dashboard/cars')
  }

  async function handleDeleteCar() {
    if (!id || !isAdmin) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this car? This will also delete all of its images.'
    )

    if (!confirmed) return

    setSaving(true)
    setError('')

    // 1. Get all image paths
    const { data: images, error: imagesError } =
      await supabase
        .from('car_images')
        .select('storage_path')
        .eq('car_id', id)

    if (imagesError) {
      console.error(imagesError)
      setError(imagesError.message)
      setSaving(false)
      return
    }

    // 2. Delete images from Storage
    const storagePaths =
      images?.map((image) => image.storage_path) ?? []

    if (storagePaths.length > 0) {
      const { error: storageError } =
        await supabase.storage
          .from('car-images')
          .remove(storagePaths)

      if (storageError) {
        console.error(storageError)
        setError(storageError.message)
        setSaving(false)
        return
      }
    }

    // 3. Delete car
    // car_images rows are deleted automatically because of ON DELETE CASCADE
    const { error: deleteError } =
      await supabase
        .from('cars')
        .delete()
        .eq('id', id)

    if (deleteError) {
      console.error(deleteError)
      setError(deleteError.message)
      setSaving(false)
      return
    }

    navigate('/dashboard/cars')
  }

  if (loading) {
    return (
      <main className="p-4 sm:p-6 md:p-8">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center sm:p-8">
          <p className="text-neutral-400">
            Loading car...
          </p>
        </div>
      </main>
    )
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
          Edit Car
        </h1>

        <p className="mt-2 text-sm text-neutral-400 sm:text-base">
          Update the information for this vehicle.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 max-w-4xl rounded-lg border border-red-900 bg-red-950/30 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-4xl space-y-5 sm:mt-8 sm:space-y-8"
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
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
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
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
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
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
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
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
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
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
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
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Status
          </h2>

          <div className="mt-5 max-w-md">
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
            className="mt-5 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-neutral-500"
          />
        </section>

        {/* Existing Images */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Current Images
          </h2>

          {existingImages.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              This car has no images.
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
              {existingImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-lg border border-neutral-800"
                >
                  <img
                    src={image.image_url}
                    alt="Car"
                    className="aspect-square w-full object-cover"
                  />

                  {/* Staff + Admin can delete images */}
                  <button
                    type="button"
                    onClick={() =>
                      deleteExistingImage(image)
                    }
                    disabled={saving}
                    className="absolute right-2 top-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white opacity-100 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add Images */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Add Images
          </h2>

          <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-950 px-4 py-10 text-center transition hover:border-neutral-500 sm:mt-6 sm:min-h-48 sm:px-6">
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
              onChange={handleNewImages}
              className="hidden"
            />
          </label>

          {newImages.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
              {newImages.map((image, index) => (
                <div
                  key={`${image.name}-${index}`}
                  className="group relative overflow-hidden rounded-lg border border-neutral-800"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={image.name}
                    className="aspect-square w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute right-2 top-2 rounded-md bg-black/80 px-3 py-1.5 text-xs text-white opacity-100 transition hover:bg-black sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Buttons */}
        <div className="flex flex-col-reverse gap-4 border-t border-neutral-800 pt-5 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:pt-0">
          {/* Admin only */}
          {isAdmin ? (
            <button
              type="button"
              onClick={handleDeleteCar}
              disabled={saving}
              className="w-full rounded-lg border border-red-900 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-950/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Delete Car
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <Link
              to="/dashboard/cars"
              className="w-full rounded-lg border border-neutral-800 px-5 py-3 text-center text-sm font-medium text-neutral-300 transition hover:bg-neutral-900 hover:text-white sm:w-auto"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}

export default EditCar