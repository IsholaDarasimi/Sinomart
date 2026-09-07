import * as React from 'react'

import { Link } from 'react-router-dom'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { Plus } from 'lucide-react'

import * as productsApi from '@/services/admin/products'

import { Input } from '@/components/ui/input'

import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'

import { useToast } from '@/components/ui/toast'

import { formatNaira } from '@/lib/utils'

import type { Product } from '@/types/domain'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_VARIANT: Record<
  string,
  'success' | 'secondary' | 'warning' | 'destructive'
> = {
  active: 'success',
  draft: 'secondary',
  archived: 'warning',
  out_of_stock: 'destructive',
}

export function AdminProductsPage() {
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<Product['status'] | undefined>(undefined)
  const [page, setPage] = React.useState(1)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, status, page],
    queryFn: () =>
      productsApi.listAdminProducts({
        search,
        status,
        page,
        pageSize: 20,
      }),
  })

  async function handleActivate(productId: string) {
    try {
      await productsApi.activateProduct(productId)

      toast({
        title: 'Product activated',
        variant: 'success',
      })

      queryClient.invalidateQueries({
        queryKey: ['admin-products'],
      })
    } catch (err) {
      toast({
        title: 'Cannot activate yet',
        description: (err as Error).message,
        variant: 'error',
      })
    }
  }

  async function handleArchive(productId: string) {
    try {
      await productsApi.updateProductStatus(productId, 'archived')

      toast({
        title: 'Product archived',
        variant: 'success',
      })

      queryClient.invalidateQueries({
        queryKey: ['admin-products'],
      })
    } catch (err) {
      toast({
        title: 'Cannot archive product',
        description: (err as Error).message,
        variant: 'error',
      })
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setStatus(
      value === 'all'
        ? undefined
        : (value as Product['status']),
    )
    setPage(1)
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">
          Products
        </h1>

        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="mr-1 h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={status ?? 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All statuses
            </SelectItem>

            <SelectItem value="active">
              Active
            </SelectItem>

            <SelectItem value="draft">
              Draft
            </SelectItem>

            <SelectItem value="archived">
              Archived
            </SelectItem>

            <SelectItem value="out_of_stock">
              Out of Stock
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products table */}
      <div className="overflow-x-auto rounded-xl border border-ink-900/8 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/8 text-left text-xs text-ink-500">
              <th className="p-3">
                Product
              </th>

              <th className="p-3">
                SKU
              </th>

              <th className="p-3">
                Price
              </th>

              <th className="p-3">
                Stock
              </th>

              <th className="p-3">
                Status
              </th>

              <th className="p-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-ink-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data?.items.length ? (
              data.items.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-ink-900/8 last:border-0"
                >
                  {/* Product */}
                  <td className="p-3">
                    <Link
                      to={`/admin/products/${p.id}`}
                      className="font-medium text-ink-900 hover:text-brand-600"
                    >
                      {p.name}
                    </Link>

                    <p className="text-xs text-ink-500">
                      {p.brands?.name}
                    </p>
                  </td>

                  {/* SKU */}
                  <td className="p-3 text-ink-700">
                    {p.sku}
                  </td>

                  {/* Price */}
                  <td className="p-3 text-ink-700">
                    {formatNaira(p.base_price)}
                  </td>

                  {/* Stock */}
                  <td className="p-3 text-ink-700">
                    {p.inventory?.[0]
                      ? p.inventory[0].quantity_on_hand -
                        p.inventory[0].quantity_reserved
                      : '—'}
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <Badge
                      variant={
                        STATUS_VARIANT[p.status] ?? 'secondary'
                      }
                    >
                      {p.status}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {/* View */}
                      {p.status === 'active' && p.slug && (
                        <Button
  asChild
  size="sm"
  variant="outline"
>
  <Link to={`/product/${p.slug}`}>
    View
  </Link>
</Button>
                      )}

                      {/* Edit */}
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                      >
                        <Link
                          to={`/admin/products/${p.id}`}
                        >
                          Edit
                        </Link>
                      </Button>

                      {/* Activate */}
                      {p.status !== 'active' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleActivate(p.id)
                          }
                        >
                          Activate
                        </Button>
                      )}

                      {/* Archive */}
                      {p.status !== 'archived' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleArchive(p.id)
                          }
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-ink-500"
                >
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            Previous
          </Button>

          <span className="text-sm text-ink-500">
            Page {page} of {totalPages}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => p + 1)
            }
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}