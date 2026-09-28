import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Product } from "@/lib/data";

export function SellSuccess({ product }: { product: Product }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${product.id}` : `/p/${product.id}`;
  const text = `Mira lo que publiqué en Álamos Shop: ${product.title}`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product.title, text, url }); } catch { /* cancelado */ }
      return;
    }
    await copy();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast.success("Link copiado"); } catch { toast.error("No se pudo copiar el link"); }
  };

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <svg viewBox="0 0 52 52" className="h-20 w-20 animate-in zoom-in-75 fade-in duration-500" aria-hidden>
        <circle cx="26" cy="26" r="24" fill="none" className="stroke-primary" strokeWidth="2" style={{ strokeDasharray: 151, strokeDashoffset: 151, animation: "sell-draw 0.6s ease-out forwards" }} />
        <path d="M15 27l7 7 15-16" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "sell-draw 0.4s 0.5s ease-out forwards" }} />
      </svg>
      <h1 className="mt-8 text-4xl text-primary animate-in fade-in slide-in-from-bottom-3 fill-mode-both delay-700 duration-500">Tu publicación ya está arriba.</h1>
      <p className="mt-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-1000 duration-500">Ahora alguien puede encontrarla.</p>

      <div className="mt-10 w-full max-w-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 fill-mode-both [animation-delay:1200ms] duration-500">
        <Link to="/p/$id" params={{ id: product.id }} className="block w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-deep">Ver publicación</Link>
        <button onClick={share} className="w-full rounded-full py-3.5 text-sm font-medium text-foreground ring-1 ring-border hover:ring-primary">Compartir</button>
        <div className="flex justify-center gap-4 pt-1 text-xs text-muted-foreground">
          <button onClick={copy} className="underline-offset-4 hover:underline">Copiar link</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">WhatsApp</a>
        </div>
        <Link to="/tienda" className="block pt-4 text-sm font-medium text-primary">Ir a mi tienda →</Link>
      </div>
    </div>
  );
}
