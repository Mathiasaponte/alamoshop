import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const { allProducts, prefs, getSeller } = useStore();
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
      list = list.filter((p) => `${p.title} ${p.description} ${p.category} ${getSeller(p.sellerId)?.name ?? ""}`.toLowerCase().includes(t));
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
  }, [allProducts, search, campus, level, getSeller]);

  const activeCount = [search.cat, search.cond, search.min, search.max, search.sort].filter((x) => x != null).length;
  const filtering = activeCount > 0 || !!search.q;
  const [recent, setRecent] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem("alamos-recent") ?? "[]")); } catch { /* ignore */ }
  }, []);
  const runSearch = (term: string) => {
    const t = term.trim();
    setQ(t);
    set({ q: t || undefined });
    if (t) {
      const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6);
      setRecent(next);
      localStorage.setItem("alamos-recent", JSON.stringify(next));
    }
  };

  const panel = open || (focused && !q);
  const sellerHits = q.trim().length > 1 ? SELLERS.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 4) : [];
  const [shown, setShown] = useState(12);
  useEffect(() => setShown(12), [search]);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && setShown((n) => n + 8), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [results.length]);

  return (
    <AppShell>
      <section className="sticky top-[59px] z-20 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6 md:py-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(q);
              setOpen(false);
              (document.activeElement as HTMLElement | null)?.blur();
            }}
            className="relative flex items-center gap-2"
          >
            <div className="flex flex-1 items-center gap-3 rounded-full bg-secondary px-5 py-3 ring-1 ring-transparent transition-all focus-within:bg-background focus-within:ring-primary/40">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} placeholder="Buscar en Álamos Shop" className="w-full bg-transparent text-base outline-none" />
              {q && (
                <button type="button" onClick={() => { setQ(""); set({ q: undefined }); }} aria-label="Limpiar">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <button type="button" onClick={() => setOpen((o) => !o)} className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-colors ${open ? "bg-primary text-primary-foreground" : "bg-secondary hover:text-primary"}`} aria-label="Filtros">
              <SlidersHorizontal className="h-5 w-5" />
              {activeCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.65rem] text-primary-foreground ring-2 ring-background">{activeCount}</span>}
            </button>

            {(panel || sellerHits.length > 0) && (
              <div onMouseDown={(e) => e.preventDefault()} className="surface-card absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] space-y-5 overflow-y-auto p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                {sellerHits.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">Vendedores</p>
                    {sellerHits.map((s) => (
                      <Link key={s.id} to="/u/$id" params={{ id: s.id }} className="flex items-center gap-3 rounded-md p-2 hover:bg-secondary">
                        <Avatar initials={s.initials} size={32} />
                        <span className="text-sm text-foreground">{s.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{s.level} · {s.campus}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {panel && (
                  <>
                    {recent.length > 0 && (
                      <div>
                        <p className="eyebrow mb-2">Recientes</p>
                        <div className="flex flex-wrap gap-2">
                          {recent.map((r) => (
                            <button key={r} type="button" onClick={() => { runSearch(r); setOpen(false); }} className="rounded-full bg-secondary px-3 py-1.5 text-sm hover:text-primary">{r}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="eyebrow mb-2">Categorías</p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((c) => (
                          <Chip key={c} active={search.cat === c} onClick={() => set({ cat: search.cat === c ? undefined : c })}>{CATEGORY_EMOJI[c]} {c}</Chip>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div><p className="eyebrow mb-2">Campus</p><Seg value={campus} options={["Ambos", "Norte", "Sur"]} onChange={(v) => set({ campus: v as never })} /></div>
                      <div><p className="eyebrow mb-2">Nivel</p><Seg value={level} options={["Todos", "Secundaria", "Prepa"]} onChange={(v) => set({ level: v as never })} /></div>
                      <div><p className="eyebrow mb-2">Condición</p><Seg value={search.cond ?? "Todas"} options={["Todas", "Nuevo", "Usado"]} onChange={(v) => set({ cond: v === "Todas" ? undefined : (v as never) })} /></div>
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
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <button type="button" onClick={() => navigate({ search: {}, replace: true })} className="text-sm text-muted-foreground hover:text-primary">Limpiar</button>
                      <button type="button" onClick={() => { setOpen(false); (document.activeElement as HTMLElement | null)?.blur(); }} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary-deep">Ver {results.length} resultados</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </form>
          {search.cat && (
            <div className="mt-3 flex gap-2">
              <Chip active onClick={() => set({ cat: undefined })}>{CATEGORY_EMOJI[search.cat]} {search.cat} <X className="ml-1 inline h-3 w-3" /></Chip>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-2 md:px-6">
        {filtering && <p className="mb-4 text-sm text-muted-foreground">{results.length} {results.length === 1 ? "resultado" : "resultados"}</p>}
        {results.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl text-primary">No encontramos nada por aquí todavía.</p>
            <p className="mt-2 text-sm text-muted-foreground">Prueba otra búsqueda o sé el primero en publicarlo.</p>
            <Link to="/vender" className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Publicar</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
              {results.slice(0, shown).map((p, i) => (
                <div key={p.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${(i % 8) * 40}ms`, animationFillMode: "both" }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            {shown < results.length && (
              <div ref={sentinel} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            )}
          </>
        )}
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

function PriceInput({ value, onChange, placeholder }: { value: number | undefined; onChange: (v?: number) => void; placeholder: string }) {
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
