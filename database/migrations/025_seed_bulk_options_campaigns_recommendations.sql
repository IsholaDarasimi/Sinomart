-- =====================================================================================
-- 025_seed_bulk_options_campaigns_recommendations.sql
-- Demonstrates: (a) products with MULTIPLE purchase options (piece + pack + dozen),
-- (b) campaign-product assignment, (c) manual/related product recommendations.
-- =====================================================================================

-- ---------- BULK PURCHASE OPTION DEMOS ----------
-- Ceramic mugs: default is "1 Set of 6" (from part1) — add a bulk "1 Dozen Sets" wholesale option
select admin_add_purchase_option(
  p.id, '1 Dozen (12 Sets of 6)', 'dozen', 72, 108000, 120000, 1, 20, 1
) from products p where p.sku = 'DRK-01';

-- Reusable plastic cups: default is "1 Pack of 12" — add "1 Box (10 Packs)" bulk option
select admin_add_purchase_option(
  p.id, '1 Box (10 Packs of 12)', 'box', 120, 36000, 40000, 1, 15, 1
) from products p where p.sku = 'DRK-10';

-- Exercise books: default "1 Bundle of 10" — add "1 Carton (10 Bundles)" wholesale option
select admin_add_purchase_option(
  p.id, '1 Carton (10 Bundles of 10)', 'box', 100, 40000, 45000, 1, 10, 1
) from products p where p.sku = 'SCE-03';

-- A4 printer paper: default "1 Ream" — add "1 Box (5 Reams)" bulk option
select admin_add_purchase_option(
  p.id, '1 Box (5 Reams)', 'box', 2500, 19500, 21000, 1, 20, 1
) from products p where p.sku = 'SSU-03';

-- Toilet tissue: default "1 Pack of 12" — add "1 Carton (4 Packs)" bulk option
select admin_add_purchase_option(
  p.id, '1 Carton (4 Packs of 12)', 'box', 48, 15500, 17000, 1, 15, 1
) from products p where p.sku = 'HHE-04';

-- Frying pans: default "1 Piece" — add "1 Pair" option (common retail bundling)
select admin_add_purchase_option(
  p.id, '1 Pair', 'pair', 2, 18000, 21000, 1, 30, 1
) from products p where p.sku = 'COK-01';

-- ---------- CAMPAIGN PRODUCT ASSIGNMENTS ----------
insert into campaign_products (campaign_id, product_id, discount_type, discount_value)
select c.id, p.id, 'percentage', 10
from campaigns c, products p
where c.slug = 'back-to-school' and p.sku in ('SCE-01','SCE-02','SCE-03','SCE-09','SSU-01','SSU-02','SSU-07');

insert into campaign_products (campaign_id, product_id, discount_type, discount_value)
select c.id, p.id, 'fixed', 1500
from campaigns c, products p
where c.slug = 'weekend-deals' and p.sku in ('COK-01','DRK-01','LNB-01','FAN-01','GAD-02');

insert into campaign_products (campaign_id, product_id, discount_type, discount_value)
select c.id, p.id, 'percentage', 8
from campaigns c, products p
where c.slug = 'home-refresh' and p.sku in ('FUR-01','FUR-03','DEC-01','DEC-02','DEC-06');

-- ---------- PRODUCT RECOMMENDATIONS ----------
-- Frequently bought together: ceramic mugs + coffee flask + tray
insert into product_recommendations (product_id, recommended_product_id, recommendation_type, sort_order)
select a.id, b.id, 'frequently_bought_together', 1
from products a, products b where a.sku = 'DRK-01' and b.sku = 'LNB-06';

insert into product_recommendations (product_id, recommended_product_id, recommendation_type, sort_order)
select a.id, b.id, 'frequently_bought_together', 2
from products a, products b where a.sku = 'DRK-01' and b.sku = 'COK-06';

-- Similar products: TVs cross-recommend each other
insert into product_recommendations (product_id, recommended_product_id, recommendation_type, sort_order)
select a.id, b.id, 'similar', row_number() over (order by b.sku)
from products a, products b
where a.sku = 'TVE-03' and b.sku in ('TVE-02','TVE-04','TVE-07') and a.id <> b.id;

-- Related: lunch box <-> school backpack <-> water bottle (cross-department bundle)
insert into product_recommendations (product_id, recommended_product_id, recommendation_type, sort_order)
select a.id, b.id, 'related', 1 from products a, products b where a.sku = 'LNB-01' and b.sku = 'SCE-01';

insert into product_recommendations (product_id, recommended_product_id, recommendation_type, sort_order)
select a.id, b.id, 'related', 2 from products a, products b where a.sku = 'LNB-01' and b.sku = 'SCE-04';

-- Manual admin pick: skate + protective gear + helmet bundle
insert into product_recommendations (product_id, recommended_product_id, recommendation_type, sort_order)
select a.id, b.id, 'manual', 1 from products a, products b where a.sku = 'SKT-01' and b.sku = 'SKT-04';

insert into product_recommendations (product_id, recommended_product_id, recommendation_type, sort_order)
select a.id, b.id, 'manual', 2 from products a, products b where a.sku = 'SKT-01' and b.sku = 'SKT-05';
