import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { AppShell, Avatar } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { fetchCatalogPage, fetchSeller } from "@/lib/catalog";

export const Route = createFileRoute("/u/$id")({
  head: () => ({
    meta: [
      { title: "Vendedor — Álamos Shop" },
      { name: "description", content: "Perfil público de un vendedor de Álamos Shop." },
      { property: "og:title", content: "Vendedor — Álamos Shop" },
      { property: "og:description", content: "Mira lo que vende este estudiante de Álamos." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SellerPage,
});

function SellerPage() {
  const { id } = Route.useParams();
  const s = useQuery({ queryKey: ["seller", id], queryFn: () => fetchSeller(id) });
  const items = useQuery({ queryKey: ["catalog", { sellerId: id }], queryFn: () => fetchCatalogPage({ sellerId: id }, 0), enabled: !!s.data });

  if (s.isPending) return <AppShell><p className="py-24 text-center text-sm text-muted-foreground">Cargando…</p></AppShell>;
  if (s.isError || !s.data)
    return (
      <AppShell>
        <div className="py-24 text-center">
          <p className="font-display text-2xl text-primary">{s.isError ? "No pudimos cargar este perfil." : "Este perfil no existe."}</p>
          {s.isError ? <button onClick={() => void s.refetch()} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Reintentar</button> : <Link to="/marketplace" className="mt-5 inline-block text-sm text-primary underline">Volver al marketplace</Link>}
        </div>
      </AppShell>
    );

  const u = s.data;
  const name = u.display_name || "Estudiante";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const list = items.data?.items ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="flex items-center gap-4">
          <Avatar initials={initials} size={72} />
          <div>
            <h1 className="text-4xl text-primary">{name}</h1>
            <p className="text-sm text-muted-foreground">{[u.level, u.campus && `Campus ${u.campus}`].filter(Boolean).join(" · ")}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {u.reviews > 0 ? <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-gold text-gold" />{u.rating} ({u.reviews})</span> : <span>Sin reseñas aún</span>}
              {u.sales > 0 && <span>· {u.sales} {u.sales === 1 ? "venta" : "ventas"}</span>}
            </p>
          </div>
        </div>
        {u.bio && <p className="mt-5 max-w-xl text-sm text-muted-foreground">{u.bio}</p>}
        <h2 className="mt-10 mb-4 text-2xl text-primary">Publicaciones</h2>
        {items.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />)}</div>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tiene publicaciones activas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
