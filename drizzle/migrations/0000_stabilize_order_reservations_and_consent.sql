CREATE OR REPLACE FUNCTION public.transition_order(_order_id uuid, _to public.order_status) RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders; uid uuid := auth.uid(); pid uuid; p public.products; ok boolean := false;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Necesitas una cuenta'; END IF;
 SELECT product_id INTO pid FROM public.orders WHERE id = _order_id AND uid IN (buyer_id,seller_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'No participas en esta orden'; END IF;
 SELECT * INTO p FROM public.products WHERE id = pid FOR UPDATE;
 SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
 IF uid = o.seller_id THEN
  ok := (o.status='solicitud' AND _to IN ('aceptada','rechazado')) OR (o.status='aceptada' AND _to='coordinando') OR (o.status='coordinando' AND _to='entregado');
 ELSIF uid = o.buyer_id THEN
  ok := (o.status IN ('solicitud','aceptada','coordinando') AND _to='cancelado') OR (o.status='entregado' AND _to='completado');
 END IF;
 IF NOT ok THEN RAISE EXCEPTION 'Cambio de estado no permitido'; END IF;
 IF _to='aceptada' AND (p.status <> 'active' OR EXISTS (SELECT 1 FROM public.orders WHERE product_id=pid AND id<>o.id AND status IN ('aceptada','coordinando','entregado','completado'))) THEN RAISE EXCEPTION 'La publicación ya no está disponible'; END IF;
 PERFORM set_config('app.order_tx','1',true);
 UPDATE public.orders SET status=_to, accepted_at=CASE WHEN _to='aceptada' THEN now() ELSE accepted_at END, delivered_at=CASE WHEN _to='entregado' THEN now() ELSE delivered_at END, completed_at=CASE WHEN _to='completado' THEN now() ELSE completed_at END, cancelled_at=CASE WHEN _to IN ('cancelado','rechazado') THEN now() ELSE cancelled_at END WHERE id=_order_id RETURNING * INTO o;
 IF _to='aceptada' THEN UPDATE public.products SET status='reserved' WHERE id=pid;
 ELSIF _to='completado' THEN
  UPDATE public.products SET status='sold' WHERE id=pid;
  UPDATE public.orders SET status='rechazado',cancelled_at=now() WHERE product_id=pid AND id<>o.id AND status='solicitud';
 ELSIF _to IN ('cancelado','rechazado') THEN
  UPDATE public.products SET status='active' WHERE id=pid AND status='reserved' AND NOT EXISTS (SELECT 1 FROM public.orders WHERE product_id=pid AND status IN ('aceptada','coordinando','entregado'));
 END IF;
 PERFORM set_config('app.order_tx','',true);
 RETURN o;
END; $$;
CREATE OR REPLACE FUNCTION public.create_order(_product_id uuid,_note text) RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.products; o public.orders; uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Necesitas una cuenta'; END IF;
 SELECT * INTO p FROM public.products WHERE id=_product_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Esta publicación no está disponible'; END IF;
 IF p.seller_id=uid THEN RAISE EXCEPTION 'No puedes comprar tu propia publicación'; END IF;
 SELECT * INTO o FROM public.orders WHERE buyer_id=uid AND product_id=_product_id AND status IN ('solicitud','aceptada','coordinando','entregado');
 IF FOUND THEN RETURN o; END IF;
 IF p.status<>'active' THEN RAISE EXCEPTION 'Esta publicación no está disponible'; END IF;
 INSERT INTO public.orders(product_id,buyer_id,seller_id,note) VALUES(_product_id,uid,p.seller_id,left(trim(coalesce(_note,'')),500)) RETURNING * INTO o;
 RETURN o;
END; $$;
CREATE OR REPLACE FUNCTION public.guard_product_status() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.seller_id<>OLD.seller_id THEN RAISE EXCEPTION 'No puedes cambiar el vendedor'; END IF;
 IF current_setting('app.order_tx',true)='1' THEN RETURN NEW; END IF;
 IF EXISTS(SELECT 1 FROM public.orders WHERE product_id=OLD.id AND status IN ('aceptada','coordinando','entregado')) AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.price_cents IS DISTINCT FROM OLD.price_cents OR NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description) THEN RAISE EXCEPTION 'Completa la orden antes de modificar esta publicación'; END IF;
 IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status='reserved' THEN RAISE EXCEPTION 'El estado reservado lo controla una orden'; END IF;
 IF OLD.status='sold' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status<>'removed' THEN RAISE EXCEPTION 'Una venta terminada no se puede reactivar'; END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.verified_sale_count(_seller_id uuid) RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT count(*) FROM public.orders WHERE seller_id=_seller_id AND status='completado'; $$;
REVOKE ALL ON FUNCTION public.verified_sale_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verified_sale_count(uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE VIEW public.seller_stats WITH (security_invoker=true) AS SELECT p.id AS seller_id,coalesce((SELECT round(avg(r.stars)::numeric,1) FROM public.reviews r WHERE r.reviewee_id=p.id),0) AS rating,(SELECT count(*) FROM public.reviews r WHERE r.reviewee_id=p.id) AS review_count,public.verified_sale_count(p.id) AS sales FROM public.profiles p;
CREATE OR REPLACE FUNCTION public.accept_current_consent() RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Necesitas una cuenta'; END IF;
 INSERT INTO public.consents(user_id,terms_version,privacy_version) VALUES(auth.uid(),'1.0','1.0') ON CONFLICT(user_id,terms_version,privacy_version) DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.accept_current_consent() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_current_consent() TO authenticated;
CREATE OR REPLACE FUNCTION public.require_current_consent() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.consents WHERE user_id=auth.uid() AND terms_version='1.0' AND privacy_version='1.0') THEN RAISE EXCEPTION 'Acepta los términos y el aviso de privacidad antes de continuar'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER products_require_consent BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.require_current_consent();
CREATE TRIGGER orders_require_consent BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.require_current_consent();
ALTER POLICY "images public read" ON public.product_images USING (EXISTS(SELECT 1 FROM public.products p WHERE p.id=product_id AND p.status IN ('active','reserved','sold')));
ALTER POLICY "product images public read" ON storage.objects USING (bucket_id='product-images' AND ((storage.foldername(name))[1]=auth.uid()::text OR EXISTS(SELECT 1 FROM public.product_images i JOIN public.products p ON p.id=i.product_id WHERE i.storage_path=name AND p.status IN ('active','reserved','sold'))));
CREATE POLICY "products order participant read" ON public.products FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.orders o WHERE o.product_id=id AND auth.uid() IN(o.buyer_id,o.seller_id)));
REVOKE EXECUTE ON FUNCTION public.create_order(uuid,text),public.transition_order(uuid,public.order_status) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_order(uuid,text),public.transition_order(uuid,public.order_status) TO authenticated,service_role;