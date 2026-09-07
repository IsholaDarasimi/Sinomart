# Changelog

## Fix: product queries returning HTTP 400 (PGRST200)

**Symptom:** every product-listing query (homepage rails, shop/PLP, category pages,
related products, PDP) returned HTTP 400 against the live Supabase project, even though
the same query shapes had appeared to work in local testing.

**Root cause — found by inspecting the schema and reproducing the exact failing queries,
not by guessing:**

1. **`product_stock_badge` was embedded as a nested PostgREST resource** (e.g.
   `products?select=...,product_stock_badge(stock_label,...)`). `product_stock_badge` is a
   **view over another view** (`product_stock_badge` → `inventory_available` → `inventory`
   — see `database/migrations/005_inventory.sql` and `017_rls_policies.sql`). PostgREST can
   only auto-detect embeddable relationships by tracing real foreign-key constraints, and
   its ability to trace a relationship through two layers of views back to a table's real
   FK is inconsistent across PostgREST versions/configurations. This is exactly the
   `PGRST200: Could not find a relationship between 'products' and 'product_stock_badge' in
   the schema cache` error, returned as HTTP 400.

2. **Category filtering used a double-nested inner-join embed with a two-level dot-path
   filter**: `product_categories!inner(categories!inner(slug))` combined with
   `.eq('product_categories.categories.slug', ...)`. This is a much less universally
   reliable PostgREST query shape than a single-level embed filtered on an indexed FK
   column.

`product_images` and `product_rating_aggregates` were **not** affected — both are real
tables with a direct foreign key to `products.id` (migrations `004` and `010`), so
embedding those was always safe and required no change.

**Fix (`src/services/products.ts`):**

- `product_stock_badge` is no longer embedded. Every product-fetching function now:
  1. queries `products` (with `product_images` / `product_rating_aggregates` embedded, as
     before — both safe),
  2. collects the resulting product ids,
  3. fetches stock badges with one **flat, non-embedded** query:
     `product_stock_badge?product_id=in.(...)&variant_id=is.null`,
  4. merges the two client-side (`toCardData` / `mapCardRows`).
- Category filtering now resolves the slug to a `category_id` first (via the existing
  `getCategoryBySlug`), then uses a **single-level** `product_categories!inner(category_id)`
  embed with a flat `.eq('product_categories.category_id', categoryId)` filter — no nested
  embed, no dot-path filtering through two relationship levels.

**Verified, not just changed:** every rewritten query shape was re-run against a real,
migrated, seeded PostgREST instance and confirmed to return `200`, including the
`count=exact` pagination header (`Content-Range: 0-5/11`) for the category-filtered case.
The full pipeline (category resolve → product fetch → stock-badge fetch → client-side
merge) was also exercised end-to-end through the actual `@supabase/supabase-js` client,
not just via raw `curl`.

**Surfaces covered by this fix** (all route through the same `src/services/products.ts`
functions, so all were fixed together): featured products, best sellers, new arrivals,
discounted products, shop/all products, category pages, subcategory pages, search results
(shares the `listProducts` path via the `search` filter), related products /
recommendations, and the product detail page. Admin product management
(`src/services/admin/products.ts`) was unaffected — it embeds the real `inventory` table
directly, not the `product_stock_badge` view chain.
