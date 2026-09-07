import { supabase } from '@/lib/supabase'

import type { Product } from '@/types/domain'

export interface AdminProductRow extends Product {
  brands: { name: string } | null

  inventory:
    | Array<{
        quantity_on_hand: number
        quantity_reserved: number
      }>
    | null
}

export interface AdminProductImage {
  id: string
  product_id: string
  variant_id: string | null
  storage_path: string | null
  image_url: string | null
  alt_text: string | null
  is_primary: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export async function listAdminProducts(params: {
  search?: string
  status?: Product['status']
  page?: number
  pageSize?: number
}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 25

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products')
    .select(
      '*, brands(name), inventory(quantity_on_hand, quantity_reserved)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) throw error

  return {
    items: (data ?? []) as unknown as AdminProductRow[],
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function updateProductStatus(
  productId: string,
  status: Product['status'],
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', productId)

  if (error) throw error
}

export async function toggleFeatureFlags(
  productId: string,
  flags: Partial<
    Pick<Product, 'is_featured' | 'is_new' | 'is_best_seller'>
  >,
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update(flags)
    .eq('id', productId)

  if (error) throw error
}

export async function updateProductInventory(
  productId: string,
  variantId: string | null,
  quantityOnHand: number,
  lowStockThreshold: number,
): Promise<void> {
  let query = supabase
    .from('inventory')
    .update({
      quantity_on_hand: quantityOnHand,
      low_stock_threshold: lowStockThreshold,
    })
    .eq('product_id', productId)

  query =
    variantId === null
      ? query.is('variant_id', null)
      : query.eq('variant_id', variantId)

  const { error } = await query

  if (error) throw error

  // NOTE: this direct update bypasses inventory_movements logging.
  // Production admin stock edits should instead go through an
  // fn_record_inventory_movement-backed RPC (manual_adjustment type)
  // once that RPC is exposed.
}

/* -------------------------------------------------------------------------- */
/* Product Images                                                             */
/* -------------------------------------------------------------------------- */

export async function listProductImages(
  productId: string,
): Promise<AdminProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []) as AdminProductImage[]
}

export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<{
  storagePath: string
  imageUrl: string
}> {
  const extension =
    file.name.split('.').pop()?.toLowerCase() || 'jpg'

  const safeExtension = extension.replace(/[^a-z0-9]/g, '')

  const fileName = `${crypto.randomUUID()}.${safeExtension}`

  const storagePath = `products/${productId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(storagePath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || undefined,
    })

  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(storagePath)

  if (!publicUrlData?.publicUrl) {
    await supabase.storage
      .from('product-images')
      .remove([storagePath])

    throw new Error('Could not generate the product image URL.')
  }

  return {
    storagePath,
    imageUrl: publicUrlData.publicUrl,
  }
}

export async function createProductImage(input: {
  productId: string
  storagePath: string
  imageUrl: string
  altText?: string | null
  sortOrder?: number
  isPrimary?: boolean
}): Promise<AdminProductImage> {
  /*
   * If this image becomes primary, clear the previous primary image first.
   */
  if (input.isPrimary) {
    const { error: primaryError } = await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', input.productId)

    if (primaryError) throw primaryError
  }

  const { data, error } = await supabase
    .from('product_images')
    .insert({
      product_id: input.productId,
      storage_path: input.storagePath,
      image_url: input.imageUrl,
      alt_text: input.altText ?? null,
      sort_order: input.sortOrder ?? 0,
      is_primary: input.isPrimary ?? false,
    })
    .select('*')
    .single()

  if (error) throw error

  return data as AdminProductImage
}

export async function uploadAndCreateProductImage(input: {
  productId: string
  file: File
  altText?: string | null
  sortOrder?: number
  isPrimary?: boolean
}): Promise<AdminProductImage> {
  const uploaded = await uploadProductImage(
    input.productId,
    input.file,
  )

  try {
    return await createProductImage({
      productId: input.productId,
      storagePath: uploaded.storagePath,
      imageUrl: uploaded.imageUrl,
      altText: input.altText,
      sortOrder: input.sortOrder,
      isPrimary: input.isPrimary,
    })
  } catch (error) {
    /*
     * If the database insert fails after the Storage upload,
     * clean up the orphaned Storage file.
     */
    await supabase.storage
      .from('product-images')
      .remove([uploaded.storagePath])

    throw error
  }
}

export async function updateProductImage(
  imageId: string,
  input: {
    altText?: string | null
    sortOrder?: number
  },
): Promise<void> {
  const updates: {
    alt_text?: string | null
    sort_order?: number
  } = {}

  if (input.altText !== undefined) {
    updates.alt_text = input.altText
  }

  if (input.sortOrder !== undefined) {
    updates.sort_order = input.sortOrder
  }

  if (Object.keys(updates).length === 0) {
    return
  }

  const { error } = await supabase
    .from('product_images')
    .update(updates)
    .eq('id', imageId)

  if (error) throw error
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  /*
   * Clear all current primary images for this product.
   */
  const { error: clearError } = await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  if (clearError) throw clearError

  /*
   * Set the selected image as primary.
   */
  const { error: setError } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId)

  if (setError) throw setError
}

export async function reorderProductImages(
  productId: string,
  imageIds: string[],
): Promise<void> {
  /*
   * Update every image's sort order based on its position
   * in the supplied array.
   */
  await Promise.all(
    imageIds.map((imageId, index) =>
      supabase
        .from('product_images')
        .update({ sort_order: index })
        .eq('id', imageId)
        .eq('product_id', productId),
    ),
  )
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  /*
   * Get the image first so we know which Storage file
   * needs to be removed.
   */
  const { data: image, error: fetchError } = await supabase
    .from('product_images')
    .select('storage_path, is_primary')
    .eq('id', imageId)
    .eq('product_id', productId)
    .single()

  if (fetchError) throw fetchError

  /*
   * Delete the database record first.
   */
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', productId)

  if (deleteError) throw deleteError

  /*
   * Remove the corresponding Storage object.
   */
  if (image.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('product-images')
      .remove([image.storage_path])

    if (storageError) {
      console.error(
        'Product image was deleted from the database but could not be removed from Storage:',
        storageError,
      )
    }
  }

  /*
   * If the deleted image was primary, promote the next
   * available image.
   */
  if (image.is_primary) {
    const { data: nextImage, error: nextImageError } =
      await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (nextImageError) throw nextImageError

    if (nextImage) {
      await setPrimaryProductImage(
        productId,
        nextImage.id,
      )
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Product Creation                                                           */
/* -------------------------------------------------------------------------- */

export async function createProductDraft(input: {
  name: string
  slug: string
  sku: string
  brandId: string | null
  shortDescription: string
  description: string
  basePrice: number
  compareAtPrice: number | null
  categoryIds: string[]
  primaryCategoryId: string
}): Promise<string> {
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      brand_id: input.brandId,
      short_description: input.shortDescription,
      description: input.description,
      base_price: input.basePrice,
      compare_at_price: input.compareAtPrice,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) throw error

  const categoryRows = input.categoryIds.map(
    (categoryId) => ({
      product_id: product.id,
      category_id: categoryId,
      is_primary:
        categoryId === input.primaryCategoryId,
    }),
  )

  if (categoryRows.length > 0) {
    const { error: catErr } = await supabase
      .from('product_categories')
      .insert(categoryRows)

    if (catErr) throw catErr
  }

  return product.id
}

export async function activateProduct(
  productId: string,
): Promise<void> {
  // Activating a product must make it publicly active as well as
  // changing its admin status.
  const { error } = await supabase
    .from('products')
    .update({
      status: 'active',
      is_active: true,
    })
    .eq('id', productId)

  if (error) throw error
}