import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Instagram, MessageCircle, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatPrice } from "@/lib/data";
import { useSession } from "@/lib/use-session";
import { useImageUrls } from "@/lib/images";
import {
  coverOf, createReview, fetchMyReview, fetchOrder, fetchOrderContact, invalidateOrderData, ORDER_LABEL,
  transitionOrder, useOrdersRealtime, type CloudOrder, type OrderStatus,
} from "@/lib/orders";

export const Route = createFileRoute("/ordenes/$id")({
  head: () => ({
    meta: [
      { title: "Orden — Álamos Shop" },
      { name: "description", content: "Detalle y seguimiento de una orden en Álamos Shop." },
      { property: "og:title", content: "Orden — Álamos Shop" },
      { property: "og:description", content: "Seguimiento de tu orden." },
    ],
  }),
  component: OrderPage,
});

const FLOW: OrderStatus[] = ["solicitud", "aceptada", "coordinando", "entregado", "completado"];

type Action = { to: OrderStatus; label: string; primary?: boolean };
function actionsFor(o: CloudOrder, isSeller: boolean): Action[] {
  if (isSeller) {
    if (o.status === "solicitud") return [{ to: "aceptada", label: "Aceptar", primary: true }, { to: "rechazado", label: "Rechazar" }];
    if (o.status === "aceptada") return [{ to: "coordinando", label: "Marcar coordinando", primary: true }];
    if (o.status === "coordinando") return [{ to: "entregado", label: "Marcar entregado", primary: true }];
    return [];
  }
  if (o.status === "entregado") return [{ to: "completado", label: "Confirmar que lo recibí", primary: true }];
  if (["solicitud", "aceptada", "coordinando"].includes(o.status)) return [{ to: "cancelado", label: "Cancelar solicitud" }];
  return [];
}

const HINT: Partial<Record<OrderStatus, [string, string]>> = {
  solicitud: ["Esperando respuesta del vendedor.", "Nueva solicitud: acepta o rechaza."],
  aceptada: ["¡Aceptada! Ya puedes ver el contacto del vendedor.", "Aceptaste. Coordina la entrega con el comprador."],
  coordinando: ["Coordinando la entrega.", "Cuando entregues, márcalo como entregado."],
  entregado: ["El vendedor marcó la entrega. Confirma cuando lo tengas.", "Esperando que el comprador confirme."],
  completado: ["Compra completada.", "Venta terminada."],
  cancelado: ["Esta orden se canceló.", "El comprador canceló."],
  rechazado: ["El vendedor rechazó la solicitud.", "Rechazaste esta solicitud."],
};

function OrderPage() {
  const { id } = Route.useParams();
  const { user, ready } = useSession();
  const uid = user?.id ?? null;
  useOrdersRealtime(uid);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["order", id, uid], queryFn: () => fetchOrder(id), enabled: !!uid });
  const o = q.data;
  const showContact = !!o && ["aceptada", "coordinando", "entregado", "completado"].includes(o.status);
  const contact = useQuery({ queryKey: ["contact", id, o?.status], queryFn: () => fetchOrderContact(id), enabled: showContact });
  const path = o ? coverOf(o) : undefined;
  const { data: urls } = useImageUrls(path ? [path] : []);
  const [busy, setBusy] = useState<OrderStatus | null>(null);

  if (ready && !uid)
    return (
      <AppShell>
        <div className="py-24 text-center">
          <p className="font-display text-2xl text-primary">Entra para ver esta orden</p>
          <Link to="/auth" search={{ redirect: `/ordenes/${id}` }} className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Entrar</Link>
        </div>
      </AppShell>
    );
  if (!ready || q.isPending) return <AppShell><p className="py-24 text-center text-sm text-muted-foreground">Cargando…</p></AppShell>;
  if (q.isError || !o)
    return (
      <AppShell>
        <div className="py-24 text-center">
          <p className="font-display text-2xl text-primary">{q.isError ? "No pudimos cargar la orden." : "Esta orden no existe o no participas en ella."}</p>
          <Link to="/ordenes" className="mt-5 inline-block text-sm text-primary underline">Mis órdenes</Link>
        </div>
      </AppShell>
    );

  const isSeller = o.seller_id === uid;
  const step = FLOW.indexOf(o.status);
  const acts = actionsFor(o, isSeller);

  async function run(to: OrderStatus) {
    setBusy(to);
    try {
      await transitionOrder(o!.id, to);
      toast.success(ORDER_LABEL[to]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el estado");
    } finally {
      invalidateOrderData(qc);
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-5 py-6 md:py-10">
        <Link to="/ordenes" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Mis órdenes</Link>
        <p className="eyebrow">{isSeller ? "Venta" : "Compra"}</p>
        <div className="surface-card mt-2 flex items-center gap-4 p-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">{urls?.[0] && <img src={urls[0]} alt="" className="h-full w-full object-cover" />}</div>
          <div className="min-w-0">
            {o.product ? (
              <Link to="/p/$id" params={{ id: o.product.id }} className="block truncate text-lg font-medium text-foreground hover:text-primary">{o.product.title}</Link>
            ) : <p className="text-lg text-muted-foreground">Publicación no disponible</p>}
            {o.product && <p className="font-display text-xl">{formatPrice(o.product.price_cents / 100)}</p>}
            <p className="text-xs text-muted-foreground">{isSeller ? `Comprador: ${o.buyer?.display_name || "Estudiante"}` : `Vendedor: ${o.seller?.display_name || "Estudiante"}`}</p>
          </div>
        </div>

        <h1 className="mt-6 text-3xl text-primary">{ORDER_LABEL[o.status]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{HINT[o.status]?.[isSeller ? 1 : 0]}</p>

        {step >= 0 && (
          <ol className="mt-5 grid grid-cols-5 gap-1">
            {FLOW.map((s, i) => (
              <li key={s} className="text-center">
                <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</div>
                <p className="mt-1 text-[0.65rem] leading-tight text-muted-foreground">{ORDER_LABEL[s]}</p>
              </li>
            ))}
          </ol>
        )}

        {o.note && (
          <div className="surface-card mt-5 p-4">
            <p className="text-xs text-muted-foreground">Mensaje del comprador</p>
            <p className="mt-1 whitespace-pre-line text-sm">{o.note}</p>
          </div>
        )}

        {showContact && (
          <div className="surface-card mt-5 p-4">
            <p className="text-xs text-muted-foreground">Contacto de {contact.data?.display_name || (isSeller ? "el comprador" : "el vendedor")}</p>
            {contact.isPending ? <p className="mt-1 text-sm text-muted-foreground">Cargando…</p> : contact.data && (contact.data.instagram || contact.data.whatsapp) ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {contact.data.instagram && <a href={`https://instagram.com/${contact.data.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary"><Instagram className="h-4 w-4" />@{contact.data.instagram.replace(/^@/, "")}</a>}
                {contact.data.whatsapp && <a href={`https://wa.me/${contact.data.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary"><MessageCircle className="h-4 w-4" />{contact.data.whatsapp}</a>}
              </div>
            ) : <p className="mt-1 text-sm text-muted-foreground">No agregó contactos todavía.</p>}
          </div>
        )}

        {acts.length > 0 && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {acts.map((a) => (
              <button key={a.to} disabled={!!busy} onClick={() => void run(a.to)}
                className={`flex-1 rounded-full py-3.5 text-sm font-medium disabled:opacity-50 ${a.primary ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:border-primary"}`}>
                {busy === a.to ? "Un momento…" : a.label}
              </button>
            ))}
          </div>
        )}

        {!isSeller && o.status === "completado" && uid && <ReviewBox o={o} uid={uid} />}
      </div>
    </AppShell>
  );
}

function ReviewBox({ o, uid }: { o: CloudOrder; uid: string }) {
  const qc = useQueryClient();
  const mine = useQuery({ queryKey: ["my-review", o.id], queryFn: () => fetchMyReview(o.id, uid) });
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  if (mine.isPending) return null;
  if (mine.data)
    return (
      <div className="surface-card mt-6 p-4">
        <p className="text-xs text-muted-foreground">Tu reseña</p>
        <p className="mt-1 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < mine.data!.stars ? "fill-gold text-gold" : "text-muted-foreground"}`} />)}</p>
        {mine.data.text && <p className="mt-2 text-sm">{mine.data.text}</p>}
      </div>
    );
  async function send() {
    setBusy(true);
    try {
      await createReview(o, uid, stars, text);
      toast.success("¡Gracias por tu reseña!");
      invalidateOrderData(qc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos guardar la reseña");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="surface-card mt-6 p-4">
      <p className="font-medium">¿Cómo te fue con {o.seller?.display_name || "el vendedor"}?</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} aria-label={`${n} estrellas`} onClick={() => setStars(n)}><Star className={`h-7 w-7 ${n <= stars ? "fill-gold text-gold" : "text-muted-foreground"}`} /></button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} placeholder="Comentario opcional" className="field mt-3 w-full" />
      <button disabled={!stars || busy} onClick={() => void send()} className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40">
        {busy ? "Enviando…" : "Publicar reseña"}
      </button>
    </div>
  );
}
