import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice, type Product } from "@/lib/data";
import { productShare } from "@/lib/share";
import { useStore, type Order } from "@/lib/store";
import { StatusChip, fmtDate } from "./SellerParts";
import { PromoteSheet } from "./PromoteSheet";

type Confirm = { kind: "sold" | "delete"; product: Product } | null;

export function SellerListings({ products, incoming }: { products: Product[]; incoming: Order[] }) {
  const { setProductStatus } = useStore();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [promote, setPromote] = useState<Product | null>(null);
  const [perf, setPerf] = useState<Product | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const pulse = (id: string) => { setFlash(id); setTimeout(() => setFlash(null), 900); };

  const actions = {
    pause: (p: Product) => { setProductStatus(p.id, "paused"); pulse(p.id); toast("Publicación pausada.", { action: { label: "Reactivar", onClick: () => setProductStatus(p.id, "active") } }); },
    resume: (p: Product) => { setProductStatus(p.id, "active"); pulse(p.id); toast.success("Publicación activa de nuevo."); },
    sold: (p: Product) => setConfirm({ kind: "sold", product: p }),
    remove: (p: Product) => setConfirm({ kind: "delete", product: p }),
    promote: setPromote,
    perf: setPerf,
  };

  const doConfirm = () => {
    if (!confirm) return;
    const { kind, product } = confirm;
    if (kind === "sold") { setProductStatus(product.id, "sold"); pulse(product.id); toast.success("¡Marcado como vendido!"); }
    else { setProductStatus(product.id, "removed"); toast("Publicación eliminada."); }
    setConfirm(null);
  };

  return (
    <>
      {/* Desktop: tabla limpia */}
      <div className="hidden overflow-hidden rounded-xl bg-card ring-1 ring-border md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr><th className="px-4 py-3 font-normal">Producto</th><th className="px-4 py-3 font-normal">Precio</th><th className="px-4 py-3 font-normal">Estado</th><th className="px-4 py-3 font-normal">Fecha</th><th className="px-4 py-3 text-right font-normal">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className={`transition-colors ${flash === p.id ? "bg-gold/10" : "hover:bg-secondary/50"}`}>
                <td className="px-4 py-3">
                  <Link to="/p/$id" params={{ id: p.id }} className="flex min-w-0 items-center gap-3">
                    <Thumb p={p} size="h-11 w-11" />
                    <span className="truncate text-foreground">{p.title}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground">{formatPrice(p.price)}</td>
                <td className="px-4 py-3"><StatusChip status={p.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.createdAt)}</td>
                <td className="px-4 py-3 text-right"><Actions p={p} a={actions} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: cards compactas */}
      <div className="space-y-2 md:hidden">
        {products.map((p) => (
          <div key={p.id} className={`surface-card flex items-center gap-3 p-3 transition-colors ${flash === p.id ? "bg-gold/10" : ""}`}>
            <Link to="/p/$id" params={{ id: p.id }} className="flex min-w-0 flex-1 items-center gap-3">
              <Thumb p={p} size="h-16 w-16" />
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{p.title}</p>
                <p className="text-sm font-medium text-foreground">{formatPrice(p.price)}</p>
                <div className="mt-1"><StatusChip status={p.status} /></div>
              </div>
            </Link>
            <Actions p={p} a={actions} />
          </div>
        ))}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl font-normal">{confirm?.kind === "sold" ? "¿Marcar como vendido?" : "¿Eliminar publicación?"}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.kind === "sold" ? "Dejará de aparecer como disponible." : "Ya no aparecerá en el marketplace ni en tu tienda."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doConfirm} className={confirm?.kind === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
              {confirm?.kind === "sold" ? "Marcar vendido" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PromoteSheet product={promote} onClose={() => setPromote(null)} />

      <Sheet open={!!perf} onOpenChange={(o) => !o && setPerf(null)}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader className="text-left"><SheetTitle className="font-display text-3xl font-normal">Rendimiento</SheetTitle></SheetHeader>
          {perf && (() => {
            const os = incoming.filter((o) => o.productId === perf.id);
            const rows: [string, React.ReactNode][] = [
              ["Estado", <StatusChip key="s" status={perf.status} />],
              ["Precio", formatPrice(perf.price)],
              ["Publicada", fmtDate(perf.createdAt)],
              ["Solicitudes", os.length],
              ["Ventas", os.filter((o) => o.status === "completado").length],
              ["Visitas", <span key="v" className="text-muted-foreground">Próximamente</span>],
              ["Favoritos recibidos", <span key="f" className="text-muted-foreground">Próximamente</span>],
            ];
            return (
              <dl className="mt-4 divide-y divide-border pb-4">
                <p className="mb-2 truncate text-sm text-foreground">{perf.title}</p>
                {rows.map(([k, v]) => <div key={k} className="flex items-center justify-between py-2.5 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-foreground">{v}</dd></div>)}
              </dl>
            );
          })()}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Thumb({ p, size }: { p: Product; size: string }) {
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-lg bg-muted ${p.status === "paused" || p.status === "sold" ? "opacity-60" : ""}`}>
      {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}

type A = Record<"pause" | "resume" | "sold" | "remove" | "promote" | "perf", (p: Product) => void>;

function Actions({ p, a }: { p: Product; a: A }) {
  const s = productShare(p);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Acciones para ${p.title}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild><Link to="/p/$id" params={{ id: p.id }}>Ver publicación</Link></DropdownMenuItem>
        <DropdownMenuItem onSelect={() => a.perf(p)}>Ver rendimiento</DropdownMenuItem>
        <DropdownMenuItem disabled>Editar <span className="ml-auto text-[10px]">Próximamente</span></DropdownMenuItem>
        <DropdownMenuSeparator />
        {p.status === "active" && <DropdownMenuItem onSelect={() => a.pause(p)}>Pausar</DropdownMenuItem>}
        {(p.status === "paused" || p.status === "reserved") && <DropdownMenuItem onSelect={() => a.resume(p)}>Reactivar</DropdownMenuItem>}
        {p.status !== "sold" && <DropdownMenuItem onSelect={() => a.sold(p)}>Marcar como vendido</DropdownMenuItem>}
        {p.status === "active" && <DropdownMenuItem onSelect={() => a.promote(p)}>Promocionar</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void s.share()}>Compartir</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void s.copy()}>Copiar link</DropdownMenuItem>
        <DropdownMenuItem asChild><a href={s.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => a.remove(p)} className="text-destructive focus:text-destructive">Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
