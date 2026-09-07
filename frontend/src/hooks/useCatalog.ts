import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import * as productsApi from '@/services/products'
import * as categoriesApi from '@/services/categories'
import * as cartApi from '@/services/cart'

import { useAuth } from '@/context/AuthProvider'

import type { ProductFilters } from '@/types/domain'

export function useProductList(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.listProducts(filters),
  })
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getProductBySlug(slug!),
    enabled: !!slug,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getFeaturedProducts(),
  })
}

export function useBestSellers() {
  return useQuery({
    queryKey: ['products', 'best-sellers'],
    queryFn: () => productsApi.getBestSellers(),
  })
}

export function useNewArrivals() {
  return useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productsApi.getNewArrivals(),
  })
}

export function useDiscountedProducts() {
  return useQuery({
    queryKey: ['products', 'discounted'],
    queryFn: () => productsApi.getDiscountedProducts(),
  })
}

export function useRecommendedProducts(productId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'recommended', productId],
    queryFn: () => productsApi.getRecommendedProducts(productId!, 'related'),
    enabled: !!productId,
  })
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: categoriesApi.getCategoryTree,
    staleTime: 5 * 60_000,
  })
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getCategoryBySlug(slug!),
    enabled: !!slug,
  })
}

// ---------- CART ----------

export function useCart() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const cartIdQuery = useQuery({
    queryKey: ['cart-id', user?.id ?? 'guest'],

    queryFn: () => cartApi.getOrCreateCart(user?.id ?? null),

    // A cart ID should not be refetched unnecessarily.
    // The cart itself should remain persistent until an item is
    // explicitly removed or successfully purchased.
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const itemsQuery = useQuery({
    queryKey: ['cart-items', cartIdQuery.data],

    queryFn: () => cartApi.getCartItems(cartIdQuery.data!),

    enabled: !!cartIdQuery.data,

    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  function invalidate() {
    queryClient.invalidateQueries({
      queryKey: ['cart-items', cartIdQuery.data],
    })
  }

  const addItem = useMutation({
    mutationFn: (params: {
      productId: string
      variantId: string | null
      purchaseOptionId: string
      quantity: number
    }) =>
      cartApi.addCartItem({
        cartId: cartIdQuery.data!,
        ...params,
      }),

    onSuccess: invalidate,
  })

  const updateQuantity = useMutation({
    mutationFn: (params: {
      cartItemId: string
      quantity: number
    }) =>
      cartApi.updateCartItemQuantity(
        params.cartItemId,
        params.quantity,
      ),

    onSuccess: invalidate,
  })

  const removeItem = useMutation({
    mutationFn: (cartItemId: string) =>
      cartApi.removeCartItem(cartItemId),

    onSuccess: invalidate,
  })

  const items = itemsQuery.data ?? []

  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  )

  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  return {
    cartId: cartIdQuery.data,
    items,

    isLoading:
      cartIdQuery.isLoading ||
      itemsQuery.isLoading,

    subtotal,
    itemCount,

    addItem,
    updateQuantity,
    removeItem,
  }
}