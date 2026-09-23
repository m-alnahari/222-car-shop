import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type SettingsData = {
  id: string
  shop_name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  logo_url: string | null
  google_maps_embed: string | null
}

function Settings() {
  const [settingsId, setSettingsId] = useState('')

  const [shopName, setShopName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState('')

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingLogo, setRemovingLogo] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchSettings()
    }
  }, [isAdmin])

  async function checkAdmin() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsAdmin(false)
      setLoading(false)
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
      setLoading(false)
      return
    }

    const admin = profile?.role === 'admin'

    setIsAdmin(admin)

    if (!admin) {
      setLoading(false)
    }
  }

  async function fetchSettings() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)
      setError(error.message)
      setLoading(false)
      return
    }

    if (data) {
      const settings = data as SettingsData

      setSettingsId(settings.id)
      setShopName(settings.shop_name ?? '')
      setPhone(settings.phone ?? '')
      setWhatsapp(settings.whatsapp ?? '')
      setEmail(settings.email ?? '')
      setAddress(settings.address ?? '')
      setLogoUrl(settings.logo_url ?? '')
      setLogoPreview(settings.logo_url ?? '')
      setGoogleMapsEmbed(
        settings.google_maps_embed ?? ''
      )
    }

    setLoading(false)
  }

  function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    setError('')
    setSuccess('')

    // Clean up previous temporary preview
    if (
      logoFile &&
      logoPreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(logoPreview)
    }

    setLogoFile(file)

    const previewUrl = URL.createObjectURL(file)
    setLogoPreview(previewUrl)

    event.target.value = ''
  }

  function cancelNewLogo() {
    if (
      logoFile &&
      logoPreview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(logoPreview)
    }

    setLogoFile(null)
    setLogoPreview(logoUrl)
  }

  function getStoragePathFromUrl(url: string) {
    const marker = '/shop-assets/'

    const index = url.indexOf(marker)

    if (index === -1) {
      return null
    }

    return decodeURIComponent(
      url.substring(index + marker.length)
    )
  }

  async function uploadLogo(file: File) {
    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'png'

    const storagePath =
      `logo/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } =
      await supabase.storage
        .from('shop-assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('shop-assets')
      .getPublicUrl(storagePath)

    return {
      url: data.publicUrl,
      storagePath,
    }
  }

  async function deleteLogoFromStorage(
    logoPublicUrl: string
  ) {
    const storagePath =
      getStoragePathFromUrl(logoPublicUrl)

    if (!storagePath) {
      return
    }

    const { error } = await supabase.storage
      .from('shop-assets')
      .remove([storagePath])

    if (error) {
      throw error
    }
  }

  async function handleRemoveLogo() {
    if (!settingsId) {
      setLogoFile(null)
      setLogoPreview('')
      setLogoUrl('')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to remove the shop logo?'
    )

    if (!confirmed) return

    setRemovingLogo(true)
    setError('')
    setSuccess('')

    try {
      // Delete existing file from Storage
      if (logoUrl) {
        await deleteLogoFromStorage(logoUrl)
      }

      // Remove URL from database
      const { error: databaseError } =
        await supabase
          .from('shop_settings')
          .update({
            logo_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settingsId)

      if (databaseError) {
        throw databaseError
      }

      // Clear local state
      if (
        logoFile &&
        logoPreview.startsWith('blob:')
      ) {
        URL.revokeObjectURL(logoPreview)
      }

      setLogoFile(null)
      setLogoUrl('')
      setLogoPreview('')

      setSuccess('Logo removed successfully.')
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to remove logo.')
      }
    }

    setRemovingLogo(false)
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!isAdmin) return

    setSaving(true)
    setError('')
    setSuccess('')

    let newLogoPath: string | null = null

    try {
      let newLogoUrl = logoUrl

      // Upload new logo if selected
      if (logoFile) {
        const uploadedLogo =
          await uploadLogo(logoFile)

        newLogoUrl = uploadedLogo.url
        newLogoPath = uploadedLogo.storagePath
      }

      const settingsData = {
        shop_name: shopName.trim(),
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        logo_url: newLogoUrl || null,
        google_maps_embed:
          googleMapsEmbed.trim() || null,
        updated_at: new Date().toISOString(),
      }

      // Update existing settings
      if (settingsId) {
        const { error: updateError } =
          await supabase
            .from('shop_settings')
            .update(settingsData)
            .eq('id', settingsId)

        if (updateError) {
          // Remove newly uploaded logo if DB update failed
          if (newLogoPath) {
            await supabase.storage
              .from('shop-assets')
              .remove([newLogoPath])
          }

          throw updateError
        }
      } else {
        // Create settings
        const { data, error: insertError } =
          await supabase
            .from('shop_settings')
            .insert({
              ...settingsData,
              created_at:
                new Date().toISOString(),
            })
            .select()
            .single()

        if (insertError) {
          // Remove newly uploaded logo if DB insert failed
          if (newLogoPath) {
            await supabase.storage
              .from('shop-assets')
              .remove([newLogoPath])
          }

          throw insertError
        }

        setSettingsId(data.id)
      }

      // Delete old logo after the new one is safely saved
      if (
        logoFile &&
        logoUrl &&
        newLogoUrl !== logoUrl
      ) {
        try {
          await deleteLogoFromStorage(logoUrl)
        } catch (oldLogoError) {
          console.error(
            'Could not delete old logo:',
            oldLogoError
          )
        }
      }

      // Update local state
      setLogoUrl(newLogoUrl)
      setLogoFile(null)
      setLogoPreview(newLogoUrl)

      setSuccess('Settings saved successfully.')
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to save settings.')
      }
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="p-4 sm:p-6 md:p-8">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center sm:p-8">
          <p className="text-neutral-400">
            Loading settings...
          </p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl rounded-xl border border-red-900 bg-red-950/30 p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Access Denied
          </h1>

          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            You do not have permission to manage shop settings.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Settings
        </h1>

        <p className="mt-2 text-sm text-neutral-400 sm:text-base">
          Manage your car shop information.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 max-w-4xl rounded-lg border border-red-900 bg-red-950/30 p-4 sm:mt-6">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-5 max-w-4xl rounded-lg border border-green-900 bg-green-950/30 p-4 sm:mt-6">
          <p className="text-sm text-green-400">
            {success}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-4xl space-y-5 sm:mt-8 sm:space-y-8"
      >
        {/* Shop Information */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Shop Information
          </h2>

          <div className="mt-5 space-y-5 sm:mt-6">
            {/* Shop Name */}
            <div>
              <label className="text-sm text-neutral-400">
                Shop Name
              </label>

              <input
                type="text"
                value={shopName}
                onChange={(event) =>
                  setShopName(event.target.value)
                }
                required
                placeholder="e.g. 222 Luxury Car Shop"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-sm text-neutral-400">
                Address
              </label>

              <textarea
                rows={3}
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Shop address"
                className="mt-2 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Contact Information
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 md:grid-cols-2">
            {/* Phone */}
            <div>
              <label className="text-sm text-neutral-400">
                Phone
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="+974 0000 0000"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="text-sm text-neutral-400">
                WhatsApp
              </label>

              <input
                type="tel"
                value={whatsapp}
                onChange={(event) =>
                  setWhatsapp(event.target.value)
                }
                placeholder="+974 0000 0000"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="text-sm text-neutral-400">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="info@example.com"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>
          </div>
        </section>

        {/* Logo */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Shop Logo
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Upload the logo that will be used across the website.
          </p>

          {logoPreview ? (
            <div className="mt-5 sm:mt-6">
              {/* Preview */}
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:h-48 sm:w-48">
                <img
                  src={logoPreview}
                  alt="Shop logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Buttons */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <label className="w-full cursor-pointer rounded-lg border border-neutral-800 px-4 py-2.5 text-center text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white sm:w-auto">
                  Change Logo

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>

                {logoFile && (
                  <button
                    type="button"
                    onClick={cancelNewLogo}
                    className="w-full rounded-lg border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800 hover:text-white sm:w-auto"
                  >
                    Cancel Change
                  </button>
                )}

                {!logoFile && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={removingLogo}
                    className="w-full rounded-lg border border-red-900 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {removingLogo
                      ? 'Removing...'
                      : 'Remove Logo'}
                  </button>
                )}
              </div>

              {logoFile && (
                <p className="mt-3 text-xs text-neutral-500">
                  New logo selected. Click "Save Settings" to upload it.
                </p>
              )}
            </div>
          ) : (
            <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-950 px-4 py-12 text-center transition hover:border-neutral-500 sm:mt-6 sm:min-h-48 sm:px-6 sm:py-16">
              <span className="text-sm text-white sm:text-base">
                Upload your logo
              </span>

              <span className="mt-2 text-xs text-neutral-500 sm:text-sm">
                PNG, JPG, WEBP or SVG
              </span>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          )}
        </section>

        {/* Google Maps */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Google Maps
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Add your shop location using the Google Maps embed code.
          </p>

          <div className="mt-5 sm:mt-6">
            <label className="text-sm text-neutral-400">
              Google Maps Embed Code
            </label>

            <textarea
              rows={6}
              value={googleMapsEmbed}
              onChange={(event) =>
                setGoogleMapsEmbed(event.target.value)
              }
              placeholder="<iframe src=..."
              className="mt-2 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 font-mono text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500 sm:text-sm"
            />
          </div>

          <p className="mt-3 text-xs text-neutral-600">
            Google Maps → Share → Embed a map → Copy HTML
          </p>

          {googleMapsEmbed && (
            <div className="mt-5 sm:mt-6">
              <p className="mb-3 text-sm text-neutral-400">
                Map Preview
              </p>

              <div
                className="overflow-hidden rounded-lg border border-neutral-800 [&_iframe]:h-64 [&_iframe]:w-full sm:[&_iframe]:h-80"
                dangerouslySetInnerHTML={{
                  __html: googleMapsEmbed,
                }}
              />
            </div>
          )}
        </section>

        {/* Save */}
        <div className="flex justify-stretch sm:justify-end">
          <button
            type="submit"
            disabled={saving || removingLogo}
            className="w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving
              ? 'Saving...'
              : 'Save Settings'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default Settings