import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Instagram, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Avatar } from "@/components/AppShell";
import { formatPrice } from "@/lib/data";
import { ORDER_FLOW, ORDER_LABEL, useStore } from "@/lib/store";

export const Route = createFileRoute("/ordenes/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de orden — Álamos Shop" },
      { name: "description", content: "Estado de tu orden y coordinación de entrega en Álamos Shop." },
      { property: "og:title", content: "Detalle de orden — Álamos Shop" },
      { property: "og:description", content: "Sigue tu orden paso a paso." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { orders, getProduct, getSeller, setOrderStatus, reviewOrder, hydrated } = useStore();
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const order = orders.find((o) => o.id === id);
  if (!order) return <AppShell><p className="p-10 text-center text-muted-foreground">{hydrated ? "Orden no encontrada." : "Cargando…"}</p></AppShell>;
  const product = getProduct(order.productId);
  const seller = product && getSeller(product.sellerId);
  const idx = ORDER_FLOW.indexOf(order.status as never);
  const closed = order.status === "cancelado" || order.status === "rechazado";
  const contactUnlocked = idx >= 2;
  const handle = seller?.name.toLowerCase().replace(/[^a-z]/g, "") ?? "";

  const next: Record<string, { label: string; to: (typeof ORDER_FLOW)[number]; demo?: boolean }> = {
    solicitud: { label: "Simular: el vendedor acepta", to: "aceptada", demo: true },
    aceptada: { label: "Coordinar entrega", to: "coordinando" },
    coordinando: { label: "Marcar como entregado", to: "entregado" },
    entregado: { label: "Confirmar y completar", to: "completado" },
  };
  const action = next[order.status];

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/ordenes" className="text-sm text-muted-foreground hover:text-primary">← Mis compras</Link>
        {product && (
          <Link to="/p/$id" params={{ id: product.id }} className="surface-card mt-4 flex items-center gap-4 p-4">
            <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted">{product.images[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}</div>
            <div>
              <p className="font-medium text-foreground">{product.title}</p>
              <p className="font-display text-2xl text-primary">{formatPrice(product.price)}</p>
            </div>
          </Link>
        )}

        <div className="surface-card mt-4 p-5">
          <p className="eyebrow">Estado</p>
          <p className="mt-1 font-display text-3xl text-primary">{ORDER_LABEL[order.status]}</p>
          {!closed && (
            <ol className="mt-5 space-y-3">
              {[...ORDER_FLOW, "reseña" as const].map((s, i) => {
                const done = i <= idx || (s === "reseña" && !!order.review);
                return (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground ring-1 ring-border"}`}>
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className={done ? "text-foreground" : "text-muted-foreground"}>{s === "reseña" ? "Reseña" : ORDER_LABEL[s]}</span>
                  </li>
                );
              })}
            </ol>
          )}
          {order.note && <p className="mt-4 rounded-lg bg-accent p-3 text-sm">Tu mensaje: “{order.note}”</p>}
        </div>

        {seller && (
          <div className="surface-card mt-4 p-5">
            <div className="flex items-center gap-3">
              <Avatar initials={seller.initials} />
              <div><p className="font-medium text-foreground">{seller.name}</p><p className="text-xs text-muted-foreground">{seller.level} · {seller.campus}</p></div>
            </div>
            {contactUnlocked && !closed ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm hover:border-primary"><Instagram className="h-4 w-4" /> @{handle}</a>
                <a href="https://wa.me/" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm hover:border-primary"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">🔒 El contacto se desbloquea cuando la orden pasa a “Coordinando entrega”.</p>
            )}
          </div>
        )}

        {!closed && action && (
          <div className="mt-6 space-y-2">
            <button onClick={() => { setOrderStatus(order.id, action.to); toast.success(ORDER_LABEL[action.to]); }} className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground">
              {action.label}
            </button>
            {action.demo && <p className="text-center text-[0.7rem] text-muted-foreground">Modo demo: en la versión real el vendedor acepta desde su tienda.</p>}
            {idx < 2 && <button onClick={() => setOrderStatus(order.id, "cancelado")} className="w-full py-2 text-sm text-muted-foreground hover:text-destructive">Cancelar solicitud</button>}
          </div>
        )}

        {order.status === "completado" && !order.review && (
          <div className="surface-card mt-6 p-5">
            <p className="font-display text-2xl text-primary">¿Cómo te fue?</p>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setStars(n)} aria-label={`${n} estrellas`}><Star className={`h-8 w-8 ${n <= stars ? "fill-gold text-gold" : "text-border"}`} /></button>
              ))}
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Comentario opcional" className="mt-3 w-full rounded-md border border-input bg-background p-3 text-sm" />
            <button onClick={() => { reviewOrder(order.id, stars, text); toast.success("¡Gracias por tu reseña!"); }} className="mt-3 w-full rounded-full bg-primary py-3 text-sm text-primary-foreground">Enviar reseña</button>
          </div>
        )}
        {order.review && <p className="mt-6 text-center text-sm text-muted-foreground">Calificaste esta compra con {"★".repeat(order.review.stars)}</p>}
      </div>
    </AppShell>
  );
}
