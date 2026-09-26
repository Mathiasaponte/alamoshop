import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";
import { AppShell, Avatar } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, CATEGORY_EMOJI, SELLERS } from "@/lib/data";
import { useStore } from "@/lib/store";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.enum(CATEGORIES).optional(),
  campus: z.enum(["Norte", "Sur", "Ambos"]).optional(),
  level: z.enum(["Secundaria", "Prepa", "Todos"]).optional(),
  cond: z.enum(["Nuevo", "Usado"]).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  sort: z.enum(["recientes", "menor", "mayor", "populares"]).optional(),
});

export const Route = createFileRoute("/marketplace")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Marketplace — Álamos Shop" },
      { name: "description", content: "Descubre productos, servicios y proyectos que venden estudiantes de Álamos, campus Norte y Sur." },
      { property: "og:title", content: "Marketplace — Álamos Shop" },
      { property: "og:description", content: "Lo que buscas probablemente lo tiene alguien de tu escuela." },
    ],
  }),
  component: Marketplace,
});

function Marketplace() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/marketplace" });
  const { allProducts, prefs } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(search.q ?? "");

  const campus = search.campus ?? prefs.campus ?? "Ambos";
  const level = search.level ?? prefs.level ?? "Todos";
  const set = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const results = useMemo(() => {
    let list = allProducts.filter((p) => p.status === "active" || p.status === "reserved");
    if (search.q) {
      const t = search.q.toLowerCase();
      list = list.filter((p) => `${p.title} ${p.description} ${p.category}`.toLowerCase().includes(t));
    }
    if (search.cat) list = list.filter((p) => p.category === search.cat);
    if (search.cond === "Nuevo") list = list.filter((p) => p.condition === "Nuevo");
    if (search.cond === "Usado") list = list.filter((p) => p.condition !== "Nuevo");
    if (search.min != null) list = list.filter((p) => p.price >= search.min!);
    if (search.max != null) list = list.filter((p) => p.price <= search.max!);
    // Campus/level personalize ordering but never hide the other campus unless explicitly chosen.
    if (search.campus && search.campus !== "Ambos") list = list.filter((p) => p.campus === search.campus || p.delivery.includes("Ambos"));
    if (search.level && search.level !== "Todos") list = list.filter((p) => p.level === search.level);
    const score = (p: (typeof list)[number]) => (p.campus === campus ? 2 : 0) + (p.level === level ? 1 : 0);
    const sort = search.sort ?? "recientes";
    return [...list].sort((a, b) => {
      if (sort === "menor") return a.price - b.price;
      if (sort === "mayor") return b.price - a.price;
      if (sort === "populares") return b.likes - a.likes;
      return score(b) - score(a) || b.createdAt - a.createdAt;
    });
  }, [allProducts, search, campus, level]);

  const activeCount = [search.cat, search.cond, search.min, search.max, search.sort].filter((x) => x != null).length;

  return (
    <AppShell>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 pb-5 pt-6 md:px-6 md:pt-10">
          <h1 className="font-display text-3xl text-primary md:text-4xl">¿Qué estás buscando?</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              set({ q: q || undefined });
            }}
            className="mt-4 flex items-center gap-2"
          >
            <div className="flex flex-1 items-center gap-3 rounded-full border border-border bg-secondary px-4 py-3 focus-within:border-primary">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sneakers, AirPods, brownies, tutorías…" className="w-full bg-transparent text-base outline-none" />
              {q && (
                <button type="button" onClick={() => { setQ(""); set({ q: undefined }); }} aria-label="Limpiar">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <button type="button" onClick={() => setOpen((o) => !o)} className="relative flex h-12 w-12 items-center justify-center rounded-full border border-border hover:border-primary" aria-label="Filtros">
              <SlidersHorizontal className="h-5 w-5" />
              {activeCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.65rem] text-primary-foreground">{activeCount}</span>}
            </button>
          </form>
          <p className="mt-4 text-sm font-medium text-foreground">De estudiantes. Para estudiantes.</p>
          <p className="text-xs text-muted-foreground">Encuentra productos, servicios y proyectos creados o vendidos por alumnos de Álamos.</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Viendo:</span>
            <Seg value={level} options={["Todos", "Secundaria", "Prepa"]} onChange={(v) => set({ level: v as never })} />
            <Seg value={campus} options={["Ambos", "Norte", "Sur"]} onChange={(v) => set({ campus: v as never })} />
          </div>
        </div>

        <div className="mx-auto max-w-6xl overflow-x-auto px-4 pb-4 md:px-6 [scrollbar-width:none]">
          <div className="flex gap-2">
            <Chip active={!search.cat} onClick={() => set({ cat: undefined })}>Todo</Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c} active={search.cat === c} onClick={() => set({ cat: search.cat === c ? undefined : c })}>
                {CATEGORY_EMOJI[c]} {c}
              </Chip>
            ))}
          </div>
        </div>

        {open && (
          <div className="mx-auto max-w-6xl px-4 pb-6 md:px-6 animate-in fade-in slide-in-from-top-2">
            <div className="surface-card grid gap-5 p-5 md:grid-cols-3">
              <div>
                <p className="eyebrow mb-2">Condición</p>
                <Seg value={search.cond ?? "Todas"} options={["Todas", "Nuevo", "Usado"]} onChange={(v) => set({ cond: v === "Todas" ? undefined : (v as never) })} />
              </div>
              <div>
                <p className="eyebrow mb-2">Precio (MXN)</p>
                <div className="flex items-center gap-2">
                  <PriceInput placeholder="Mín" value={search.min} onChange={(v) => set({ min: v })} />
                  <span className="text-muted-foreground">–</span>
                  <PriceInput placeholder="Máx" value={search.max} onChange={(v) => set({ max: v })} />
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2">Ordenar</p>
                <select value={search.sort ?? "recientes"} onChange={(e) => set({ sort: e.target.value as never })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="recientes">Más recientes</option>
                  <option value="menor">Precio menor</option>
                  <option value="mayor">Precio mayor</option>
                  <option value="populares">Más populares</option>
                </select>
              </div>
              <button onClick={() => navigate({ search: {}, replace: true })} className="text-left text-sm text-primary underline-offset-4 hover:underline md:col-span-3">
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <p className="mb-4 text-sm text-muted-foreground">{results.length} publicaciones</p>
        {results.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <p className="font-display text-2xl text-primary">Nada por aquí… todavía</p>
            <p className="mt-2 text-sm text-muted-foreground">Prueba otros filtros o sé el primero en publicarlo.</p>
            <Link to="/vender" className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">+ Publicar producto</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
        <h2 className="text-2xl text-primary">Vendedores de tu comunidad</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
          {SELLERS.map((s) => (
            <Link key={s.id} to="/u/$id" params={{ id: s.id }} className="surface-card flex w-44 shrink-0 flex-col items-center p-4 text-center transition-transform hover:-translate-y-0.5">
              <Avatar initials={s.initials} size={52} />
              <p className="mt-3 text-sm font-medium text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.level} · {s.campus}</p>
              <p className="mt-1 text-xs text-muted-foreground">⭐ {s.rating.toFixed(1)} · {s.sales} ventas</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>
      {children}
    </button>
  );
}

function Seg({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-full bg-secondary p-1 ring-1 ring-border">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`rounded-full px-3 py-1 text-xs transition-colors ${value === o ? "bg-background font-medium text-primary shadow-sm" : "text-muted-foreground"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function PriceInput({ value, onChange, placeholder }: { value?: number; onChange: (v?: number) => void; placeholder: string }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      defaultValue={value ?? ""}
      onBlur={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    />
  );
}
