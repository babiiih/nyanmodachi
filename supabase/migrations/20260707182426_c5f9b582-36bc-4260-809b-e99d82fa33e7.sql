
-- Drop permissive policies on user-owned tables
DROP POLICY IF EXISTS "players_read_all" ON public.players;
DROP POLICY IF EXISTS "players_write_all" ON public.players;
DROP POLICY IF EXISTS "players_update_all" ON public.players;
DROP POLICY IF EXISTS "inventory_all" ON public.inventory;
DROP POLICY IF EXISTS "player_cats_all" ON public.player_cats;

-- Revoke anon/authenticated privileges (service_role bypasses RLS and keeps working via server functions)
REVOKE ALL ON public.players FROM anon, authenticated;
REVOKE ALL ON public.inventory FROM anon, authenticated;
REVOKE ALL ON public.player_cats FROM anon, authenticated;

-- shop_items stays publicly readable (catalog is not private).
-- RLS is still enabled on all four tables — with no policies, anon/authenticated have zero access.
