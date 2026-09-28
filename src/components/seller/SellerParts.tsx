import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { formatPrice, type Product } from "@/lib/data";
import { ORDER_LABEL, type Order, type OrderStatus } from "@/lib/store";

export const STATUS_CHIP: Partial<Record<Product["status"], { label: string; cls: string }>> = {
  active: { label: "Activo", cls: "bg-primary/10 text-primary" },
  paused: { label: "Pausado", cls: "bg-muted text-muted-foreground" },
  reserved: { label: "Reservado", cls: "bg-gold/15 text-gold-foreground" },
  sold: { label: "Vendido", cls: "bg-foreground/10 text-foreground" },
  pending: { label: "En revisión", cls: "bg-muted text-muted-foreground" },
  draft: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
};

export function StatusChip({ status }: { status: Product["status"] }) {
  const s = STATUS_CHIP[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${s.cls}`}>{s.label}</span>;
}

export const fmtDate = (t: number) => new Date(t).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

/** Métrica individual. value = null → "Aún sin datos" (nunca inventamos). */
export function SellerStat({ label, value, hint, delay = 0 }: { label: string; value: ReactNode | null; hint?: string; delay?: number }) {
  return (
    <div className="surface-card p-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 md:p-5" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {value === null ? (
        <p className="mt-2 text-sm text-muted-foreground">Aún sin datos</p>
      ) : (
        <p className="mt-1 text-2xl font-medium tabular-nums text-foreground md:text-3xl">{value}</p>
      )}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SellerEmptyState() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-2xl">🛍️</div>
      <h2 className="mt-6 text-3xl text-foreground">Tu tienda está vacía.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Publica algo y empieza a vender dentro de tu comunidad.</p>
      <Link to="/vender" className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-deep">Crear mi primera publicación</Link>
    </div>
  );
}

export function SellerDraft({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-secondary/50 p-4">
      <div className="min-w-0">
        <p className="eyebrow">Borradores</p>
        <p className="mt-1 truncate text-sm text-foreground">{title || "Publicación sin terminar"}</p>
      </div>
      <Link to="/vender" className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-primary ring-1 ring-primary/30 hover:bg-primary/5">Continuar</Link>
    </div>
  );
}

/** Mensajes contextuales derivados solo de datos reales. */
export function SellerInsights({ products, incoming }: { products: Product[]; incoming: Order[] }) {
  const msgs: string[] = [];
  const pending = incoming.filter((o) => o.status === "solicitud").length;
  if (pending) msgs.push(pending === 1 ? "Tienes una solicitud pendiente." : `Tienes ${pending} solicitudes pendientes.`);
  if (products.some((p) => p.status === "reserved")) msgs.push("Tienes un producto reservado.");
  if (incoming.some((o) => o.status === "completado")) msgs.push("Completaste una venta.");
  if (!msgs.length && products.some((p) => p.status === "active")) msgs.push("Tus publicaciones ya están visibles en el marketplace.");
  if (!msgs.length) return null;
  return (
    <div className="space-y-1">
      {msgs.map((m) => (
        <p key={m} className="flex items-center gap-2 text-sm text-foreground"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{m}</p>
      ))}
    </div>
  );
}

export const ORDER_GROUPS: { key: OrderStatus; label: string }[] = [
  { key: "solicitud", label: "Pendientes" },
  { key: "aceptada", label: "Aceptadas" },
  { key: "coordinando", label: "Coordinando" },
  { key: "entregado", label: "Entregadas" },
  { key: "completado", label: "Completadas" },
];

export function PendingRequests({ incoming, getProduct }: { incoming: Order[]; getProduct: (id: string) => Product | undefined }) {
  const pending = incoming.filter((o) => o.status === "solicitud");
  if (!pending.length) return null;
  return (
    <div className="space-y-2">
      {pending.slice(0, 3).map((o) => (
        <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/15">
          <p className="min-w-0 text-sm text-foreground">1 persona quiere comprar <span className="font-medium">{getProduct(o.productId)?.title ?? "tu producto"}</span>.</p>
          <Link to="/ordenes/$id" params={{ id: o.id }} className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-deep">Ver solicitud</Link>
        </div>
      ))}
    </div>
  );
}

export function OrderList({ orders, getProduct }: { orders: Order[]; getProduct: (id: string) => Product | undefined }) {
  if (!orders.length) return <p className="py-8 text-center text-sm text-muted-foreground">Nada por aquí todavía.</p>;
  return (
    <div className="divide-y divide-border rounded-xl bg-card ring-1 ring-border">
      {orders.map((o) => {
        const p = getProduct(o.productId);
        return (
          <Link key={o.id} to="/ordenes/$id" params={{ id: o.id }} className="flex items-center gap-3 p-3 hover:bg-secondary/60">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">{p?.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{p?.title ?? "Producto"}</p>
              <p className="text-xs text-muted-foreground">{ORDER_LABEL[o.status]} · {fmtDate(o.createdAt)}</p>
            </div>
            {p && <span className="shrink-0 text-sm text-foreground">{formatPrice(p.price)}</span>}
          </Link>
        );
      })}
    </div>
  );
}

type Event = { t: number; text: string };
export function SellerActivity({ products, incoming, getProduct }: { products: Product[]; incoming: Order[]; getProduct: (id: string) => Product | undefined }) {
  const events: Event[] = [
    ...products.map((p) => ({ t: p.createdAt, text: `Publicaste ${p.title}.` })),
    ...incoming.map((o) => ({ t: o.createdAt, text: `Recibiste una solicitud por ${getProduct(o.productId)?.title ?? "un producto"}.` })),
  ].sort((a, b) => b.t - a.t).slice(0, 5);
  if (!events.length) return null;
  return (
    <ol className="space-y-3">
      {events.map((e, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="w-14 shrink-0 text-xs text-muted-foreground">{fmtDate(e.t)}</span>
          <span className="text-foreground">{e.text}</span>
        </li>
      ))}
    </ol>
  );
}

/** Espacio para analytics futuros; se conectará a backend. */
export function AnalyticsPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <div className="mx-auto flex h-16 max-w-xs items-end justify-center gap-2 opacity-40" aria-hidden>
        {[30, 50, 40, 70, 55].map((h, i) => <span key={i} className="w-4 rounded-t bg-muted-foreground/30" style={{ height: `${h}%` }} />)}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Aquí aparecerá el rendimiento de tu tienda cuando tengamos más datos.</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Visitas · Favoritos recibidos · Conversión — próximamente</p>
    </div>
  );
}

export function SellerReviews({ incoming }: { incoming: Order[] }) {
  const reviews = incoming.filter((o) => o.review);
  if (!reviews.length) return <p className="text-sm text-muted-foreground">Aún no tienes reseñas. Aparecerán cuando completes ventas.</p>;
  const avg = reviews.reduce((s, o) => s + (o.review?.stars ?? 0), 0) / reviews.length;
  return (
    <div>
      <p className="text-sm text-foreground"><span className="font-display text-2xl">{avg.toFixed(1)}</span> ★ · {reviews.length} reseña{reviews.length > 1 ? "s" : ""}</p>
      <ul className="mt-3 space-y-2">
        {reviews.slice(0, 3).map((o) => o.review?.text && <li key={o.id} className="text-sm text-muted-foreground">“{o.review.text}”</li>)}
      </ul>
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
