import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { CATEGORIES, CATEGORY_EMOJI } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorías — Álamos Shop" },
      { name: "description", content: "Explora ropa, sneakers, tecnología, comida, arte y servicios de estudiantes de Álamos." },
      { property: "og:title", content: "Categorías — Álamos Shop" },
      { property: "og:description", content: "Encuentra lo que buscas por categoría." },
    ],
  }),
  component: Categorias,
});

function Categorias() {
  const { allProducts } = useStore();
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PageTitle title="Categorías" subtitle="Compra cerca. Vende fácil." />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c} to="/marketplace" search={{ cat: c }} className="surface-card flex flex-col gap-2 p-5 transition-all hover:-translate-y-0.5 hover:border-primary">
              <span className="text-3xl">{CATEGORY_EMOJI[c]}</span>
              <span className="font-medium text-foreground">{c}</span>
              <span className="text-xs text-muted-foreground">{allProducts.filter((p) => p.category === c && p.status === "active").length} publicaciones</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
