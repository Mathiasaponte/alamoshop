# Roadmap — Fase 5 (backend multiusuario)

- [x] Activar Lovable Cloud, email+password
- [x] Tablas + RLS: profiles, private_contacts, products, product_images, favorites, orders, reviews, reports, consents; vista seller_stats
- [x] RPC seguras: create_order, transition_order, get_order_contact, my_product_favorite_counts
- [x] Bucket product-images (privado: la política del workspace bloquea buckets públicos — usuario debe activarla en Settings → Privacy & Security)
- [x] Auth: /auth (entrar/crear cuenta, prefill desde onboarding), gate _authenticated, header según sesión, cerrar sesión
- [x] Perfil conectado al backend (profiles + private_contacts vía server fns)
- [x] Sell flow → subir fotos + crear producto en backend (falta prueba real con cuenta)
- [ ] Marketplace/búsqueda/paginación desde backend (sin mezclar mock)
- [ ] Producto, perfil vendedor, favoritos (con migración de locales)
- [ ] Órdenes comprador/vendedor + realtime + contacto seguro + reseñas
- [ ] Reportes y consentimiento en backend
- [ ] Prueba de dos cuentas de punta a punta
