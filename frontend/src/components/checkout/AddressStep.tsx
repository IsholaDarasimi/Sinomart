import * as React from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import { useAuth } from '@/context/AuthProvider'
import { listAddresses, upsertAddress } from '@/services/misc'
import { supabase } from '@/lib/supabase'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import type { Address } from '@/types/domain'

const LAGOS_LGAS = [
  'Agege',
  'Ajeromi-Ifelodun',
  'Alimosho',
  'Amuwo-Odofin',
  'Apapa',
  'Badagry',
  'Epe',
  'Eti-Osa',
  'Ibeju-Lekki',
  'Ifako-Ijaiye',
  'Ikeja',
  'Ikorodu',
  'Kosofe',
  'Lagos Island',
  'Lagos Mainland',
  'Mushin',
  'Ojo',
  'Oshodi-Isolo',
  'Somolu',
  'Surulere',
] as const

const addressSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name'),
  phone: z.string().trim().min(7, 'Enter a valid phone number'),
  address_line: z
    .string()
    .trim()
    .min(4, 'Enter your full delivery address'),
  city: z.string().min(2, 'Select your LGA'),
  state: z.literal('Lagos'),
  landmark: z.string().optional(),
  delivery_instructions: z.string().optional(),
})

type AddressFormValues = z.infer<typeof addressSchema>

export function AddressStep({
  onNext,
}: {
  onNext: (address: Address) => void
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = React.useState(false)
  const [editingAddress, setEditingAddress] =
    React.useState<Address | null>(null)
  const [deletingAddressId, setDeletingAddressId] =
    React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => listAddresses(user!.id),
    enabled: !!user,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState,
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      state: 'Lagos',
      city: '',
      full_name: '',
      phone: '',
      address_line: '',
      landmark: '',
      delivery_instructions: '',
    },
  })

  const hasAddresses = !!addresses?.length

  function openAddForm() {
    setEditingAddress(null)

    reset({
      state: 'Lagos',
      city: '',
      full_name: '',
      phone: '',
      address_line: '',
      landmark: '',
      delivery_instructions: '',
    })

    setShowForm(true)
  }

  function openEditForm(address: Address) {
    setEditingAddress(address)

    reset({
      state: 'Lagos',
      city: address.city ?? '',
      full_name: address.full_name ?? '',
      phone: address.phone ?? '',
      address_line: address.address_line ?? '',
      landmark: address.landmark ?? '',
      delivery_instructions:
        address.delivery_instructions ?? '',
    })

    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingAddress(null)

    reset({
      state: 'Lagos',
      city: '',
      full_name: '',
      phone: '',
      address_line: '',
      landmark: '',
      delivery_instructions: '',
    })
  }

  async function onSubmit(values: AddressFormValues) {
    if (!user) return

    setIsSaving(true)

    try {
      const address = await upsertAddress({
        ...values,
        ...(editingAddress?.id
          ? { id: editingAddress.id }
          : {}),
        customer_id: user.id,
        is_default: editingAddress
          ? editingAddress.is_default
          : !addresses?.length,
      })

      await queryClient.invalidateQueries({
        queryKey: ['addresses', user.id],
      })

      setShowForm(false)
      setEditingAddress(null)

      onNext(address)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(address: Address) {
    if (!user || !address.id) return

    const confirmed = window.confirm(
      `Delete the address for ${address.full_name}?\n\nThis action cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingAddressId(address.id)

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', address.id)
        .eq('customer_id', user.id)

      if (error) {
        throw error
      }

      await queryClient.invalidateQueries({
        queryKey: ['addresses', user.id],
      })
    } finally {
      setDeletingAddressId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
              />
              <circle cx="12" cy="11" r="2.5" />
            </svg>
          </span>

          Delivery details
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-ink-900">
          Where should we deliver?
        </h2>

        <p className="max-w-xl text-sm leading-6 text-ink-500">
          Enter your Lagos delivery address. We’ll use your LGA
          to calculate the delivery fee automatically.
        </p>
      </div>

      {/* Saved addresses */}
      {hasAddresses && !showForm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">
                Saved addresses
              </h3>

              <p className="mt-0.5 text-xs text-ink-500">
                Select an address to continue
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              + Add new
            </button>
          </div>

          <div className="space-y-3">
            {addresses.map((addr) => {
              const isDeleting =
                deletingAddressId === addr.id

              return (
                <Card
                  key={addr.id}
                  className="overflow-hidden border-ink-900/10 transition-all duration-200 hover:border-brand-300 hover:shadow-sm"
                >
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-5">
                      {/* Location icon */}
                      <button
                        type="button"
                        onClick={() => onNext(addr)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 transition-colors hover:bg-brand-500/15"
                        aria-label="Select address"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
                          />
                          <circle
                            cx="12"
                            cy="11"
                            r="2.5"
                          />
                        </svg>
                      </button>

                      {/* Address details */}
                      <button
                        type="button"
                        onClick={() => onNext(addr)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-ink-900">
                                {addr.full_name}
                              </p>

                              {addr.is_default && (
                                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm leading-5 text-ink-700">
                              {addr.address_line}
                            </p>

                            <p className="mt-1 text-sm text-ink-500">
                              {addr.city}, {addr.state}
                            </p>
                          </div>

                          <span className="mt-1 shrink-0 text-ink-300">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-5 w-5"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                          <span>{addr.phone}</span>

                          {addr.landmark && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-ink-300" />

                              <span>
                                Landmark: {addr.landmark}
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Address actions */}
                    <div className="flex items-center justify-end gap-2 border-t border-ink-900/5 bg-ink-900/[0.015] px-5 py-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(addr)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-900/5 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-3.5 w-3.5"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 20h9"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
                          />
                        </svg>

                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(addr)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/5 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <svg
                            className="h-3.5 w-3.5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              className="opacity-25"
                              stroke="currentColor"
                              strokeWidth="3"
                            />

                            <path
                              d="M21 12a9 9 0 00-9-9"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-3.5 w-3.5"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 6h18"
                            />

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 6V4h8v2M19 6l-1 15H6L5 6"
                            />

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 11v6M14 11v6"
                            />
                          </svg>
                        )}

                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-ink-900/5" />
          <div className="h-28 animate-pulse rounded-xl bg-ink-900/5" />
          <div className="h-28 animate-pulse rounded-xl bg-ink-900/5" />
        </div>
      )}

      {/* Form */}
      {(showForm || !hasAddresses) && !isLoading && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {showForm && hasAddresses && (
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 18l-6-6 6-6"
                />
              </svg>

              Back to saved addresses
            </button>
          )}

          <Card className="border-ink-900/10 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
                      />

                      <circle
                        cx="12"
                        cy="11"
                        r="2.5"
                      />
                    </svg>
                  </div>

                  <h3 className="font-semibold text-ink-900">
                    {editingAddress
                      ? 'Edit address'
                      : hasAddresses
                        ? 'Add a new address'
                        : 'Delivery address'}
                  </h3>
                </div>

                <p className="mt-2 text-sm text-ink-500">
                  {editingAddress
                    ? 'Update your delivery details below.'
                    : 'Make sure the address is detailed enough for easy delivery.'}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full Name"
                  error={
                    formState.errors.full_name?.message
                  }
                >
                  <Input
                    {...register('full_name')}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </Field>

                <Field
                  label="Phone Number"
                  error={formState.errors.phone?.message}
                >
                  <Input
                    {...register('phone')}
                    placeholder="e.g. 08012345678"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </Field>

                <Field
                  label="Delivery Address"
                  error={
                    formState.errors.address_line?.message
                  }
                  className="sm:col-span-2"
                  hint="Include your street, estate, house number and other useful details."
                >
                  <textarea
                    {...register('address_line')}
                    rows={3}
                    placeholder="e.g. No 2 Adekunle Yekinni Street, Peculiar Estate, Igboolomu, Agric"
                    className="flex w-full resize-none rounded-md border border-ink-900/10 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </Field>

                <Field
                  label="City / LGA"
                  error={formState.errors.city?.message}
                  hint="Used to calculate your delivery fee."
                >
                  <select
                    {...register('city')}
                    className="flex h-10 w-full appearance-none rounded-md border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">
                      Select your LGA
                    </option>

                    {LAGOS_LGAS.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="State"
                  error={formState.errors.state?.message}
                >
                  <div className="relative">
                    <Input
                      value="Lagos"
                      readOnly
                      disabled
                      className="cursor-not-allowed bg-ink-900/5 pr-10"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 10.5V7a2 2 0 00-2-2h-2.5"
                        />
                      </svg>
                    </span>
                  </div>

                  <input
                    type="hidden"
                    {...register('state')}
                    value="Lagos"
                    readOnly
                  />
                </Field>

                <Field label="Landmark" optional>
                  <Input
                    {...register('landmark')}
                    placeholder="e.g. Near the filling station"
                  />
                </Field>

                <Field
                  label="Delivery Instructions"
                  optional
                  className="sm:col-span-2"
                >
                  <Input
                    {...register('delivery_instructions')}
                    placeholder="e.g. Call me when you arrive"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {showForm && hasAddresses ? (
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={isSaving}
                className="h-11 w-full sm:w-auto"
              >
                Cancel
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 w-full sm:w-auto sm:min-w-44"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className="opacity-25"
                      stroke="currentColor"
                      strokeWidth="3"
                    />

                    <path
                      d="M21 12a9 9 0 00-9-9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>

                  Saving...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  {editingAddress
                    ? 'Save Changes'
                    : 'Save & Continue'}

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14M13 6l6 6-6 6"
                    />
                  </svg>
                </span>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function Field({
  label,
  error,
  className,
  hint,
  optional = false,
  children,
}: {
  label: string
  error?: string
  className?: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <Label className="text-sm font-medium text-ink-800">
          {label}
        </Label>

        {optional && (
          <span className="text-xs text-ink-400">
            Optional
          </span>
        )}
      </div>

      {children}

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-5 text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}