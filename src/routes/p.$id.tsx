import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MapPin, ShieldCheck, Star } from "lucide-react";
import { AppShell, Avatar } from "@/components/AppShell";
import { formatPrice } from "@/lib/data";
import { fetchProduct, fetchSeller } from "@/lib/catalog";
import { useImageUrls } from "@/lib/images";

export const Route = createFileRoute("/p/$id")({
  head: () => ({
    meta: [
      { title: "Publicación — Álamos Shop" },
      { name: "description", content: "Publicación de un estudiante en Álamos Shop." },
      { property: "og:title", content: "Publicación — Álamos Shop" },
      { property: "og:description", content: "Mira lo que vende un estudiante de Álamos." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "E";

function ProductPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => fetchProduct(id) });
  const sellerId = q.data?.product.sellerId;
  const { data: seller } = useQuery({ queryKey: ["seller", sellerId], queryFn: () => fetchSeller(sellerId!), enabled: !!sellerId });
  const { data: urls = [] } = useImageUrls(q.data?.paths ?? []);
  const [active, setActive] = useState(0);

  if (q.isPending) return <AppShell><p className="py-24 text-center text-sm text-muted-foreground">Cargando…</p></AppShell>;
  if (q.isError)
    return (
      <AppShell>
        <div className="py-24 text-center">
          <p className="font-display text-2xl text-primary">No pudimos cargar la publicación.</p>
          <button onClick={() => void q.refetch()} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Reintentar</button>
        </div>
      </AppShell>
    );
  if (!q.data)
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <p className="font-display text-3xl text-primary">Esta publicación ya no está disponible</p>
          <p className="mt-2 text-sm text-muted-foreground">Puede haber sido pausada o eliminada.</p>
          <Link to="/marketplace" className="mt-6 inline-block text-sm text-primary underline">Volver al marketplace</Link>
        </div>
      </AppShell>
    );

  const p = q.data.product;
  const status = p.status === "reserved" ? "Reservado" : p.status === "sold" ? "Vendido" : "Disponible";

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-5 py-6 md:py-10">
        <Link to="/marketplace" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Marketplace</Link>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
              {urls[active] ? <img src={urls[active]} alt={p.title} className="h-full w-full object-cover animate-in fade-in duration-500" /> : <div className="flex h-full items-center justify-center text-5xl">📦</div>}
            </div>
            {urls.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {urls.map((u, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`overflow-hidden rounded-lg ring-2 ${i === active ? "ring-primary" : "ring-transparent"}`}>
                    <img src={u} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="eyebrow">{p.category}{p.status !== "active" && ` · ${status}`}</p>
            <h1 className="mt-2 text-4xl text-primary">{p.title}</h1>
            <p className="mt-2 font-display text-3xl text-foreground">{formatPrice(p.price)}</p>
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Estado</p><p className="font-medium">{p.condition}</p></div>
              <div><p className="text-xs text-muted-foreground">Disponibilidad</p><p className="font-medium">{status}</p></div>
              <div><p className="text-xs text-muted-foreground">Campus · Nivel</p><p className="font-medium">{p.campus} · {p.level}</p></div>
              <div><p className="text-xs text-muted-foreground">Entrega</p><p className="flex items-center gap-1 font-medium"><MapPin className="h-3.5 w-3.5" />{p.delivery.join(" · ") || "Por acordar"}</p></div>
            </div>
            <Link to="/u/$id" params={{ id: p.sellerId }} className="surface-card mt-6 flex items-center gap-3 p-4 hover:ring-1 hover:ring-primary/30">
              <Avatar initials={initials(p.sellerName ?? "")} size={44} />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{p.sellerName}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {seller && seller.reviews > 0 ? <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-gold text-gold" />{seller.rating} ({seller.reviews})</span> : <span>Sin reseñas aún</span>}
                  {seller && seller.sales > 0 && <span>· {seller.sales} {seller.sales === 1 ? "venta" : "ventas"}</span>}
                </p>
              </div>
            </Link>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Los contactos solo se comparten cuando el vendedor acepta una solicitud.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
