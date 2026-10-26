import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatPrice } from "@/lib/data";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/use-session';
import { fetchMyProducts, updateProductStatus } from '@/lib/catalog';
import { fetchMyOrders, fetchSellerReviews, invalidateOrderData, useOrdersRealtime } from '@/lib/orders';
import { useImageUrls } from '@/lib/images';
import type { Order } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { hasProgress, loadDraft } from "@/lib/sell";
import {
  AnalyticsPlaceholder, ORDER_GROUPS, OrderList, PendingRequests, Section, SellerActivity, SellerDraft,
  SellerEmptyState, SellerInsights, SellerReviews, SellerStat,
} from "@/components/seller/SellerParts";
import { SellerListings } from "@/components/seller/SellerListings";

export const Route = createFileRoute("/tienda")({
  head: () => ({
    meta: [
      { title: "Tu tienda — Álamos Shop" },
      { name: "description", content: "Administra tus publicaciones, solicitudes y ventas dentro de Álamos Shop." },
      { property: "og:title", content: "Tu tienda — Álamos Shop" },
      { property: "og:description", content: "Tu pequeño negocio dentro de la comunidad Álamos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tienda,
});

const TABS = ["Resumen", "Publicaciones", "Solicitudes"] as const;
type Tab = (typeof TABS)[number];

function Tienda() {
  const { user, ready } = useSession();
  const uid = user?.id;
  const qc = useQueryClient();
  useOrdersRealtime(uid ?? null);
  const pq = useQuery({ queryKey: ['my-products', uid], queryFn: () => uid ? fetchMyProducts(uid) : [], enabled: !!uid });
  const oq = useQuery({ queryKey: ['orders', uid], queryFn: () => uid ? fetchMyOrders(uid) : [], enabled: !!uid });
  const rq = useQuery({ queryKey: ['reviews', uid], queryFn: () => uid ? fetchSellerReviews(uid) : [], enabled: !!uid });
  const rawProducts = pq.data ?? [];
  const paths = rawProducts.map(p => p.imagePath ?? '').filter(Boolean);
  const images = useImageUrls(paths);
  const pathUrls = new Map(paths.map((p,i) => [p, images.data?.[i] ?? '']));
  const myProducts = rawProducts.map(p => ({ ...p, images: p.imagePath && pathUrls.get(p.imagePath) ? [pathUrls.get(p.imagePath) ?? ''] : [] }));
  const cloudIncoming = (oq.data ?? []).filter(o => o.seller_id === uid);
  const orders: Order[] = cloudIncoming.map(o => ({ id:o.id, productId:o.product_id, buyerId:o.buyer_id, status:o.status, note:o.note, createdAt:new Date(o.created_at).getTime() }));
  const getProduct = (id: string) => myProducts.find(p => p.id === id);
  const hydrated = ready && !pq.isPending && !oq.isPending;
  async function changeStatus(id: string, status: 'active' | 'paused' | 'sold' | 'removed') {
    if (!uid) throw new Error('Necesitas una cuenta.');
    await updateProductStatus(uid,id,status);
    await qc.invalidateQueries({ queryKey: ['my-products'] });
    invalidateOrderData(qc);
  }
  const [tab, setTab] = useState<Tab>("Resumen");
  const [group, setGroup] = useState<(typeof ORDER_GROUPS)[number]["key"]>("solicitud");
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    const d = loadDraft();
    setDraft(d && hasProgress(d) ? d.title : null);
  }, []);

  const products = myProducts.filter((p) => p.status !== "removed");
  const incoming = orders;
  const completed = incoming.filter((o) => o.status === "completado");
  const revenue = cloudIncoming.filter(o => o.status === "completado").reduce((s,o) => s + (o.product?.price_cents ?? 0) / 100,0);
  const soldCount = completed.length;

  const publishBtn = (
    <Link to="/vender" className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-deep md:px-5 md:py-2.5 md:text-sm">+ Publicar algo</Link>
  );

  if (ready && !uid) return <AppShell><div className="py-24 text-center"><h1 className="text-3xl text-primary">Entra para ver tu tienda</h1><Button asChild className="mt-5"><Link to="/auth" search={{ redirect: '/tienda' }}>Entrar</Link></Button></div></AppShell>;
  if (pq.isError || oq.isError) return <AppShell><div className="py-24 text-center"><p>No pudimos cargar tu tienda.</p><Button className="mt-4" onClick={() => { void pq.refetch(); void oq.refetch(); }}>Reintentar</Button></div></AppShell>;
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl text-foreground md:text-5xl">Tu tienda</h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Administra lo que vendes en Álamos Shop.</p>
          </div>
          {publishBtn}
        </header>

        {!hydrated ? null : products.length === 0 ? (
          <>
            {draft !== null && <div className="mt-6"><SellerDraft title={draft} /></div>}
            <SellerEmptyState />
          </>
        ) : (
          <>
            <nav className="mt-6 flex gap-6 border-b border-border text-sm">
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 pb-3 transition-colors ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
              ))}
            </nav>

            <div key={tab} className="mt-6 space-y-10 animate-in fade-in slide-in-from-bottom-1 duration-300">
              {tab === "Resumen" && (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <SellerStat label="Publicaciones activas" value={products.filter((p) => p.status === "active").length} delay={0} />
                    <SellerStat label="Vendidos" value={soldCount} delay={60} />
                    <SellerStat label="Solicitudes" value={incoming.length} delay={120} />
                    <SellerStat label="Ventas registradas" value={completed.length ? formatPrice(revenue) : null} hint="Antes de comisiones" delay={180} />
                  </div>

                  <SellerInsights products={products} incoming={incoming} />
                  <PendingRequests incoming={incoming} getProduct={getProduct} />
                  {draft !== null && <SellerDraft title={draft} />}

                  <div className="flex flex-wrap gap-2">
                    <Link to="/ordenes" className="rounded-full px-4 py-2 text-sm text-foreground ring-1 ring-border hover:ring-primary/40">Ver órdenes</Link>
                    <Link to="/u/$id" params={{ id: uid ?? "" }} className="rounded-full px-4 py-2 text-sm text-foreground ring-1 ring-border hover:ring-primary/40">Ver mi perfil público</Link>
                    <Link to="/perfil" className="rounded-full px-4 py-2 text-sm text-foreground ring-1 ring-border hover:ring-primary/40">Editar perfil</Link>
                  </div>

                  <Section title="Rendimiento"><AnalyticsPlaceholder /></Section>

                  <div className="grid gap-10 md:grid-cols-2">
                    <Section title="Actividad"><SellerActivity products={products} incoming={incoming} getProduct={getProduct} /></Section>
                    <Section title="Reseñas">{rq.isError ? <Button variant="link" onClick={() => void rq.refetch()}>Reintentar reseñas</Button> : rq.isPending ? <p>Cargando…</p> : rq.data?.length ? <ul className="space-y-2">{rq.data.map(r => <li key={r.id} className="text-sm">{r.stars} ★ {r.text}</li>)}</ul> : <p className="text-sm text-muted-foreground">Aún no tienes reseñas.</p>}</Section>
                  </div>
                </>
              )}

              {tab === "Publicaciones" && (
                <Section title="Tus publicaciones" action={<span className="text-xs text-muted-foreground">{products.length}</span>}>
                  <SellerListings products={products} incoming={incoming} onStatusChange={changeStatus} />
                </Section>
              )}

              {tab === "Solicitudes" && (
                <Section title="Solicitudes y ventas">
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {ORDER_GROUPS.map((g) => {
                      const n = incoming.filter((o) => o.status === g.key).length;
                      return (
                        <button key={g.key} onClick={() => setGroup(g.key)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition ${group === g.key ? "bg-foreground text-background" : "text-muted-foreground ring-1 ring-border"}`}>
                          {g.label}{n > 0 && ` · ${n}`}
                        </button>
                      );
                    })}
                  </div>
                  <OrderList orders={incoming.filter((o) => o.status === group)} getProduct={getProduct} />
                </Section>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
