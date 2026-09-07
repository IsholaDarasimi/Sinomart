import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import * as ordersApi from '@/services/orders'
import * as reviewsApi from '@/services/reviews'
import * as miscApi from '@/services/misc'

import { useAuth } from '@/context/AuthProvider'

import * as React from 'react'

export function useMyOrders() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => ordersApi.listMyOrders(user!.id),
    enabled: !!user,
  })
}

export function useOrderDetail(orderNumber: string | undefined) {
  const orderQuery = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => ordersApi.getOrderByNumber(orderNumber!),
    enabled: !!orderNumber,
  })

  const itemsQuery = useQuery({
    queryKey: ['order-items', orderQuery.data?.id],
    queryFn: () => ordersApi.getOrderItems(orderQuery.data!.id),
    enabled: !!orderQuery.data,
  })

  const historyQuery = useQuery({
    queryKey: ['order-history', orderQuery.data?.id],
    queryFn: () =>
      ordersApi.getOrderStatusHistory(orderQuery.data!.id),
    enabled: !!orderQuery.data,
  })

  return {
    order: orderQuery.data,
    items: itemsQuery.data ?? [],
    history: historyQuery.data ?? [],
    isLoading: orderQuery.isLoading,
  }
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.getProductReviews(productId!),
    enabled: !!productId,
  })
}

export function useReviewEligibility(
  productId: string | undefined,
) {
  const { user } = useAuth()

  return useQuery({
    queryKey: [
      'review-eligibility',
      productId,
      user?.id,
    ],
    queryFn: () =>
      reviewsApi.getEligibleReviewTarget(
        user!.id,
        productId!,
      ),
    enabled: !!productId && !!user,
  })
}

export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reviewsApi.submitReview,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['reviews', vars.productId],
      })

      queryClient.invalidateQueries({
        queryKey: ['review-eligibility', vars.productId],
      })
    },
  })
}

export function useSavedProducts() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['saved-products', user?.id],
    queryFn: () => miscApi.getSavedProducts(user!.id),
    enabled: !!user,
  })

  const toggle = useMutation({
    mutationFn: async ({
      productId,
      isSaved,
    }: {
      productId: string
      isSaved: boolean
    }) => {
      if (isSaved) {
        await miscApi.unsaveProduct(
          user!.id,
          productId,
        )
      } else {
        await miscApi.saveProduct(
          user!.id,
          productId,
        )
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['saved-products', user?.id],
      })
    },
  })

  return {
    ...query,
    toggle,
  }
}

export function useIsProductSaved(
  productId: string | undefined,
) {
  const { user } = useAuth()

  return useQuery({
    queryKey: [
      'is-saved',
      productId,
      user?.id,
    ],
    queryFn: () =>
      miscApi.isProductSaved(
        user!.id,
        productId!,
      ),
    enabled: !!user && !!productId,
  })
}

export function useSearchSuggestions(query: string) {
  const [debounced, setDebounced] =
    React.useState(query)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query)
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [query])

  const normalizedQuery = debounced
    .trim()
    .toLowerCase()

  return useQuery({
    queryKey: [
      'search-suggestions',
      normalizedQuery,
    ],

    queryFn: () =>
      miscApi.fetchSearchSuggestions(
        normalizedQuery,
      ),

    enabled: normalizedQuery.length >= 1,

    staleTime: 10_000,

    gcTime: 60_000,

    retry: 1,
  })
}