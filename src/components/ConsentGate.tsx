import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";
import { loadConsent, saveConsent } from "@/lib/legal";

const POINTS = ["Respeta a los demás.", "Publica cosas reales.", "No estafes.", "No vendas productos prohibidos.", "Cumple tus acuerdos.", "Protege tu información."];

/** Shown once to users with a profile (account features). Explorers never see it. */
export function ConsentGate() {
  const { profile } = useStore();
  const [need, setNeed] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  useEffect(() => {
    setNeed(!!profile && !loadConsent());
  }, [profile]);

  if (!need) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="animate-in slide-in-from-bottom-6 fade-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-background p-6 shadow-2xl duration-300 md:rounded-2xl">
        <Logo variant="emblem" size={44} />
        <h2 id="consent-title" className="mt-4 text-3xl text-primary">Antes de entrar</h2>
        <p className="mt-1 text-sm text-muted-foreground">Seis acuerdos simples para que todos estemos bien.</p>
        <ul className="mt-5 space-y-2.5">
          {POINTS.map((p, i) => (
            <li key={p} className="flex items-baseline gap-3 text-sm">
              <span className="font-display text-lg font-semibold text-gold">{i + 1}</span>
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 -m-1 hover:bg-secondary">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
            <span>He leído y acepto los <Link to="/terminos" target="_blank" className="text-primary underline">Términos y Condiciones</Link>.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 -m-1 hover:bg-secondary">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
            <span>He leído el <Link to="/privacidad" target="_blank" className="text-primary underline">Aviso de Privacidad</Link>.</span>
          </label>
        </div>
        <button
          disabled={!terms || !privacy}
          onClick={() => {
            saveConsent();
            setNeed(false);
          }}
          className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-deep)] disabled:opacity-40"
        >
          Entrar a Álamos Shop
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Tu aceptación se guarda en este dispositivo.</p>
      </div>
    </div>
  );
}
