import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice } from "@/lib/data";
import { ORDER_LABEL, useStore, type OrderStatus } from "@/lib/store";

export const Route = createFileRoute("/ordenes/")({
  head: () => ({
    meta: [
      { title: "Mis compras — Álamos Shop" },
      { name: "description", content: "Sigue tus solicitudes, órdenes aceptadas, entregas y compras completadas." },
      { property: "og:title", content: "Mis compras — Álamos Shop" },
      { property: "og:description", content: "Tus órdenes dentro de Álamos Shop." },
    ],
  }),
  component: Ordenes,
});

const GROUPS: { label: string; match: OrderStatus[] }[] = [
  { label: "Pendientes", match: ["solicitud"] },
  { label: "Aceptadas", match: ["aceptada"] },
  { label: "Por entregar", match: ["coordinando", "entregado"] },
  { label: "Completadas", match: ["completado"] },
  { label: "Canceladas", match: ["cancelado", "rechazado"] },
];

function Ordenes() {
  const { orders, getProduct, favorites, allProducts } = useStore();
  const [tab, setTab] = useState<string>("Todas");
  const mine = orders.filter((o) => o.buyerId === "me");
  const shown = tab === "Todas" ? mine : tab === "Favoritos" ? [] : mine.filter((o) => GROUPS.find((g) => g.label === tab)!.match.includes(o.status));

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <PageTitle title="Mis compras" subtitle="Tus solicitudes y órdenes." action={<Link to="/tienda" className="text-sm text-primary underline-offset-4 hover:underline">Mi tienda →</Link>} />
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {["Todas", ...GROUPS.map((g) => g.label), "Favoritos"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-background ring-1 ring-border"}`}>{t}</button>
          ))}
        </div>
        {tab === "Favoritos" ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allProducts.filter((p) => favorites.includes(p.id)).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {shown.length === 0 && (
              <div className="surface-card p-10 text-center">
                <p className="font-display text-2xl text-primary">Sin órdenes aquí</p>
                <Link to="/marketplace" className="mt-3 inline-block text-sm text-primary underline">Explorar el marketplace</Link>
              </div>
            )}
            {shown.map((o) => {
              const p = getProduct(o.productId);
              return (
                <Link key={o.id} to="/ordenes/$id" params={{ id: o.id }} className="surface-card flex items-center gap-3 p-3 transition-colors hover:border-primary">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">{p?.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p?.title}</p>
                    <p className="text-xs text-muted-foreground">{p && formatPrice(p.price)}</p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs text-primary">{ORDER_LABEL[o.status]}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
