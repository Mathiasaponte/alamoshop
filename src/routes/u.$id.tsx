import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Ban, Flag, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Avatar } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { REVIEWS, SELLERS } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/u/$id")({
  head: ({ params }) => {
    const s = SELLERS.find((x) => x.id === params.id);
    const title = s ? `${s.name} — Álamos Shop` : "Perfil — Álamos Shop";
    const desc = s ? `${s.level} · ${s.campus}. ${s.bio}` : "Perfil de estudiante vendedor en Álamos Shop.";
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }] };
  },
  component: SellerPage,
});

function SellerPage() {
  const { id } = Route.useParams();
  const { getSeller, allProducts, block } = useStore();
  const seller = getSeller(id);
  const [tab, setTab] = useState<"activos" | "vendidos" | "resenas">("activos");
  if (!seller) return <AppShell><p className="p-10 text-center">Perfil no encontrado.</p></AppShell>;
  const products = allProducts.filter((p) => p.sellerId === id);
  const active = products.filter((p) => p.status === "active" || p.status === "reserved");
  const sold = products.filter((p) => p.status === "sold");
  const reviews = REVIEWS.filter((r) => r.sellerId === id);

  return (
    <AppShell>
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-10 text-center md:px-6">
          <Avatar initials={seller.initials} size={88} />
          <h1 className="mt-4 text-3xl text-primary">{seller.name}</h1>
          <p className="text-sm text-muted-foreground">{seller.level} · {seller.campus}</p>
          <div className="mt-4 flex gap-6 text-sm">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold text-gold" /> {seller.rating > 0 ? seller.rating.toFixed(1) : "Nuevo"}</span>
            <span>{seller.reviews} reseñas</span>
            <span>{seller.sales} ventas</span>
          </div>
          {seller.bio && <p className="mt-4 max-w-md italic text-foreground">“{seller.bio}”</p>}
          <p className="mt-3 text-xs text-muted-foreground">En Álamos Shop desde {seller.since}</p>
          {id !== "me" && (
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <button onClick={() => toast.success("Reporte enviado a moderación.")} className="flex items-center gap-1 hover:text-destructive"><Flag className="h-3.5 w-3.5" /> Reportar</button>
              <button onClick={() => { block(id); toast("Usuario bloqueado. Ya no verás sus publicaciones."); }} className="flex items-center gap-1 hover:text-destructive"><Ban className="h-3.5 w-3.5" /> Bloquear</button>
            </div>
          )}
        </div>
        <div className="mx-auto flex max-w-6xl justify-center gap-6 px-4 text-sm">
          {([["activos", `Activos (${active.length})`], ["vendidos", `Vendidos (${sold.length})`], ["resenas", `Reseñas (${reviews.length})`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`border-b-2 pb-3 ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {tab === "resenas" ? (
          <div className="space-y-3">
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay reseñas.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="surface-card p-4">
                <p className="text-sm text-gold">{"★".repeat(r.stars)}<span className="text-border">{"★".repeat(5 - r.stars)}</span></p>
                <p className="mt-1 text-sm text-foreground">{r.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">— {r.author}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(tab === "activos" ? active : sold).map((p) => <ProductCard key={p.id} product={p} />)}
            {(tab === "activos" ? active : sold).length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nada que mostrar.</p>}
          </div>
        )}
      </div>
    </AppShell>
  );
}
