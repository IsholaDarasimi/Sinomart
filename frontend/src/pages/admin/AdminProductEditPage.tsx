import * as React from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import { useForm } from 'react-hook-form'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

import * as productsApi from '@/services/admin/products'

import { getCategoryTree } from '@/services/categories'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

import { Label, Textarea } from '@/components/ui/input'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { useToast } from '@/components/ui/toast'

import { slugify } from '@/lib/utils'

interface ProductFormValues {
  name: string
  sku: string
  short_description: string
  description: string
  base_price: number
  compare_at_price?: number
  category_id: string
}

interface SpecificationRow {
  key: string
  value: string
}

interface ProductFeature {
  value: string
}

interface NewImagePreview {
  file: File
  url: string
}

export function AdminProductEditPage() {
  const { productId } = useParams<{ productId: string }>()

  const isNew = !productId || productId === 'new'

  const navigate = useNavigate()

  const { toast } = useToast()

  const queryClient = useQueryClient()

  const { data: categoryTree } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: getCategoryTree,
  })

  const {
    data: existingProduct,
    isLoading: isProductLoading,
  } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId!)
        .single()

      if (error) {
        throw error
      }

      return data
    },
    enabled: !isNew,
  })

  const { data: existingCategories } = useQuery({
    queryKey: ['admin-product-categories', productId],
    queryFn: async () => {
      if (!productId) {
        return []
      }

      const { data, error } = await supabase
        .from('product_categories')
        .select('category_id, is_primary')
        .eq('product_id', productId)

      if (error) {
        throw error
      }

      return data ?? []
    },
    enabled: !isNew,
  })

  const defaultCategoryId = React.useMemo(() => {
    if (!existingCategories?.length) {
      return ''
    }

    const primary = existingCategories.find(
      (item) => item.is_primary,
    )

    return (
      primary?.category_id ??
      existingCategories[0]?.category_id ??
      ''
    )
  }, [existingCategories])

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      sku: '',
      short_description: '',
      description: '',
      base_price: 0,
      compare_at_price: undefined,
      category_id: '',
    },
  })

  const [features, setFeatures] = React.useState<
    ProductFeature[]
  >([{ value: '' }])

  const [specifications, setSpecifications] =
    React.useState<SpecificationRow[]>([
      {
        key: '',
        value: '',
      },
    ])

  const [images, setImages] = React.useState<File[]>([])

  const [uploadedImages, setUploadedImages] =
    React.useState<string[]>([])

  const [stock, setStock] = React.useState(0)

  const [isSaving, setIsSaving] = React.useState(false)

  const [isUploadingImages, setIsUploadingImages] =
    React.useState(false)

  const [imagePreviews, setImagePreviews] =
    React.useState<NewImagePreview[]>([])

  /*
   * Load existing product data into the form.
   */
  React.useEffect(() => {
    if (!existingProduct) {
      return
    }

    reset({
      name: existingProduct.name,
      sku: existingProduct.sku,
      short_description:
        existingProduct.short_description ?? '',
      description: existingProduct.description ?? '',
      base_price: existingProduct.base_price,
      compare_at_price:
        existingProduct.compare_at_price ?? undefined,
      category_id: defaultCategoryId,
    })

    const existingFeatures = Array.isArray(
      existingProduct.features
    )
      ? existingProduct.features
      : []

    setFeatures(
      existingFeatures.length
        ? existingFeatures.map((feature: string) => ({
  value: feature,
}))
        : [{ value: '' }],
    )

    const existingSpecs =
      existingProduct.specifications &&
      typeof existingProduct.specifications === 'object'
        ? Object.entries(
            existingProduct.specifications,
          ).map(([key, value]) => ({
            key,
            value:
              typeof value === 'string'
                ? value
                : JSON.stringify(value),
          }))
        : []

    setSpecifications(
      existingSpecs.length
        ? existingSpecs
        : [
            {
              key: '',
              value: '',
            },
          ],
    )
  }, [
    existingProduct,
    defaultCategoryId,
    reset,
  ])

  /*
   * Load existing images and inventory.
   */
  React.useEffect(() => {
    if (!productId || isNew) {
      return
    }

    let cancelled = false

    async function loadProductMeta() {
  if (!productId) {
    throw new Error('Product ID is required')
  }

  const [
    { data: imageData, error: imageError },
    { data: inventoryData, error: inventoryError },
  ] = await Promise.all([
    supabase
      .from('product_images')
      .select('image_url, sort_order')
      .eq('product_id', productId)
      .order('sort_order', {
        ascending: true,
      }),
    supabase
      .from('inventory')
      .select('quantity_on_hand')
      .eq('product_id', productId)
      .maybeSingle(),
  ])

      if (cancelled) {
        return
      }

      if (imageError) {
        console.error(
          'Failed to load product images:',
          imageError,
        )
      }

      if (inventoryError) {
        console.error(
          'Failed to load inventory:',
          inventoryError,
        )
      }

      if (imageData?.length) {
        setUploadedImages(
          imageData
            .map((image) => image.image_url)
            .filter(
              (url): url is string =>
                Boolean(url),
            ),
        )
      } else {
        setUploadedImages([])
      }

      if (
        inventoryData?.quantity_on_hand != null
      ) {
        setStock(
          Math.max(
            0,
            Number(
              inventoryData.quantity_on_hand,
            ),
          ),
        )
      }
    }

    void loadProductMeta()

    return () => {
      cancelled = true
    }
  }, [productId, isNew])

  /*
   * Create preview URLs for newly selected images.
   */
  React.useEffect(() => {
    const previews = images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))

    setImagePreviews(previews)

    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url)
      })
    }
  }, [images])

  function addFeature() {
    setFeatures((current) => [
      ...current,
      {
        value: '',
      },
    ])
  }

  function removeFeature(index: number) {
    setFeatures((current) => {
      if (current.length === 1) {
        return [{ value: '' }]
      }

      return current.filter(
        (_, featureIndex) =>
          featureIndex !== index,
      )
    })
  }

  function updateFeature(
    index: number,
    value: string,
  ) {
    setFeatures((current) =>
      current.map(
        (feature, featureIndex) =>
          featureIndex === index
            ? {
                ...feature,
                value,
              }
            : feature,
      ),
    )
  }

  function addSpecification() {
    setSpecifications((current) => [
      ...current,
      {
        key: '',
        value: '',
      },
    ])
  }

  function removeSpecification(index: number) {
    setSpecifications((current) => {
      if (current.length === 1) {
        return [
          {
            key: '',
            value: '',
          },
        ]
      }

      return current.filter(
        (_, specificationIndex) =>
          specificationIndex !== index,
      )
    })
  }

  function updateSpecification(
    index: number,
    field: keyof SpecificationRow,
    value: string,
  ) {
    setSpecifications((current) =>
      current.map(
        (
          specification,
          specificationIndex,
        ) =>
          specificationIndex === index
            ? {
                ...specification,
                [field]: value,
              }
            : specification,
      ),
    )
  }

  function buildFeatures() {
    return features
      .map((feature) =>
        feature.value.trim(),
      )
      .filter(Boolean)
  }

  function buildSpecifications() {
    const result: Record<string, string> = {}

    specifications.forEach(
      ({ key, value }) => {
        const cleanKey = key.trim()

        const cleanValue = value.trim()

        if (cleanKey && cleanValue) {
          result[cleanKey] = cleanValue
        }
      },
    )

    return result
  }

  async function uploadSelectedImages(
    productIdToUse: string,
  ) {
    if (images.length === 0) {
      return
    }

    setIsUploadingImages(true)

    try {
      /*
       * Get the current number of images so
       * new images continue after them.
       */
      const existingImageRows =
        await productsApi.listProductImages(
          productIdToUse,
        )

      const startingSortOrder =
        existingImageRows.length

      const hasExistingPrimary =
        existingImageRows.some(
          (image) => image.is_primary,
        )

      /*
       * Upload each selected image.
       *
       * The first image becomes primary only when
       * the product doesn't already have a primary.
       */
      for (
        let index = 0;
        index < images.length;
        index += 1
      ) {
        const file = images[index]

        await productsApi.uploadAndCreateProductImage(
          {
            productId: productIdToUse,
            file,
            altText:
              existingProduct?.name ??
              undefined,
            sortOrder:
              startingSortOrder + index,
            isPrimary:
              !hasExistingPrimary &&
              index === 0,
          },
        )
      }

      setImages([])

      toast({
        title: 'Images uploaded',
        description: `${images.length} image${images.length === 1 ? '' : 's'} added to the product.`,
        variant: 'success',
      })

      const refreshedImages =
        await productsApi.listProductImages(
          productIdToUse,
        )

      setUploadedImages(
        refreshedImages
          .sort(
            (a, b) =>
              a.sort_order -
              b.sort_order,
          )
          .map(
            (image) =>
              image.image_url,
          )
          .filter(
            (url): url is string =>
              Boolean(url),
          ),
      )
    } finally {
      setIsUploadingImages(false)
    }
  }

  async function saveProduct(
    values: ProductFormValues,
  ) {
    const cleanedFeatures =
      buildFeatures()

    const cleanedSpecifications =
      buildSpecifications()

    if (!values.name.trim()) {
      throw new Error(
        'Product name is required.',
      )
    }

    if (!values.sku.trim()) {
      throw new Error(
        'SKU is required.',
      )
    }

    if (!values.category_id) {
      throw new Error(
        'Please select a category.',
      )
    }

    if (
      Number(values.base_price) <= 0
    ) {
      throw new Error(
        'Base price must be greater than ₦0.',
      )
    }

    if (
      values.compare_at_price != null &&
      Number(values.compare_at_price) > 0 &&
      Number(values.compare_at_price) <=
        Number(values.base_price)
    ) {
      throw new Error(
        'Compare-at price should be higher than the selling price.',
      )
    }

    /*
     * ----------------------------------------------------
     * CREATE NEW PRODUCT
     * ----------------------------------------------------
     */
    if (isNew) {
      const id =
        await productsApi.createProductDraft(
          {
            name: values.name.trim(),
            slug: slugify(values.name),
            sku: values.sku.trim(),
            brandId: null,
            shortDescription:
              values.short_description.trim(),
            description:
              values.description.trim(),
            basePrice:
              Number(values.base_price),
            compareAtPrice:
              values.compare_at_price &&
              Number(
                values.compare_at_price,
              ) > 0
                ? Number(
                    values.compare_at_price,
                  )
                : null,
            categoryIds: [
              values.category_id,
            ],
            primaryCategoryId:
              values.category_id,
          },
        )

      const {
        error: productUpdateError,
      } = await supabase
        .from('products')
        .update({
          features: cleanedFeatures,
          specifications:
            cleanedSpecifications,
        })
        .eq('id', id)

      if (productUpdateError) {
        throw productUpdateError
      }

      /*
       * Create the default purchase option.
       */
      const {
        error: purchaseOptionError,
      } = await supabase
        .from('purchase_options')
        .insert({
          product_id: id,
          name: '1 Piece',
          unit_type: 'piece',
          units_per_purchase: 1,
          price:
            Number(values.base_price),
          compare_at_price:
            values.compare_at_price &&
            Number(
              values.compare_at_price,
            ) > 0
              ? Number(
                  values.compare_at_price,
                )
              : null,
          is_default: true,
          is_active: true,
        })

      if (purchaseOptionError) {
        throw purchaseOptionError
      }

      /*
       * Create inventory.
       */
      const {
        error: inventoryError,
      } = await supabase
        .from('inventory')
        .insert({
          product_id: id,
          quantity_on_hand:
            Math.max(
              0,
              Number(stock),
            ),
          quantity_reserved: 0,
        })

      if (inventoryError) {
        throw inventoryError
      }

      /*
       * Upload newly selected images.
       */
      if (images.length > 0) {
        await uploadSelectedImages(id)
      }

      toast({
        title: 'Product created as draft',
        description:
          'The product and its setup have been saved.',
        variant: 'success',
      })

      queryClient.invalidateQueries({
        queryKey: [
          'admin-products',
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          'admin-product',
          id,
        ],
      })

      navigate(
        `/admin/products/${id}`,
      )

      return
    }

    /*
     * ----------------------------------------------------
     * UPDATE EXISTING PRODUCT
     * ----------------------------------------------------
     */
    if (!productId) {
      return
    }

    const {
      error: productError,
    } = await supabase
      .from('products')
      .update({
        name: values.name.trim(),
        slug: slugify(values.name),
        sku: values.sku.trim(),
        short_description:
          values.short_description.trim() ||
          null,
        description:
          values.description.trim() ||
          null,
        base_price:
          Number(values.base_price),
        compare_at_price:
          values.compare_at_price &&
          Number(
            values.compare_at_price,
          ) > 0
            ? Number(
                values.compare_at_price,
              )
            : null,
        features:
          cleanedFeatures,
        specifications:
          cleanedSpecifications,
      })
      .eq('id', productId)

    if (productError) {
      throw productError
    }

    /*
     * Keep the selected category as the
     * primary category.
     */
    const {
      error: categoryDeleteError,
    } = await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId)

    if (categoryDeleteError) {
      throw categoryDeleteError
    }

    const {
      error: categoryInsertError,
    } = await supabase
      .from('product_categories')
      .insert({
        product_id: productId,
        category_id:
          values.category_id,
        is_primary: true,
      })

    if (categoryInsertError) {
      throw categoryInsertError
    }

    /*
     * Upload any newly selected images.
     */
    if (images.length > 0) {
      await uploadSelectedImages(
        productId,
      )
    }

    /*
     * Update inventory.
     */
    const {
      data: currentInventory,
      error: inventoryLookupError,
    } = await supabase
      .from('inventory')
      .select('id')
      .eq('product_id', productId)
      .maybeSingle()

    if (inventoryLookupError) {
      throw inventoryLookupError
    }

    if (currentInventory?.id) {
      const { error } =
        await supabase
          .from('inventory')
          .update({
            quantity_on_hand:
              Math.max(
                0,
                Number(stock),
              ),
          })
          .eq(
            'id',
            currentInventory.id,
          )

      if (error) {
        throw error
      }
    } else {
      const { error } =
        await supabase
          .from('inventory')
          .insert({
            product_id:
              productId,
            quantity_on_hand:
              Math.max(
                0,
                Number(stock),
              ),
            quantity_reserved: 0,
          })

      if (error) {
        throw error
      }
    }

    toast({
      title: 'Product saved',
      description:
        'Your product changes have been saved.',
      variant: 'success',
    })

    queryClient.invalidateQueries({
      queryKey: [
        'admin-product',
        productId,
      ],
    })

    queryClient.invalidateQueries({
      queryKey: [
        'admin-products',
      ],
    })
  }

  async function onSubmit(
    values: ProductFormValues,
  ) {
    setIsSaving(true)

    try {
      await saveProduct(values)
    }catch (err) {
  console.error('SAVE PRODUCT ERROR:', err)

  toast({
    title: isNew
      ? 'Could not create product'
      : 'Could not save product',
    description:
      err instanceof Error
        ? err.message
        : JSON.stringify(err),
    variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleActivate() {
    if (!productId) {
      return
    }

    try {
      await productsApi.activateProduct(
        productId,
      )

      toast({
        title: 'Product activated',
        description:
          'The product is now live in the store.',
        variant: 'success',
      })

      queryClient.invalidateQueries({
        queryKey: [
          'admin-product',
          productId,
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          'admin-products',
        ],
      })
    } catch (err) {
      toast({
        title: 'Cannot activate yet',
        description:
          err instanceof Error
            ? err.message
            : 'The product is missing required information.',
        variant: 'error',
      })
    }
  }

  if (
    !isNew &&
    isProductLoading
  ) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="h-7 w-48 animate-pulse rounded bg-ink-900/10" />

        <div className="h-64 animate-pulse rounded-xl bg-ink-900/10" />

        <div className="h-48 animate-pulse rounded-xl bg-ink-900/10" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            Products
          </p>

          <h1 className="mt-1 text-2xl font-bold text-ink-900">
            {isNew
              ? 'New Product'
              : existingProduct?.name ??
                'Edit Product'}
          </h1>

          {!isNew &&
            existingProduct && (
              <p className="mt-1 text-sm text-ink-500">
                SKU:{' '}
                {existingProduct.sku}{' '}
                · Status:{' '}
                <span className="font-medium capitalize text-ink-700">
                  {
                    existingProduct.status
                  }
                </span>
              </p>
            )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            navigate(
              '/admin/products',
            )
          }
        >
          Back to Products
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(
          onSubmit,
        )}
        className="space-y-4"
      >
        {/* Basic Information */}
        <Card>
          <CardHeader className="border-b border-ink-900/10 py-4">
            <CardTitle className="text-base">
              Basic Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-4">
            <div>
              <Label>
                Product Name
              </Label>

              <Input
                {...register('name', {
                  required: true,
                })}
                placeholder="e.g. Samsung Galaxy A15"
              />
            </div>

            <div>
              <Label>
                SKU
              </Label>

              <Input
                {...register('sku', {
                  required: true,
                })}
                placeholder="e.g. SAM-A15-128"
              />
            </div>

            <div>
              <Label>
                Category
              </Label>

              <select
                {...register(
                  'category_id',
                  {
                    required: true,
                  },
                )}
                className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                <option value="">
                  Select a category
                </option>

                {(
                  categoryTree ?? []
                ).map(
                  (category) => (
                    <React.Fragment
                      key={
                        category.id
                      }
                    >
                      <option
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>

                      {category.children?.map(
                        (
                          subcategory,
                        ) => (
                          <option
                            key={
                              subcategory.id
                            }
                            value={
                              subcategory.id
                            }
                          >
                            └{' '}
                            {
                              subcategory.name
                            }
                          </option>
                        ),
                      )}
                    </React.Fragment>
                  ),
                )}
              </select>
            </div>

            <div>
              <Label>
                Short Description
              </Label>

              <Textarea
                {...register(
                  'short_description',
                )}
                rows={3}
                placeholder="A short summary customers can quickly understand."
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="border-b border-ink-900/10 py-4">
            <CardTitle className="text-base">
              Pricing
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>
                  Base Price (₦)
                </Label>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(
                    'base_price',
                    {
                      required: true,
                      valueAsNumber: true,
                    },
                  )}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>
                  Compare-at Price (₦)
                </Label>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(
                    'compare_at_price',
                    {
                      valueAsNumber: true,
                    },
                  )}
                  placeholder="Optional"
                />

                <p className="mt-1 text-xs text-ink-500">
                  Used to show the original
                  price and discount.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specification */}
        <Card>
          <CardHeader className="border-b border-ink-900/10 py-4">
            <CardTitle className="text-base">
              Specification
            </CardTitle>

            <p className="mt-0.5 text-xs text-ink-500">
              Quick selling points and
              technical facts.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 p-4">
            {/* Key Features */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">
                    Key Features
                  </h3>

                  <p className="text-xs text-ink-500">
                    Short benefits customers
                    can scan quickly.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    addFeature
                  }
                >
                  + Add Feature
                </Button>
              </div>

              <div className="space-y-2">
                {features.map(
                  (
                    feature,
                    index,
                  ) => (
                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                        {index + 1}
                      </div>

                      <Input
                        value={
                          feature.value
                        }
                        onChange={(
                          event,
                        ) =>
                          updateFeature(
                            index,
                            event.target
                              .value,
                          )
                        }
                        placeholder="e.g. 5000mAh battery"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeFeature(
                            index,
                          )
                        }
                        className="shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove feature"
                      >
                        ×
                      </button>
                    </div>
                  ),
                )}
              </div>
            </section>

            <div className="border-t border-ink-900/10" />

            {/* Specifications */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">
                    Specifications
                  </h3>

                  <p className="text-xs text-ink-500">
                    Technical facts such as
                    model, RAM, size, material
                    and dimensions.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    addSpecification
                  }
                >
                  + Add Specification
                </Button>
              </div>

              <div className="space-y-2">
                {specifications.map(
                  (
                    specification,
                    index,
                  ) => (
                    <div
                      key={index}
                      className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] gap-2"
                    >
                      <Input
                        value={
                          specification.key
                        }
                        onChange={(
                          event,
                        ) =>
                          updateSpecification(
                            index,
                            'key',
                            event.target
                              .value,
                          )
                        }
                        placeholder="Specification"
                      />

                      <Input
                        value={
                          specification.value
                        }
                        onChange={(
                          event,
                        ) =>
                          updateSpecification(
                            index,
                            'value',
                            event.target
                              .value,
                          )
                        }
                        placeholder="Value"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeSpecification(
                            index,
                          )
                        }
                        className="rounded-lg px-2.5 text-sm font-medium text-ink-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove specification"
                      >
                        ×
                      </button>
                    </div>
                  ),
                )}
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader className="border-b border-ink-900/10 py-4">
            <CardTitle className="text-base">
              Description
            </CardTitle>

            <p className="text-xs text-ink-500">
              Give customers the complete
              product story, use cases,
              benefits and important details.
            </p>
          </CardHeader>

          <CardContent className="p-4">
            <Textarea
              {...register(
                'description',
              )}
              rows={9}
              placeholder="Write the full product description..."
              className="resize-y"
            />

            <p className="mt-1 text-xs text-ink-500">
              This is separate from Key
              Features and Specifications.
            </p>
          </CardContent>
        </Card>

        {/* Media & Inventory */}
        <Card>
          <CardHeader className="border-b border-ink-900/10 py-4">
            <CardTitle className="text-base">
              Media & Inventory
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 p-4">
            {/* Images */}
            {/* Images */}
<div>
  <div className="mb-2 flex items-center justify-between gap-3">
    <div>
      <Label>Product Images</Label>
      <p className="mt-0.5 text-xs text-ink-500">
        Upload product photos. The first image will be used as the primary image
        when the product has no existing primary image.
      </p>
    </div>

    {images.length > 0 && (
      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
        {images.length} selected
      </span>
    )}
  </div>

  {/* Upload Area */}
  <label
    htmlFor="product-image-upload"
    className="group mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40"
  >
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition group-hover:ring-brand-200">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6 text-ink-500 transition group-hover:text-brand-600"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 16V4m0 0L8 8m4-4 4 4M5 20h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1m-10 0H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2Z"
        />
      </svg>
    </div>

    <p className="text-sm font-semibold text-ink-900">
      Click to upload product images
    </p>

    <p className="mt-1 text-xs text-ink-500">
      PNG, JPG, WEBP or GIF • You can select multiple images
    </p>

    <span className="mt-4 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 shadow-sm transition group-hover:border-brand-200 group-hover:text-brand-700">
      Choose Images
    </span>

    <Input
      id="product-image-upload"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      multiple
      className="sr-only"
      onChange={(event) => {
        const selectedFiles = Array.from(
          event.target.files ?? [],
        )

        if (selectedFiles.length === 0) {
          return
        }

        setImages((current) => [
          ...current,
          ...selectedFiles,
        ])

        /*
         * Reset the input so selecting the same
         * file again still triggers onChange.
         */
        event.target.value = ''
      }}
    />
  </label>

  {/* Newly Selected Images */}
  {imagePreviews.length > 0 && (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-ink-700">
            New Images
          </p>
          <p className="text-xs text-ink-500">
            These images will be uploaded when you save.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setImages([])}
          className="text-xs font-medium text-red-500 transition hover:text-red-600"
        >
          Remove all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {imagePreviews.map((preview, index) => (
          <div
            key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <img
              src={preview.url}
              alt={preview.file.name}
              className="h-32 w-full object-cover"
            />

            {/* Primary Badge */}
            {index === 0 && uploadedImages.length === 0 && (
              <div className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                Primary
              </div>
            )}

            {/* Remove Image */}
            <button
              type="button"
              onClick={() => {
                setImages((current) =>
                  current.filter(
                    (_, imageIndex) =>
                      imageIndex !== index,
                  ),
                )
              }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm text-white opacity-0 backdrop-blur-sm transition hover:bg-red-600 group-hover:opacity-100"
              aria-label={`Remove ${preview.file.name}`}
            >
              ×
            </button>

            {/* File Name */}
            <div className="border-t border-slate-100 px-2.5 py-2">
              <p
                className="truncate text-xs font-medium text-ink-700"
                title={preview.file.name}
              >
                {preview.file.name}
              </p>

              <p className="mt-0.5 text-[10px] text-ink-400">
                {(preview.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Existing Images */}
  {uploadedImages.length > 0 && (
    <div className="mt-6">
      <div className="mb-2">
        <p className="text-xs font-semibold text-ink-700">
          Existing Images
        </p>
        <p className="text-xs text-ink-500">
          Images already saved to this product.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {uploadedImages.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <img
              src={url}
              alt={`${existingProduct?.name ?? 'Product'} image ${index + 1}`}
              className="h-32 w-full object-cover"
            />

            {index === 0 && (
              <div className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                Primary
              </div>
            )}

            <div className="border-t border-slate-100 px-2.5 py-2">
              <p className="text-xs font-medium text-ink-700">
                Image {index + 1}
              </p>

              <p className="text-[10px] text-ink-400">
                Already uploaded
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>

            {/* Stock */}
            <div className="max-w-xs">
              <Label>
                Stock Quantity
              </Label>

              <Input
                type="number"
                min="0"
                value={stock}
                onChange={(event) =>
                  setStock(
                    Math.max(
                      0,
                      Number(
                        event.target
                          .value,
                      ),
                    ),
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex flex-col-reverse gap-2 border-t border-ink-900/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-500">
            {isNew
              ? 'The product will be created as a draft.'
              : 'Changes are saved immediately to the product.'}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  '/admin/products',
                )
              }
              disabled={
                isSaving ||
                isSubmitting ||
                isUploadingImages
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                isSaving ||
                isSubmitting ||
                isUploadingImages
              }
            >
              {isUploadingImages
                ? 'Uploading images...'
                : isSaving ||
                    isSubmitting
                  ? 'Saving...'
                  : isNew
                    ? 'Create as Draft'
                    : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>

      {/* Publish */}
      {!isNew &&
        existingProduct?.status !==
          'active' && (
          <Card>
            <CardHeader className="border-b border-ink-900/10 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    Publish
                  </CardTitle>

                  <p className="mt-0.5 text-xs text-ink-500">
                    Make this product
                    visible to customers.
                  </p>
                </div>

                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">
                  {
                    existingProduct?.status
                  }
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm text-ink-700">
                Activation requires the
                product to have the required
                image, category, purchase
                option and inventory setup.
              </p>

              <Button
                type="button"
                onClick={
                  handleActivate
                }
                className="shrink-0"
              >
                Activate Product
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  )
}