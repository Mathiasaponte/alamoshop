import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { formatPrice } from "@/lib/data";
import { ORDER_LABEL, useStore } from "@/lib/store";

export const Route = createFileRoute("/tienda")({
  head: () => ({
    meta: [
      { title: "Mi tienda — Álamos Shop" },
      { name: "description", content: "Administra tus productos, órdenes, ventas y reseñas en Álamos Shop." },
      { property: "og:title", content: "Mi tienda — Álamos Shop" },
      { property: "og:description", content: "Tu panel de vendedor en Álamos Shop." },
    ],
  }),
  component: Tienda,
});

const TABS = ["Resumen", "Mis productos", "Órdenes", "Ventas", "Mensajes", "Reseñas", "Perfil"] as const;

function Tienda() {
  const { myProducts, orders, me, setProductStatus, getProduct } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumen");
  const incoming = orders.filter((o) => myProducts.some((p) => p.id === o.productId));
  const sales = incoming.filter((o) => o.status === "completado");
  const revenue = sales.reduce((s, o) => s + (getProduct(o.productId)?.price ?? 0), 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PageTitle
          title="Mi tienda"
          subtitle={me ? `${me.name} · ${me.level} · ${me.campus}` : "Crea tu perfil para empezar a vender."}
          action={<Link to="/vender" className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">+ Publicar producto</Link>}
        />
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-background ring-1 ring-border"}`}>{t}</button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "Resumen" && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[["Activos", myProducts.filter((p) => p.status === "active").length], ["Órdenes nuevas", incoming.filter((o) => o.status === "solicitud").length], ["Ventas", sales.length], ["Ingresos", formatPrice(revenue)]].map(([l, v]) => (
                <div key={l} className="surface-card p-5"><p className="eyebrow">{l}</p><p className="mt-2 font-display text-3xl text-primary">{v}</p></div>
              ))}
            </div>
          )}
          {tab === "Mis productos" && (
            <div className="space-y-2">
              {myProducts.length === 0 && <Empty text="Aún no has publicado nada." />}
              {myProducts.map((p) => (
                <div key={p.id} className="surface-card flex items-center gap-3 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">{p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
                  <Link to="/p/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                  </Link>
                  <select value={p.status} onChange={(e) => setProductStatus(p.id, e.target.value as never)} className="rounded-md border border-input bg-background px-2 py-1.5 text-xs">
                    <option value="active">Activo</option>
                    <option value="reserved">Reservado</option>
                    <option value="sold">Vendido</option>
                    <option value="removed">Eliminado</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          {(tab === "Órdenes" || tab === "Ventas") && (
            <div className="space-y-2">
              {(tab === "Órdenes" ? incoming.filter((o) => o.status !== "completado") : sales).map((o) => (
                <Link key={o.id} to="/ordenes/$id" params={{ id: o.id }} className="surface-card flex justify-between p-4 text-sm">
                  <span>{getProduct(o.productId)?.title}</span><span className="text-primary">{ORDER_LABEL[o.status]}</span>
                </Link>
              ))}
              {(tab === "Órdenes" ? incoming.filter((o) => o.status !== "completado") : sales).length === 0 && <Empty text={tab === "Órdenes" ? "Cuando alguien solicite tus productos aparecerá aquí." : "Tus ventas completadas aparecerán aquí."} />}
            </div>
          )}
          {tab === "Mensajes" && <Empty text="Los contactos se desbloquean cuando aceptas una solicitud. Aquí verás a los compradores con quienes coordinas entregas." />}
          {tab === "Reseñas" && <Empty text="Tus reseñas aparecerán después de tu primera venta completada." />}
          {tab === "Perfil" && <Link to="/perfil" className="text-sm text-primary underline">Editar mi perfil</Link>}
        </div>
      </div>
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="surface-card p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
