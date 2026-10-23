CREATE TABLE public.menu_changes (id text PRIMARY KEY, name text, category text, price_kobo integer CHECK(price_kobo >= 0), image_path text, image_removed boolean NOT NULL DEFAULT false, sold_out boolean, requires_takeaway boolean, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.menu_changes TO anon, authenticated;
GRANT ALL ON public.menu_changes TO service_role;
ALTER TABLE public.menu_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public menu reads" ON public.menu_changes FOR SELECT TO anon, authenticated USING (true);