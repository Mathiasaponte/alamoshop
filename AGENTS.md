<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Marketplace state (prefs, profile, favorites, orders, own listings) lives in `src/lib/store.tsx` (localStorage) with mock catalog in `src/lib/data.ts` — demo stage until Lovable Cloud tables replace it.
- All app pages wrap content in `AppShell` (desktop header + mobile bottom nav) — keeps app-like mobile nav consistent.
- Sell flow lives in `src/components/sell/` (SellFlow, SellPhotos, SellSuccess) with local draft + banned-word checks in `src/lib/sell.ts`; publishing always goes through store `publish()` — single source of truth.
- Seller center (`/tienda`) is built from `src/components/seller/*`; only derives metrics from store data (no invented analytics); state changes go through `setProductStatus` ("paused" pauses, "removed" = soft delete). Share logic lives in `src/lib/share.ts`.
- Public trust pages (/nosotros, /transparencia, /terminos, /privacidad, /reglas) use `src/components/info/InfoParts`; configurable content (team, campaigns, metrics, legal versions) lives in `src/lib/legal.ts` — only real data, never invented. Consent is local-only (ConsentGate, shown to users with a profile).
- Shared data (profiles, products, images, favorites, orders, reviews, reports, consents) lives in Lovable Cloud with RLS; order status only changes via `transition_order`/`create_order` RPCs — keeps transitions and product reserved/sold consistent server-side. Prices stored as integer `price_cents`.
- Contacts (instagram/whatsapp) live in `private_contacts` (owner-only) and are shared only through `get_order_contact` after acceptance — never exposed publicly.
- Product image URLs resolve only through `src/lib/images.ts` (signed URLs today, swap to getPublicUrl when bucket is public); DB stores only storage_path — signed URLs expire.
- Publishing goes through `src/lib/publish.ts` (upload → insert product → insert product_images, cleanup to status removed on failure); seller_id always from session.
- Public catalog reads go through `src/lib/catalog.ts` (server-side filters/search, 12 per page via range); marketplace, /p/$id and /u/$id read only Cloud — no mock mixing.
