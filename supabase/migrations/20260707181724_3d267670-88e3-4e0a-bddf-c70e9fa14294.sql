
-- Players (wallet as primary key, lowercased)
CREATE TABLE public.players (
  wallet_address TEXT PRIMARY KEY,
  coins INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_read_all" ON public.players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "players_write_all" ON public.players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "players_update_all" ON public.players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Shop items (public catalog)
CREATE TABLE public.shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('food','accessory','toy')),
  price INTEGER NOT NULL,
  effect JSONB NOT NULL DEFAULT '{}'::jsonb,
  rarity TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_items TO anon, authenticated;
GRANT ALL ON public.shop_items TO service_role;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_items_read_all" ON public.shop_items FOR SELECT TO anon, authenticated USING (true);

-- Inventory
CREATE TABLE public.inventory (
  wallet_address TEXT NOT NULL REFERENCES public.players(wallet_address) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wallet_address, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO anon, authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_all" ON public.inventory FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Player cats
CREATE TABLE public.player_cats (
  wallet_address TEXT NOT NULL REFERENCES public.players(wallet_address) ON DELETE CASCADE,
  cat_id TEXT NOT NULL,
  hunger REAL NOT NULL DEFAULT 80,
  mood REAL NOT NULL DEFAULT 80,
  affection REAL NOT NULL DEFAULT 10,
  is_sleeping BOOLEAN NOT NULL DEFAULT false,
  equipped_accessory TEXT,
  last_fed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wallet_address, cat_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_cats TO anon, authenticated;
GRANT ALL ON public.player_cats TO service_role;
ALTER TABLE public.player_cats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_cats_all" ON public.player_cats FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
