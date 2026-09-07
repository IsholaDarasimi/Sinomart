-- =====================================================================================
-- 018_seed_categories_delivery.sql
-- Seed: full two-level category tree (13 departments), brands, Lagos delivery demo
-- config, and pickup location. All demo values are admin-editable.
-- =====================================================================================

-- ---------- TOP-LEVEL DEPARTMENTS ----------
insert into categories (name, slug, description, sort_order) values
  ('Home & Living', 'home-living', 'Furniture, decor, and everyday household essentials.', 1),
  ('Kitchen & Dining', 'kitchen-dining', 'Cookware, dinnerware, and kitchen organization.', 2),
  ('Electronics & Appliances', 'electronics-appliances', 'TVs, appliances, gadgets, and power solutions.', 3),
  ('Fashion & Accessories', 'fashion-accessories', 'Clothing, footwear, bags, and jewellery.', 4),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Skincare, makeup, hair care, and fragrance.', 5),
  ('Kids, Baby & Toys', 'kids-baby-toys', 'Toys, baby care, and kids fashion.', 6),
  ('Sports & Outdoor', 'sports-outdoor', 'Fitness, outdoor games, and sports equipment.', 7),
  ('Office & School', 'office-school', 'Stationery, school, and office supplies.', 8),
  ('Pet Supplies', 'pet-supplies', 'Food, grooming, and accessories for pets.', 9),
  ('Travel & Luggage', 'travel-luggage', 'Suitcases, travel bags, and organizers.', 10),
  ('Groceries & Everyday Essentials', 'groceries-essentials', 'Beverages, snacks, and pantry items.', 11),
  ('Tools & Hardware', 'tools-hardware', 'Hand tools, hardware, and workshop equipment.', 12);

-- ---------- SUBCATEGORIES ----------
insert into categories (parent_id, name, slug, sort_order)
select c.id, s.name, s.slug, s.sort_order
from categories c
join (values
  -- Home & Living
  ('home-living','Furniture','furniture',1),
  ('home-living','Home Decor','home-decor',2),
  ('home-living','Storage & Organization','storage-organization',3),
  ('home-living','Bathroom','bathroom',4),
  ('home-living','Bedroom','bedroom',5),
  ('home-living','Cleaning & Laundry','cleaning-laundry',6),
  ('home-living','Lighting','lighting',7),
  ('home-living','Curtains & Home Accessories','curtains-home-accessories',8),
  -- Kitchen & Dining
  ('kitchen-dining','Cookware','cookware',1),
  ('kitchen-dining','Kitchen Utensils','kitchen-utensils',2),
  ('kitchen-dining','Drinkware','drinkware',3),
  ('kitchen-dining','Dinnerware','dinnerware',4),
  ('kitchen-dining','Food Storage','food-storage',5),
  ('kitchen-dining','Lunch Boxes & Flasks','lunch-boxes-flasks',6),
  ('kitchen-dining','Kitchen Organization','kitchen-organization',7),
  ('kitchen-dining','Baking & Kitchen Tools','baking-kitchen-tools',8),
  -- Electronics & Appliances
  ('electronics-appliances','Televisions','televisions',1),
  ('electronics-appliances','Refrigerators & Freezers','refrigerators-freezers',2),
  ('electronics-appliances','Washing Machines','washing-machines',3),
  ('electronics-appliances','Air Conditioners','air-conditioners',4),
  ('electronics-appliances','Fans','fans',5),
  ('electronics-appliances','Small Kitchen Appliances','small-kitchen-appliances',6),
  ('electronics-appliances','Audio','audio',7),
  ('electronics-appliances','Gadgets & Accessories','gadgets-accessories',8),
  ('electronics-appliances','Power & Generators','power-generators',9),
  -- Fashion & Accessories
  ('fashion-accessories','Men''s Clothing','mens-clothing',1),
  ('fashion-accessories','Women''s Clothing','womens-clothing',2),
  ('fashion-accessories','Footwear','footwear',3),
  ('fashion-accessories','Bags','bags',4),
  ('fashion-accessories','Jewellery','jewellery',5),
  ('fashion-accessories','Watches','watches',6),
  ('fashion-accessories','Fashion Accessories','fashion-misc-accessories',7),
  -- Beauty & Personal Care
  ('beauty-personal-care','Face Care','face-care',1),
  ('beauty-personal-care','Skincare','skincare',2),
  ('beauty-personal-care','Makeup','makeup',3),
  ('beauty-personal-care','Hair Care','hair-care',4),
  ('beauty-personal-care','Bath & Body','bath-body',5),
  ('beauty-personal-care','Beauty Tools','beauty-tools',6),
  ('beauty-personal-care','Fragrance','fragrance',7),
  -- Kids, Baby & Toys
  ('kids-baby-toys','Toys','toys',1),
  ('kids-baby-toys','Dolls','dolls',2),
  ('kids-baby-toys','Stuffed Animals','stuffed-animals',3),
  ('kids-baby-toys','Baby Care','baby-care',4),
  ('kids-baby-toys','Baby Accessories','baby-accessories',5),
  ('kids-baby-toys','Kids Fashion','kids-fashion',6),
  ('kids-baby-toys','School Essentials','school-essentials',7),
  ('kids-baby-toys','Educational Toys','educational-toys',8),
  -- Sports & Outdoor
  ('sports-outdoor','Skates','skates',1),
  ('sports-outdoor','Skateboards','skateboards',2),
  ('sports-outdoor','Fitness','fitness',3),
  ('sports-outdoor','Sports Equipment','sports-equipment',4),
  ('sports-outdoor','Outdoor Games','outdoor-games',5),
  ('sports-outdoor','Camping & Outdoor','camping-outdoor',6),
  -- Office & School
  ('office-school','Stationery','stationery',1),
  ('office-school','School Supplies','school-supplies',2),
  ('office-school','Office Supplies','office-supplies',3),
  ('office-school','Office Furniture','office-furniture',4),
  ('office-school','Bags & Backpacks','bags-backpacks',5),
  ('office-school','Educational Materials','educational-materials',6),
  -- Pet Supplies
  ('pet-supplies','Pet Food & Treats','pet-food-treats',1),
  ('pet-supplies','Pet Toys','pet-toys',2),
  ('pet-supplies','Pet Grooming','pet-grooming',3),
  ('pet-supplies','Pet Accessories','pet-accessories',4),
  ('pet-supplies','Pet Cleaning','pet-cleaning',5),
  -- Travel & Luggage
  ('travel-luggage','Suitcases','suitcases',1),
  ('travel-luggage','Travel Bags','travel-bags',2),
  ('travel-luggage','Backpacks','travel-backpacks',3),
  ('travel-luggage','Travel Accessories','travel-accessories',4),
  ('travel-luggage','Organizers','travel-organizers',5),
  -- Groceries & Everyday Essentials
  ('groceries-essentials','Beverages','beverages',1),
  ('groceries-essentials','Snacks','snacks',2),
  ('groceries-essentials','Household Essentials','household-essentials',3),
  ('groceries-essentials','Personal Essentials','personal-essentials',4),
  ('groceries-essentials','Pantry Items','pantry-items',5),
  -- Tools & Hardware
  ('tools-hardware','Hand Tools','hand-tools',1),
  ('tools-hardware','Hardware','hardware',2),
  ('tools-hardware','Electrical Accessories','electrical-accessories',3),
  ('tools-hardware','Workshop Equipment','workshop-equipment',4),
  ('tools-hardware','DIY','diy',5)
) as s(parent_slug, name, slug, sort_order) on s.parent_slug = c.slug
where c.parent_id is null;

-- ---------- BRANDS (mix of international + generic "house brand" style, typical of a large NG retailer) ----------
insert into brands (name, slug) values
  ('Sinomart Essentials', 'sinomart-essentials'),
  ('Binatone', 'binatone'),
  ('Scanfrost', 'scanfrost'),
  ('Nexus', 'nexus'),
  ('Lush & Home', 'lush-and-home'),
  ('Vono', 'vono'),
  ('Qasa', 'qasa'),
  ('Skinlite', 'skinlite'),
  ('Zaron', 'zaron'),
  ('Bio-Oil', 'bio-oil'),
  ('Nivea', 'nivea'),
  ('Fenty Beauty', 'fenty-beauty'),
  ('Toyzone', 'toyzone'),
  ('Chelino', 'chelino'),
  ('Pampers', 'pampers'),
  ('Adidas', 'adidas'),
  ('Nike', 'nike'),
  ('Crocs', 'crocs'),
  ('Fossil', 'fossil'),
  ('Samsung', 'samsung'),
  ('LG', 'lg'),
  ('Hisense', 'hisense'),
  ('Anker', 'anker'),
  ('Tecno', 'tecno');

-- ---------- DELIVERY ZONES (Lagos demo config — admin-editable, not final pricing) ----------
insert into delivery_zones (name, description, fee, free_delivery_threshold, minimum_order_amount, estimated_min_days, estimated_max_days, sort_order) values
  ('Zone A', 'Victoria Island, Oniru, Lekki Phase 1 and immediate surroundings.', 1000, 50000, 0, 1, 2, 1),
  ('Zone B', 'Ikoyi, Yaba, Surulere, Gbagada.', 1500, 60000, 0, 1, 3, 2),
  ('Zone C', 'Ikeja, Maryland, Magodo, Ojota.', 2000, 70000, 0, 2, 4, 3),
  ('Zone D', 'Other supported Lagos areas.', 3000, 80000, 0, 2, 5, 4);

insert into delivery_zone_areas (zone_id, area_name)
select z.id, a.area_name from delivery_zones z
join (values
  ('Zone A','Victoria Island'), ('Zone A','Oniru'), ('Zone A','Lekki Phase 1'),
  ('Zone B','Ikoyi'), ('Zone B','Yaba'), ('Zone B','Surulere'), ('Zone B','Gbagada'),
  ('Zone C','Ikeja'), ('Zone C','Maryland'), ('Zone C','Magodo'), ('Zone C','Ojota'),
  ('Zone D','Ajah'), ('Zone D','Festac'), ('Zone D','Ikorodu'), ('Zone D','Alimosho')
) as a(zone_name, area_name) on a.zone_name = z.name;

insert into pickup_locations (name, address, city, contact_phone, opening_hours) values
  ('Sinomart Super Store — The Palms Mall', 'The Palms Shopping Mall, Bisway Plaza, Lekki-Epe Expressway, Victoria Island, Lagos', 'Lagos', '+234 800 000 0000', 'Mon–Sun: 10:00 AM – 9:00 PM');

-- ---------- SAMPLE CAMPAIGNS & BANNERS ----------
insert into campaigns (name, slug, description, grants_free_delivery, starts_at, ends_at) values
  ('Back to School', 'back-to-school', 'Everything for a fresh school year — bags, stationery, and lunch boxes.', false, now() - interval '5 days', now() + interval '25 days'),
  ('Weekend Deals', 'weekend-deals', 'Rotating discounts on home and kitchen favourites, every weekend.', false, now() - interval '2 days', now() + interval '2 days'),
  ('Home Refresh', 'home-refresh', 'Furniture and decor to reset your living space.', false, now() - interval '10 days', now() + interval '20 days');

insert into homepage_banners (title, subtitle, image_url, cta_text, destination_type, destination_campaign_id, is_active, sort_order)
select 'Back to School Starts Here', 'Everything they need for a fresh school year', 'https://picsum.photos/seed/sinomart-banner-school/1600/600', 'Shop School Essentials', 'campaign', id, true, 1
from campaigns where slug = 'back-to-school';

insert into homepage_banners (title, subtitle, image_url, cta_text, destination_type, destination_category_id, is_active, sort_order)
select 'China in Lagos — Now Online', 'Thousands of household finds, delivered across Lagos', 'https://picsum.photos/seed/sinomart-banner-home/1600/600', 'Shop Home & Living', 'category', id, true, 2
from categories where slug = 'home-living';
