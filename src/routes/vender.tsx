import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, CATEGORY_EMOJI, type Category, type Condition, type Delivery, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/vender")({
  head: () => ({
    meta: [
      { title: "Publicar producto — Álamos Shop" },
      { name: "description", content: "Publica lo que quieras vender a otros estudiantes de Álamos en menos de un minuto." },
      { property: "og:title", content: "Vende en Álamos Shop" },
      { property: "og:description", content: "Tu comunidad también puede ser un marketplace." },
    ],
  }),
  component: Vender,
});

const STEPS = ["Fotos", "Título", "Descripción", "Precio", "Categoría", "Condición", "Entrega", "Publicar"];
const CONDITIONS: Condition[] = ["Nuevo", "Como nuevo", "Buen estado", "Usado"];
const DELIVERIES: Delivery[] = ["Campus Norte", "Campus Sur", "Ambos", "Otro acuerdo"];

async function resize(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  const s = Math.min(1, 700 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * s;
  c.height = img.height * s;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.72);
}

function Vender() {
  const { profile, hydrated, publish } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [delivery, setDelivery] = useState<Delivery[]>([]);

  if (hydrated && !profile) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <p className="eyebrow">Modo vendedor</p>
          <h1 className="mt-3 text-4xl text-primary">Crea tu perfil para vender</h1>
          <p className="mt-3 text-sm text-muted-foreground">Solo toma un minuto. Tus datos de contacto nunca se muestran públicamente.</p>
          <Link to="/perfil" className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Crear mi perfil</Link>
        </div>
      </AppShell>
    );
  }

  const valid = [images.length > 0, title.trim().length >= 3, description.trim().length >= 10, Number(price) > 0, !!category, !!condition, delivery.length > 0, true][step];

  const draft: Product = {
    id: "preview",
    sellerId: "me",
    title: title || "Tu producto",
    price: Number(price) || 0,
    description,
    category: category ?? "Otros",
    condition: condition ?? "Nuevo",
    campus: profile?.campus ?? "Norte",
    level: profile?.level ?? "Prepa",
    delivery,
    images,
    status: "active",
    createdAt: Date.now(),
    likes: 0,
  };

  const submit = () => {
    const { id, sellerId, status, createdAt, likes, ...rest } = draft;
    void id; void sellerId; void status; void createdAt; void likes;
    const p = publish(rest);
    toast.success("¡Publicado!", { description: "Tu producto ya está en el marketplace." });
    navigate({ to: "/p/$id", params: { id: p.id } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-6 md:py-10">
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="-ml-2 rounded-full p-2 text-muted-foreground" aria-label="Atrás"><ArrowLeft className="h-5 w-5" /></button>
          ) : <span className="w-9" />}
          <p className="text-xs text-muted-foreground">Paso {step + 1} de {STEPS.length} · {STEPS[step]}</p>
          <span className="w-9" />
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div key={step} className="mt-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {step === 0 && (
            <>
              <H t="Agrega fotos" s="Las fotos claras venden más rápido." />
              <div className="mt-6 grid grid-cols-3 gap-2">
                {images.map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1" aria-label="Quitar"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {images.length < 6 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary">
                    <Camera className="h-6 w-6" /> Agregar
                    <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []).slice(0, 6 - images.length);
                      const out = await Promise.all(files.map(resize));
                      setImages((prev) => [...prev, ...out]);
                    }} />
                  </label>
                )}
              </div>
            </>
          )}
          {step === 1 && (<><H t="¿Qué vendes?" s="Un título corto y claro." /><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Ej. Nike Air Force 1 talla 26" className="field mt-6" /></>)}
          {step === 2 && (<><H t="Descríbelo" s="Estado, talla, detalles importantes." /><textarea autoFocus value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={600} className="field mt-6" placeholder="Usados pocas veces, sin detalles…" /></>)}
          {step === 3 && (<><H t="Precio" s="En pesos mexicanos." /><div className="mt-6 flex items-center gap-2 border-b-2 border-primary pb-2"><span className="font-display text-4xl text-primary">$</span><input autoFocus type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-transparent font-display text-5xl text-primary outline-none" placeholder="0" /></div></>)}
          {step === 4 && (
            <><H t="Categoría" s="" /><div className="mt-6 grid grid-cols-2 gap-2">{CATEGORIES.map((c) => <Pick key={c} on={category === c} onClick={() => setCategory(c)}>{CATEGORY_EMOJI[c]} {c}</Pick>)}</div></>
          )}
          {step === 5 && (<><H t="Condición" s="" /><div className="mt-6 space-y-2">{CONDITIONS.map((c) => <Pick key={c} on={condition === c} onClick={() => setCondition(c)}>{c}</Pick>)}</div></>)}
          {step === 6 && (
            <><H t="¿Dónde puedes entregarlo?" s="Puedes elegir varias opciones." /><div className="mt-6 space-y-2">{DELIVERIES.map((d) => <Pick key={d} on={delivery.includes(d)} onClick={() => setDelivery(delivery.includes(d) ? delivery.filter((x) => x !== d) : [...delivery, d])}>{d}</Pick>)}</div></>
          )}
          {step === 7 && (
            <><H t="Así se verá tu publicación" s="Revisa antes de publicar." /><div className="mx-auto mt-6 max-w-[240px] pointer-events-none"><ProductCard product={draft} /></div><p className="mt-4 text-center text-xs text-muted-foreground">Entrega: {delivery.join(" · ")}</p></>
          )}
        </div>

        <button
          disabled={!valid}
          onClick={() => (step === STEPS.length - 1 ? submit() : setStep(step + 1))}
          className="mt-10 w-full rounded-full bg-primary py-4 text-sm font-medium text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {step === STEPS.length - 1 ? "Publicar" : "Continuar"}
        </button>
      </div>
    </AppShell>
  );
}

function H({ t, s }: { t: string; s: string }) {
  return (<div><h1 className="text-3xl text-primary">{t}</h1>{s && <p className="mt-1 text-sm text-muted-foreground">{s}</p>}</div>);
}

function Pick({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${on ? "border-primary bg-accent font-medium text-primary" : "border-border bg-background hover:border-primary"}`}>
      {children}
    </button>
  );
}
