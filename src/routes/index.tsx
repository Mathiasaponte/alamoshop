import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag, Tag, Repeat } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore, type Intent } from "@/lib/store";
import type { Campus, Level } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Álamos Shop — Compra, vende y descubre dentro de tu comunidad" },
      { name: "description", content: "Un marketplace hecho por estudiantes de Álamos, para estudiantes de Álamos. Sneakers, tecnología, postres, servicios y más." },
      { property: "og:title", content: "Álamos Shop — De estudiantes, para estudiantes" },
      { property: "og:description", content: "Compra, vende y descubre dentro de tu comunidad estudiantil." },
    ],
  }),
  component: Onboarding,
});

type Step = "welcome" | "campus" | "level" | "intent";

function Onboarding() {
  const { hydrated, prefs, setPrefs } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [campus, setCampus] = useState<Campus | null>(null);
  const [level, setLevel] = useState<Level | null>(null);

  useEffect(() => {
    if (hydrated && prefs.onboarded) navigate({ to: "/marketplace", replace: true });
  }, [hydrated, prefs.onboarded, navigate]);

  const finish = (intent: Intent) => {
    setPrefs({ onboarded: true, member: true, campus, level, intent });
    navigate({ to: intent === "vender" ? "/vender" : "/marketplace" });
  };

  const back: Record<Step, Step | null> = { welcome: null, campus: "welcome", level: "campus", intent: "level" };
  const idx = ["welcome", "campus", "level", "intent"].indexOf(step);

  if (!hydrated || prefs.onboarded) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-6 pt-6">
        {back[step] ? (
          <button onClick={() => setStep(back[step]!)} className="-ml-2 rounded-full p-2 text-muted-foreground hover:text-primary" aria-label="Atrás">
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span />
        )}
        {step !== "welcome" && (
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= idx ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        )}
        <span className="w-9" />
      </div>

      <div key={step} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-12 animate-in fade-in slide-in-from-bottom-3 duration-500">
        {step === "welcome" && (
          <>
            <Logo variant="emblem" size={88} className="mx-auto" />
            <h1 className="mt-8 text-center text-5xl text-primary">Álamos Shop</h1>
            <p className="mt-4 text-center text-lg text-foreground">Compra, vende y descubre dentro de tu comunidad.</p>
            <p className="mt-2 text-center text-sm text-muted-foreground">Un marketplace hecho por estudiantes de Álamos, para estudiantes de Álamos.</p>
            <div className="mx-auto mt-10 h-px w-20 rule-gold" />
            <p className="mt-10 text-center font-display text-2xl text-foreground">¿Perteneces a Álamos?</p>
            <div className="mt-6 space-y-3">
              <BigOption title="Sí, soy de Álamos" onClick={() => setStep("campus")} primary />
              <BigOption
                title="Solo quiero explorar"
                onClick={() => {
                  setPrefs({ onboarded: true, member: false });
                  navigate({ to: "/marketplace" });
                }}
              />
            </div>
            <p className="mt-10 text-center text-xs text-muted-foreground">Álamos Shop es una plataforma independiente creada para la comunidad estudiantil.</p>
          </>
        )}

        {step === "campus" && (
          <>
            <Q title="¿En qué campus estás?" sub="Verás primero lo de tu campus, pero puedes explorar ambos." />
            <div className="mt-8 grid grid-cols-2 gap-3">
              {(["Norte", "Sur"] as Campus[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCampus(c);
                    setStep("level");
                  }}
                  className="surface-card flex aspect-[4/5] flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 hover:border-primary active:scale-95"
                >
                  <span className="eyebrow">Campus</span>
                  <span className="font-display text-4xl font-semibold text-primary">{c.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "level" && (
          <>
            <Q title="¿En qué nivel estás?" sub="Así te mostramos lo más relevante para ti." />
            <div className="mt-8 space-y-3">
              {(["Secundaria", "Prepa"] as Level[]).map((l) => (
                <BigOption
                  key={l}
                  title={l.toUpperCase()}
                  onClick={() => {
                    setLevel(l);
                    setStep("intent");
                  }}
                />
              ))}
            </div>
          </>
        )}

        {step === "intent" && (
          <>
            <Q title="¿Qué quieres hacer en Álamos Shop?" sub="Puedes cambiarlo cuando quieras." />
            <div className="mt-8 space-y-3">
              <BigOption icon={<ShoppingBag className="h-5 w-5" />} title="Comprar" desc="Encuentra cosas que venden otros estudiantes." onClick={() => finish("comprar")} />
              <BigOption icon={<Tag className="h-5 w-5" />} title="Vender" desc="Publica productos y empieza a vender." onClick={() => finish("vender")} />
              <BigOption icon={<Repeat className="h-5 w-5" />} title="Ambos" desc="Compra y vende dentro de Álamos." onClick={() => finish("ambos")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Q({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center">
      <h1 className="text-4xl text-primary">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function BigOption({ title, desc, icon, onClick, primary }: { title: string; desc?: string; icon?: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left transition-all active:scale-[0.98] ${
        primary ? "bg-primary text-primary-foreground hover:bg-[var(--primary-deep)]" : "surface-card hover:border-primary"
      }`}
    >
      {icon && <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">{icon}</span>}
      <span className="flex-1">
        <span className={`block font-medium ${primary ? "" : "text-foreground"}`}>{title}</span>
        {desc && <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>}
      </span>
    </button>
  );
}
