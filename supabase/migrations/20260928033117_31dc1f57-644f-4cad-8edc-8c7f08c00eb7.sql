CREATE TYPE public.campus AS ENUM ('Norte','Sur');
CREATE TYPE public.school_level AS ENUM ('Secundaria','Prepa');
CREATE TYPE public.product_status AS ENUM ('active','reserved','sold','paused','removed');
CREATE TYPE public.product_type AS ENUM ('product','service');
CREATE TYPE public.order_status AS ENUM ('solicitud','aceptada','coordinando','entregado','completado','rechazado','cancelado');

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '' CHECK (char_length(first_name) <= 40),
  last_name text NOT NULL DEFAULT '' CHECK (char_length(last_name) <= 40),
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
  campus public.campus,
  level public.school_level,
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 140),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PRIVATE CONTACTS
CREATE TABLE public.private_contacts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram text NOT NULL DEFAULT '' CHECK (char_length(instagram) <= 40),
  whatsapp text NOT NULL DEFAULT '' CHECK (char_length(whatsapp) <= 20),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.private_contacts TO authenticated;
GRANT ALL ON public.private_contacts TO service_role;
ALTER TABLE public.private_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts own all" ON public.private_contacts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER contacts_touch BEFORE UPDATE ON public.private_contacts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto-create profile on signup (prefill from metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, display_name, campus, level, bio)
  VALUES (
    NEW.id,
    left(coalesce(m->>'first_name',''),40),
    left(coalesce(m->>'last_name',''),40),
    left(trim(coalesce(m->>'first_name','') || ' ' || coalesce(m->>'last_name','')),80),
    CASE WHEN m->>'campus' IN ('Norte','Sur') THEN (m->>'campus')::public.campus END,
    CASE WHEN m->>'level' IN ('Secundaria','Prepa') THEN (m->>'level')::public.school_level END,
    ''
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.private_contacts (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.product_type NOT NULL DEFAULT 'product',
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 60),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 600),
  price_cents integer NOT NULL CHECK (price_cents >= 0 AND price_cents <= 100000000),
  currency text NOT NULL DEFAULT 'MXN',
  category text NOT NULL,
  condition text,
  campus public.campus NOT NULL,
  level public.school_level,
  delivery_locations text[] NOT NULL DEFAULT '{}',
  status public.product_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_status_created ON public.products (status, created_at DESC);
CREATE INDEX products_seller ON public.products (seller_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (status IN ('active','reserved','sold'));
CREATE POLICY "products owner read" ON public.products FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "products owner insert" ON public.products FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid() AND status = 'active');
CREATE POLICY "products owner update" ON public.products FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- owners can only set active/paused/removed/sold directly; reserved is driven by orders
CREATE OR REPLACE FUNCTION public.guard_product_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('app.order_tx', true) = '1' THEN RETURN NEW; END IF;
  IF NEW.seller_id <> OLD.seller_id THEN RAISE EXCEPTION 'No puedes cambiar el vendedor'; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'reserved' THEN
    RAISE EXCEPTION 'El estado reservado lo controla una orden';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER products_guard BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_status();

-- PRODUCT IMAGES
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_images_product ON public.product_images (product_id, sort_order);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images public read" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "images owner write" ON public.product_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.seller_id = auth.uid()) AND storage_path LIKE auth.uid()::text || '/%');

-- FAVORITES
CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites own" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.my_product_favorite_counts() RETURNS TABLE(product_id uuid, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.product_id, count(*) FROM public.favorites f JOIN public.products p ON p.id = f.product_id
  WHERE p.seller_id = auth.uid() GROUP BY f.product_id;
$$;
REVOKE EXECUTE ON FUNCTION public.my_product_favorite_counts() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_product_favorite_counts() TO authenticated;

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'solicitud',
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);
CREATE UNIQUE INDEX orders_one_active ON public.orders (buyer_id, product_id)
  WHERE status IN ('solicitud','aceptada','coordinando','entregado');
CREATE INDEX orders_seller ON public.orders (seller_id, created_at DESC);
CREATE INDEX orders_buyer ON public.orders (buyer_id, created_at DESC);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders participants read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() IN (buyer_id, seller_id));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.create_order(_product_id uuid, _note text) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.products; o public.orders; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Necesitas una cuenta'; END IF;
  SELECT * INTO p FROM public.products WHERE id = _product_id;
  IF NOT FOUND OR p.status <> 'active' THEN RAISE EXCEPTION 'Esta publicación no está disponible'; END IF;
  IF p.seller_id = uid THEN RAISE EXCEPTION 'No puedes comprar tu propia publicación'; END IF;
  SELECT * INTO o FROM public.orders WHERE buyer_id = uid AND product_id = _product_id
    AND status IN ('solicitud','aceptada','coordinando','entregado');
  IF FOUND THEN RETURN o; END IF;
  INSERT INTO public.orders (product_id, buyer_id, seller_id, note)
  VALUES (_product_id, uid, p.seller_id, left(trim(coalesce(_note,'')),500)) RETURNING * INTO o;
  RETURN o;
END; $$;

CREATE OR REPLACE FUNCTION public.transition_order(_order_id uuid, _to public.order_status) RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders; uid uuid := auth.uid(); is_seller boolean; is_buyer boolean; ok boolean := false;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orden no encontrada'; END IF;
  is_seller := uid = o.seller_id; is_buyer := uid = o.buyer_id;
  IF NOT (is_seller OR is_buyer) THEN RAISE EXCEPTION 'No participas en esta orden'; END IF;
  IF is_seller THEN
    ok := (o.status = 'solicitud' AND _to IN ('aceptada','rechazado'))
       OR (o.status = 'aceptada' AND _to = 'coordinando')
       OR (o.status = 'coordinando' AND _to = 'entregado');
  END IF;
  IF NOT ok AND is_buyer THEN
    ok := (o.status IN ('solicitud','aceptada','coordinando') AND _to = 'cancelado')
       OR (o.status = 'entregado' AND _to = 'completado');
  END IF;
  IF NOT ok THEN RAISE EXCEPTION 'Cambio de estado no permitido'; END IF;
  IF _to = 'aceptada' AND EXISTS (SELECT 1 FROM public.products WHERE id = o.product_id AND status <> 'active') THEN
    RAISE EXCEPTION 'La publicación ya no está disponible';
  END IF;

  PERFORM set_config('app.order_tx', '1', true);
  UPDATE public.orders SET status = _to,
    accepted_at = CASE WHEN _to = 'aceptada' THEN now() ELSE accepted_at END,
    delivered_at = CASE WHEN _to = 'entregado' THEN now() ELSE delivered_at END,
    completed_at = CASE WHEN _to = 'completado' THEN now() ELSE completed_at END,
    cancelled_at = CASE WHEN _to IN ('cancelado','rechazado') THEN now() ELSE cancelled_at END
  WHERE id = _order_id RETURNING * INTO o;

  IF _to = 'aceptada' THEN
    UPDATE public.products SET status = 'reserved' WHERE id = o.product_id;
  ELSIF _to = 'completado' THEN
    UPDATE public.products SET status = 'sold' WHERE id = o.product_id;
    UPDATE public.orders SET status = 'rechazado', cancelled_at = now()
      WHERE product_id = o.product_id AND id <> o.id AND status = 'solicitud';
  ELSIF _to IN ('cancelado','rechazado') THEN
    UPDATE public.products SET status = 'active' WHERE id = o.product_id AND status = 'reserved'
      AND NOT EXISTS (SELECT 1 FROM public.orders x WHERE x.product_id = o.product_id
        AND x.status IN ('aceptada','coordinando','entregado'));
  END IF;
  PERFORM set_config('app.order_tx', '', true);
  RETURN o;
END; $$;

CREATE OR REPLACE FUNCTION public.get_order_contact(_order_id uuid)
RETURNS TABLE(display_name text, instagram text, whatsapp text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders; other uuid;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id;
  IF NOT FOUND OR auth.uid() NOT IN (o.buyer_id, o.seller_id) THEN RETURN; END IF;
  IF o.status NOT IN ('aceptada','coordinando','entregado','completado') THEN RETURN; END IF;
  other := CASE WHEN auth.uid() = o.buyer_id THEN o.seller_id ELSE o.buyer_id END;
  RETURN QUERY SELECT p.display_name, c.instagram, c.whatsapp
    FROM public.profiles p LEFT JOIN public.private_contacts c ON c.user_id = p.id WHERE p.id = other;
END; $$;

REVOKE EXECUTE ON FUNCTION public.create_order(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.transition_order(uuid, public.order_status) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_order_contact(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order(uuid, public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_contact(uuid) TO authenticated;

-- REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  text text NOT NULL DEFAULT '' CHECK (char_length(text) <= 600),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, reviewer_id)
);
CREATE INDEX reviews_reviewee ON public.reviews (reviewee_id, created_at DESC);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews eligible insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  reviewer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.status = 'completado'
      AND o.buyer_id = auth.uid() AND o.seller_id = reviewee_id));

CREATE OR REPLACE VIEW public.seller_stats WITH (security_invoker = true) AS
SELECT p.id AS seller_id,
  coalesce((SELECT round(avg(r.stars)::numeric, 1) FROM public.reviews r WHERE r.reviewee_id = p.id), 0) AS rating,
  (SELECT count(*) FROM public.reviews r WHERE r.reviewee_id = p.id) AS review_count,
  (SELECT count(*) FROM public.products x WHERE x.seller_id = p.id AND x.status = 'sold') AS sales
FROM public.profiles p;
GRANT SELECT ON public.seller_stats TO anon, authenticated;

-- REPORTS
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('product','user','review','message','ad')),
  target_id text NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) <= 80),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 1000),
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports own read" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "reports own insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'open');

-- CONSENTS
CREATE TABLE public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, terms_version, privacy_version)
);
GRANT SELECT, INSERT ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consents own read" ON public.consents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "consents own insert" ON public.consents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- STORAGE policies: {userId}/{productId}/{file}
CREATE POLICY "product images public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "product images owner upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "product images owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;