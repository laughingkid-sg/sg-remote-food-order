-- Seed data: 10 stores (mirrors data/seed.ts).
-- Idempotent-ish: safe to re-run after a truncate.

insert into public.stores
  (slug, name, type, description, cuisine, region, address, order_url, app_ios_url, app_android_url, featured)
values
  ('mcdonalds', 'McDonald''s', 'app',
   'Order ahead and skip the queue with the McDonald''s app.', 'Fast Food', 'central', null,
   null,
   'https://apps.apple.com/sg/app/mcdonalds-app-singapore/id1449615364',
   'https://play.google.com/store/apps/details?id=com.mcdonalds.mobileapp', true),

  ('kfc', 'KFC', 'app',
   'Pre-order your bucket for takeaway or delivery via the KFC app.', 'Fast Food', 'central', null,
   null,
   'https://apps.apple.com/sg/app/kfc-singapore/id1483721912',
   'https://play.google.com/store/apps/details?id=sg.kfc.mobile', true),

  ('starbucks', 'Starbucks', 'app',
   'Mobile order & pay, then collect at your nearest store.', 'Coffee', 'central', null,
   null,
   'https://apps.apple.com/sg/app/starbucks-singapore/id1218011168',
   'https://play.google.com/store/apps/details?id=sg.com.starbucks.mobilecard', false),

  ('jollibee', 'Jollibee', 'app',
   'Chickenjoy on demand — order for pickup or delivery in-app.', 'Fast Food', 'north-east', null,
   null,
   'https://apps.apple.com/sg/app/jollibee-sg/id6446157263',
   'https://play.google.com/store/apps/details?id=com.jollibee.sg', false),

  ('kopitiam-toast-tampines', 'Kopitiam Toast — Tampines', 'qr',
   'Traditional kaya toast, soft-boiled eggs and kopi. Scan to order.', 'Local Breakfast', 'east',
   'Tampines Mall, 4 Tampines Central 5, #B1-12, Singapore 529510',
   'https://order.example.com/kopitiam-toast/tampines', null, null, true),

  ('kopitiam-toast-jurong', 'Kopitiam Toast — Jurong', 'qr',
   'Traditional kaya toast, soft-boiled eggs and kopi. Scan to order.', 'Local Breakfast', 'west',
   'JEM, 50 Jurong Gateway Rd, #02-20, Singapore 608549',
   'https://order.example.com/kopitiam-toast/jurong', null, null, false),

  ('bubble-tea-co-orchard', 'Bubble Tea Co — Orchard', 'qr',
   'Handcrafted milk teas and fruit teas. Order at the counter QR.', 'Bubble Tea', 'central',
   'ION Orchard, 2 Orchard Turn, #B4-15, Singapore 238801',
   'https://order.example.com/bubble-tea-co/orchard', null, null, true),

  ('nasi-lemak-house-woodlands', 'Nasi Lemak House — Woodlands', 'qr',
   'Coconut rice sets with sambal, fried chicken and otah.', 'Malay', 'north',
   'Causeway Point, 1 Woodlands Square, #05-08, Singapore 738099',
   'https://order.example.com/nasi-lemak-house/woodlands', null, null, false),

  ('hainan-chicken-rice-amk', 'Hainan Chicken Rice — Ang Mo Kio', 'qr',
   'Steamed and roasted chicken rice plates. Scan to skip the line.', 'Local', 'north-east',
   'AMK Hub, 53 Ang Mo Kio Ave 3, #B2-05, Singapore 569933',
   'https://order.example.com/hainan-chicken-rice/amk', null, null, false),

  ('prata-corner-bedok', 'Prata Corner — Bedok', 'qr',
   'Crispy roti prata, murtabak and teh tarik around the clock.', 'Indian', 'east',
   'Bedok Mall, 311 New Upper Changi Rd, #B2-30, Singapore 467360',
   'https://order.example.com/prata-corner/bedok', null, null, false)
on conflict (slug) do nothing;

insert into public.store_tags (store_id, tag)
select s.id, t.tag
from public.stores s
join (values
  ('mcdonalds', 'takeaway'), ('mcdonalds', 'delivery'), ('mcdonalds', 'dine-in'),
  ('kfc', 'takeaway'), ('kfc', 'delivery'),
  ('starbucks', 'takeaway'), ('starbucks', 'dine-in'),
  ('jollibee', 'takeaway'), ('jollibee', 'delivery'),
  ('kopitiam-toast-tampines', 'takeaway'), ('kopitiam-toast-tampines', 'dine-in'),
  ('kopitiam-toast-jurong', 'takeaway'), ('kopitiam-toast-jurong', 'dine-in'),
  ('bubble-tea-co-orchard', 'takeaway'),
  ('nasi-lemak-house-woodlands', 'takeaway'), ('nasi-lemak-house-woodlands', 'dine-in'),
  ('hainan-chicken-rice-amk', 'takeaway'), ('hainan-chicken-rice-amk', 'dine-in'),
  ('prata-corner-bedok', 'takeaway'), ('prata-corner-bedok', 'dine-in'), ('prata-corner-bedok', 'delivery')
) as t(slug, tag) on t.slug = s.slug
on conflict (store_id, tag) do nothing;
