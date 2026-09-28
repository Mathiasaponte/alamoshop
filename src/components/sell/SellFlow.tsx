import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Package, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, CATEGORY_EMOJI, formatPrice, type Condition, type Delivery, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import { EMPTY_DRAFT, clearDraft, findBanned, hasProgress, loadDraft, saveDraft, type SellDraft } from "@/lib/sell";
import { SellPhotos } from "./SellPhotos";
import { SellSuccess } from "./SellSuccess";

type StepId = "intro" | "tipo" | "categoria" | "titulo" | "precio" | "condicion" | "descripcion" | "fotos" | "entrega" | "preview";

const CONDITIONS: Condition[] = ["Nuevo", "Como nuevo", "Buen estado", "Usado"];
const DELIVERIES: { value: Delivery; label: string }[] = [
  { value: "Campus Norte", label: "Campus Norte" },
  { value: "Campus Sur", label: "Campus Sur" },
  { value: "Ambos", label: "Ambos campus" },
  { value: "Otro acuerdo", label: "Otro punto acordado" },
];
const EXAMPLES = ["AirPods Pro", "Perfume JPG Le Beau", "Playera Nike", "Brownies caseros"];

export function SellFlow() {
  const { profile, myProducts, publish } = useStore();
  const navigate = useNavigate();
  const firstTime = myProducts.length === 0;

  const [d, setD] = useState<SellDraft>(EMPTY_DRAFT);
  const [resume, setResume] = useState<SellDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<Product | null>(null);
  const [example, setExample] = useState(0);
  const advanceTimer = useRef<number | undefined>(undefined);

  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = firstTime ? ["intro"] : [];
    s.push("tipo", "categoria", "titulo", "precio");
    if (d.kind !== "servicio") s.push("condicion");
    s.push("descripcion", "fotos", "entrega", "preview");
    return s;
  }, [firstTime, d.kind]);

  // Cargar borrador
  useEffect(() => {
    const saved = loadDraft();
    if (saved && hasProgress(saved)) setResume(saved);
    setReady(true);
  }, []);

  // Guardar después de cada cambio
  useEffect(() => {
    if (ready && !resume && !published && hasProgress(d)) saveDraft(d);
  }, [d, ready, resume, published]);

  // Ejemplos dinámicos de título
  useEffect(() => {
    const t = window.setInterval(() => setExample((e) => (e + 1) % EXAMPLES.length), 2200);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  const idx = Math.min(d.step, steps.length - 1);
  const id: StepId = steps[idx] ?? "tipo";
  const set = (p: Partial<SellDraft>) => { setError(null); setD((s) => ({ ...s, ...p })); };

  const validate = (step: StepId): string | null => {
    switch (step) {
      case "tipo": return d.kind ? null : "Elige si es un producto o un servicio.";
      case "categoria": return d.category ? null : "Elige una categoría.";
      case "titulo": {
        if (d.title.trim().length < 3) return "Escribe un nombre de al menos 3 letras.";
        const b = findBanned(d.title);
        return b ? `Parece relacionado con ${b}. Eso no está permitido en Álamos Shop.` : null;
      }
      case "precio": { const n = Number(d.price); return n > 0 && n <= 100000 ? null : "Escribe un precio válido."; }
      case "condicion": return d.condition ? null : "Elige el estado.";
      case "descripcion": {
        if (d.description.trim().length < 10) return "Agrega un poco más de detalle (mínimo 10 caracteres).";
        const b = findBanned(d.description);
        return b ? `La descripción parece relacionada con ${b}. Eso no está permitido.` : null;
      }
      case "fotos": return d.images.length ? null : "Agrega al menos una foto.";
      case "entrega": return d.delivery.length ? null : "Elige al menos un lugar de entrega.";
      default: return null;
    }
  };

  const go = (to: number) => { setError(null); setDir(to > idx ? 1 : -1); setD((s) => ({ ...s, step: to })); };
  const next = () => {
    const e = validate(id);
    if (e) return setError(e);
    if (id === "preview") return submit();
    go(idx + 1);
  };
  const pickAndAdvance = (p: Partial<SellDraft>) => {
    set(p);
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => { setDir(1); setD((s) => ({ ...s, step: s.step + 1 })); }, 260);
  };

  const draftProduct: Product = {
    id: "preview",
    sellerId: "me",
    title: d.title.trim() || "Tu producto",
    price: Number(d.price) || 0,
    description: d.description,
    category: d.category ?? "Otros",
    condition: d.kind === "servicio" ? "Nuevo" : d.condition ?? "Nuevo",
    campus: profile?.campus ?? "Norte",
    level: profile?.level ?? "Prepa",
    delivery: d.delivery,
    images: d.images,
    status: "active",
    createdAt: Date.now(),
    likes: 0,
  };

  const submit = () => {
    for (const s of steps) {
      const e = validate(s);
      if (e) { setError(e); go(steps.indexOf(s)); return; }
    }
    const { id: _i, sellerId: _s, status: _st, createdAt: _c, likes: _l, ...rest } = draftProduct;
    void _i; void _s; void _st; void _c; void _l;
    const p = publish(rest);
    clearDraft();
    setPublished(p);
  };

  const close = () => navigate({ to: "/marketplace" });

  if (!ready) return <Frame onClose={close}><div className="h-64" /></Frame>;

  if (published) return <Frame onClose={close}><SellSuccess product={published} /></Frame>;

  if (resume) {
    return (
      <Frame onClose={close}>
        <div className="py-12 text-center animate-in fade-in zoom-in-95 duration-300">
          <p className="eyebrow">Borrador guardado</p>
          <h1 className="mt-3 text-4xl text-primary">¿Quieres continuar donde lo dejaste?</h1>
          {resume.title && <p className="mt-3 text-sm text-muted-foreground">“{resume.title}”</p>}
          <div className="mx-auto mt-10 max-w-xs space-y-2">
            <button onClick={() => { setD(resume); setResume(null); }} className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-deep">Continuar</button>
            <button onClick={() => { clearDraft(); setD(EMPTY_DRAFT); setResume(null); }} className="w-full rounded-full py-3.5 text-sm font-medium ring-1 ring-border hover:ring-primary">Empezar de nuevo</button>
          </div>
        </div>
      </Frame>
    );
  }

  const progressSteps = steps.filter((s) => s !== "intro");
  const pIdx = progressSteps.indexOf(id);

  return (
    <Frame
      onClose={close}
      onBack={idx > 0 ? () => go(idx - 1) : undefined}
      progress={pIdx >= 0 ? { current: pIdx + 1, total: progressSteps.length } : undefined}
      footer={
        id === "tipo" || id === "categoria" || id === "condicion" ? null : (
          <>
            {error && <p role="alert" className="mb-3 rounded-xl bg-accent px-4 py-2.5 text-center text-sm text-primary animate-in fade-in duration-200">{error}</p>}
            {id === "preview" && (
              <p className="mb-3 text-center text-xs text-muted-foreground">
                Al publicar confirmas que este producto cumple las reglas de Álamos Shop. <Link to="/reglas" className="font-medium text-primary underline-offset-4 hover:underline">Ver reglas</Link>
              </p>
            )}
            <div className="flex gap-2">
              {id === "preview" && <button onClick={() => go(steps.indexOf("titulo"))} className="rounded-full px-6 py-4 text-sm font-medium ring-1 ring-border hover:ring-primary">Editar</button>}
              <button onClick={next} className="flex-1 rounded-full bg-primary py-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-deep active:scale-[0.98]">
                {id === "intro" ? "Empezar" : id === "preview" ? "Publicar" : "Continuar"}
              </button>
            </div>
          </>
        )
      }
    >
      <div key={id} className={`animate-in fade-in zoom-in-[0.99] duration-300 ${dir === 1 ? "slide-in-from-right-6" : "slide-in-from-left-6"}`}>
        {id === "intro" && (
          <div className="py-10 text-center md:py-16">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary"><Sparkles className="h-6 w-6" /></span>
            <h1 className="mt-8 text-5xl leading-tight text-primary">¿Qué quieres vender?</h1>
            <p className="mt-3 text-muted-foreground">Te ayudamos a publicarlo en unos minutos.</p>
          </div>
        )}

        {id === "tipo" && (
          <>
            <Q t="¿Qué quieres publicar?" />
            <div className="mt-8 grid grid-cols-2 gap-3">
              <BigCard on={d.kind === "producto"} onClick={() => pickAndAdvance({ kind: "producto" })} icon={<Package className="h-6 w-6" />} title="Producto" sub="Algo que entregas" />
              <BigCard on={d.kind === "servicio"} onClick={() => pickAndAdvance({ kind: "servicio", condition: null, category: d.category ?? "Servicios" })} icon={<Sparkles className="h-6 w-6" />} title="Servicio" sub="Algo que haces" />
            </div>
          </>
        )}

        {id === "categoria" && (
          <>
            <Q t="¿Qué tipo de cosa es?" />
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <Pick key={c} on={d.category === c} onClick={() => pickAndAdvance({ category: c })}>
                  <span className="text-lg">{CATEGORY_EMOJI[c]}</span> {c}
                </Pick>
              ))}
            </div>
          </>
        )}

        {id === "titulo" && (
          <>
            <Q t="¿Cómo se llama?" s="Usa un nombre corto y claro." />
            <input
              autoFocus
              value={d.title}
              onChange={(e) => set({ title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && next()}
              maxLength={60}
              placeholder={`Ej. ${EXAMPLES[example]}`}
              className="mt-8 w-full border-b-2 border-border bg-transparent pb-3 font-display text-3xl text-primary outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
            />
            <p className="mt-2 text-right text-xs text-muted-foreground">{d.title.length}/60</p>
            {firstTime && <Tip>Un nombre como el que buscarías tú ayuda a que te encuentren.</Tip>}
          </>
        )}

        {id === "precio" && (
          <>
            <Q t="¿Cuánto quieres pedir?" s="Puedes cambiarlo después." />
            <div className="mt-10 flex items-baseline justify-center gap-2">
              <span className="font-display text-5xl text-primary">$</span>
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                min={0}
                value={d.price}
                onChange={(e) => set({ price: e.target.value.replace(/[^\d]/g, "").slice(0, 6) })}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="000"
                className="w-48 bg-transparent text-center font-display text-7xl text-primary outline-none placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm font-medium text-muted-foreground">MXN</span>
            </div>
            {firstTime && <Tip>Un precio claro ayuda a vender más rápido.</Tip>}
          </>
        )}

        {id === "condicion" && (
          <>
            <Q t="¿En qué estado está?" />
            <div className="mt-8 space-y-2">
              {CONDITIONS.map((c) => <Pick key={c} on={d.condition === c} onClick={() => pickAndAdvance({ condition: c })}>{c}</Pick>)}
            </div>
          </>
        )}

        {id === "descripcion" && (
          <>
            <Q t="Cuéntanos un poco más." />
            <textarea
              autoFocus
              value={d.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={5}
              maxLength={600}
              placeholder={d.kind === "servicio" ? "Qué incluye, cuánto dura, cómo lo coordinas…" : "Usado pocas veces, incluye caja…"}
              className="field mt-8 text-base"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(d.kind === "servicio" ? ["qué incluye", "duración", "disponibilidad", "experiencia"] : ["estado", "tamaño", "qué incluye", "tiempo de uso", "detalles importantes"]).map((h) => (
                <span key={h} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{h}</span>
              ))}
            </div>
            {firstTime && <Tip>Cuenta cualquier detalle importante. Evita sorpresas al entregar.</Tip>}
          </>
        )}

        {id === "fotos" && (
          <>
            <Q t="Ahora haz que se vea bien." s="Hasta 6 fotos. La primera será la portada." />
            <div className="mt-8"><SellPhotos images={d.images} onChange={(images) => set({ images })} /></div>
            {firstTime && <Tip>Las publicaciones con buenas fotos generan más confianza.</Tip>}
          </>
        )}

        {id === "entrega" && (
          <>
            <Q t="¿Dónde puedes entregarlo?" s="Puedes elegir varias. Nunca pedimos tu ubicación." />
            <div className="mt-8 space-y-2">
              {DELIVERIES.map(({ value, label }) => (
                <Pick key={value} on={d.delivery.includes(value)} onClick={() => set({ delivery: d.delivery.includes(value) ? d.delivery.filter((x) => x !== value) : [...d.delivery, value] })}>{label}</Pick>
              ))}
            </div>
          </>
        )}

        {id === "preview" && (
          <>
            <Q t="Así se verá tu publicación." />
            <div className="mx-auto mt-8 max-w-[220px] pointer-events-none"><ProductCard product={draftProduct} /></div>
            <div className="surface-card mt-6 overflow-hidden">
              <div className="p-5">
                <p className="eyebrow">{d.category} · {d.kind === "servicio" ? "Servicio" : draftProduct.condition}</p>
                <h2 className="mt-2 text-2xl text-primary">{draftProduct.title}</h2>
                <p className="mt-1 font-display text-3xl text-foreground">{formatPrice(draftProduct.price)}</p>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{d.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                  <div><p className="text-muted-foreground">Entrega</p><p className="mt-0.5 font-medium">{d.delivery.map((v) => DELIVERIES.find((x) => x.value === v)?.label).join(" · ")}</p></div>
                  <div><p className="text-muted-foreground">Nivel</p><p className="mt-0.5 font-medium">{draftProduct.level} · Campus {draftProduct.campus}</p></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Frame>
  );
}

function Frame({ children, footer, onClose, onBack, progress }: { children: ReactNode; footer?: ReactNode; onClose: () => void; onBack?: (() => void) | undefined; progress?: { current: number; total: number } | undefined }) {
  return (
    <div className="min-h-dvh bg-secondary md:py-10">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col bg-background animate-in slide-in-from-bottom-10 fade-in duration-500 md:min-h-[min(760px,calc(100dvh-5rem))] md:rounded-3xl md:shadow-[var(--shadow-card)] md:ring-1 md:ring-border">
        <div className="sticky top-0 z-10 bg-background/95 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur md:rounded-t-3xl md:px-8 md:pt-6">
          <div className="flex h-10 items-center justify-between">
            {onBack ? <button onClick={onBack} className="-ml-2 rounded-full p-2 text-muted-foreground hover:text-primary" aria-label="Atrás"><ArrowLeft className="h-5 w-5" /></button> : <span className="w-9" />}
            <p className="text-xs tabular-nums text-muted-foreground">{progress ? `${progress.current} de ${progress.total}` : ""}</p>
            <button onClick={onClose} className="-mr-2 rounded-full p-2 text-muted-foreground hover:text-primary" aria-label="Cerrar"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: progress ? `${(progress.current / progress.total) * 100}%` : "0%" }} />
          </div>
        </div>
        <div className="flex-1 overflow-x-hidden px-5 py-8 md:px-10">{children}</div>
        {footer && <div className="sticky bottom-0 bg-background/95 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur md:rounded-b-3xl md:px-10 md:pb-8">{footer}</div>}
      </div>
    </div>
  );
}

function Q({ t, s }: { t: string; s?: string }) {
  return (<div><h1 className="text-4xl leading-tight text-primary">{t}</h1>{s && <p className="mt-2 text-sm text-muted-foreground">{s}</p>}</div>);
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 flex gap-2 border-l-2 border-gold pl-3 text-xs leading-relaxed text-muted-foreground animate-in fade-in fill-mode-both delay-300 duration-500">{children}</p>
  );
}

function BigCard({ on, onClick, icon, title, sub }: { on: boolean; onClick: () => void; icon: ReactNode; title: string; sub: string }) {
  return (
    <button onClick={onClick} className={`relative flex aspect-[4/5] flex-col justify-between rounded-2xl p-5 text-left transition-all duration-200 active:scale-[0.97] ${on ? "scale-[1.02] bg-accent ring-2 ring-primary" : "bg-background ring-1 ring-border hover:ring-primary"}`}>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">{icon}</span>
      {on && <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground animate-in zoom-in-50 duration-200"><Check className="h-3.5 w-3.5" /></span>}
      <span><span className="block font-display text-2xl text-primary">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{sub}</span></span>
    </button>
  );
}

function Pick({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-left text-sm transition-all duration-200 active:scale-[0.98] ${on ? "bg-accent font-medium text-primary ring-2 ring-primary" : "bg-background ring-1 ring-border hover:ring-primary"}`}>
      <span className="flex items-center gap-2">{children}</span>
      {on && <Check className="h-4 w-4 shrink-0 animate-in zoom-in-50 duration-200" />}
    </button>
  );
}
