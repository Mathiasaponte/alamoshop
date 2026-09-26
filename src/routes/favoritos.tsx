import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Álamos Shop" },
      { name: "description", content: "Los productos que guardaste en Álamos Shop." },
      { property: "og:title", content: "Favoritos — Álamos Shop" },
      { property: "og:description", content: "Tus productos guardados." },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { allProducts, favorites } = useStore();
  const list = allProducts.filter((p) => favorites.includes(p.id));
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PageTitle title="Favoritos" subtitle={`${list.length} guardados`} />
        {list.length === 0 ? (
          <div className="surface-card mt-6 p-10 text-center">
            <p className="text-sm text-muted-foreground">Toca el ♡ en cualquier producto para guardarlo.</p>
            <Link to="/marketplace" className="mt-3 inline-block text-sm text-primary underline">Explorar</Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </div>
    </AppShell>
  );
}
