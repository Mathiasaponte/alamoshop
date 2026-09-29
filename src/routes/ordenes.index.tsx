import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { formatPrice } from "@/lib/data";
import { useSession } from "@/lib/use-session";
import { useImageUrls } from "@/lib/images";
import { coverOf, fetchMyOrders, ORDER_LABEL, useOrdersRealtime, type CloudOrder, type OrderStatus } from "@/lib/orders";

export const Route = createFileRoute("/ordenes/")({
  head: () => ({
    meta: [
      { title: "Mis órdenes — Álamos Shop" },
      { name: "description", content: "Sigue tus compras y ventas: solicitudes, entregas y órdenes completadas." },
      { property: "og:title", content: "Mis órdenes — Álamos Shop" },
      { property: "og:description", content: "Tus órdenes dentro de Álamos Shop." },
    ],
  }),
  component: Ordenes,
});

const GROUPS: { label: string; match: OrderStatus[] }[] = [
  { label: "Pendientes", match: ["solicitud"] },
  { label: "En curso", match: ["aceptada", "coordinando", "entregado"] },
  { label: "Completadas", match: ["completado"] },
  { label: "Canceladas", match: ["cancelado", "rechazado"] },
];

function Ordenes() {
  const { user, ready } = useSession();
  const uid = user?.id ?? null;
  useOrdersRealtime(uid);
  const q = useQuery({ queryKey: ["orders", uid], queryFn: () => fetchMyOrders(uid!), enabled: !!uid });
  const [role, setRole] = useState<"compras" | "ventas">("compras");
  const [tab, setTab] = useState("Todas");

  if (ready && !uid)
    return (
      <AppShell>
        <div className="py-24 text-center">
          <p className="font-display text-2xl text-primary">Entra para ver tus órdenes</p>
          <Link to="/auth" search={{ redirect: "/ordenes" }} className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Entrar</Link>
        </div>
      </AppShell>
    );

  const all = (q.data ?? []).filter((o) => (role === "compras" ? o.buyer_id === uid : o.seller_id === uid));
  const shown = tab === "Todas" ? all : all.filter((o) => GROUPS.find((g) => g.label === tab)!.match.includes(o.status));
  const pendingSales = (q.data ?? []).filter((o) => o.seller_id === uid && o.status === "solicitud").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <PageTitle title="Mis órdenes" subtitle="Tus compras y ventas." />
        <div className="mt-6 grid grid-cols-2 rounded-full bg-accent p-1 text-sm">
          {(["compras", "ventas"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`rounded-full py-2 ${role === r ? "bg-background font-medium text-primary shadow-sm" : "text-muted-foreground"}`}>
              {r === "compras" ? "Compras" : `Ventas${pendingSales ? ` (${pendingSales})` : ""}`}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {["Todas", ...GROUPS.map((g) => g.label)].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-background ring-1 ring-border"}`}>{t}</button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {q.isError && (
            <div className="surface-card p-10 text-center">
              <p className="text-sm text-muted-foreground">No pudimos cargar tus órdenes.</p>
              <button onClick={() => void q.refetch()} className="mt-3 text-sm text-primary underline">Reintentar</button>
            </div>
          )}
          {(q.isPending || !ready) && !q.isError && <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>}
          {q.isSuccess && shown.length === 0 && (
            <div className="surface-card p-10 text-center">
              <p className="font-display text-2xl text-primary">Sin órdenes aquí</p>
              <Link to="/marketplace" className="mt-3 inline-block text-sm text-primary underline">Explorar el marketplace</Link>
            </div>
          )}
          {shown.map((o) => <OrderRow key={o.id} o={o} role={role} />)}
        </div>
      </div>
    </AppShell>
  );
}

function OrderRow({ o, role }: { o: CloudOrder; role: "compras" | "ventas" }) {
  const path = coverOf(o);
  const { data: urls } = useImageUrls(path ? [path] : []);
  const other = role === "compras" ? o.seller?.display_name : o.buyer?.display_name;
  return (
    <Link to="/ordenes/$id" params={{ id: o.id }} className="surface-card flex items-center gap-3 p-3 transition-colors hover:border-primary">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">{urls?.[0] && <img src={urls[0]} alt="" className="h-full w-full object-cover" />}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{o.product?.title ?? "Publicación no disponible"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {o.product && formatPrice(o.product.price_cents / 100)}{other && ` · ${role === "compras" ? "Vende" : "Compra"} ${other}`}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs text-primary">{ORDER_LABEL[o.status]}</span>
    </Link>
  );
}
