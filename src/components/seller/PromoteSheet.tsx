import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Product } from "@/lib/data";

const PLANS = [
  { id: "24h", label: "24 horas", price: 15 },
  { id: "3d", label: "3 días", price: 35 },
  { id: "7d", label: "7 días", price: 69 },
];

/** Vista previa de promoción. No cobra ni marca el producto como promocionado. */
export function PromoteSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [plan, setPlan] = useState("3d");
  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-3xl font-normal">Promocionar</SheetTitle>
          <SheetDescription>Haz que más personas descubran tu publicación.</SheetDescription>
        </SheetHeader>
        {product && <p className="mt-2 truncate text-sm text-foreground">{product.title}</p>}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {PLANS.map((p) => (
            <button key={p.id} onClick={() => setPlan(p.id)} className={`rounded-xl p-4 text-left transition ${plan === p.id ? "bg-primary/5 ring-2 ring-primary" : "ring-1 ring-border hover:ring-primary/40"}`}>
              <p className="text-xs text-muted-foreground">{p.label}</p>
              <p className="mt-1 font-display text-2xl text-foreground">${p.price}</p>
            </button>
          ))}
        </div>
        <button disabled className="mt-6 w-full cursor-not-allowed rounded-full bg-primary/40 py-3.5 text-sm font-medium text-primary-foreground">Promocionar</button>
        <p className="mt-3 pb-2 text-center text-xs text-muted-foreground">Esta función estará disponible próximamente.</p>
      </SheetContent>
    </Sheet>
  );
}
