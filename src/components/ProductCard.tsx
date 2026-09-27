import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { formatPrice, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { getSeller, favorites, toggleFavorite } = useStore();
  const seller = getSeller(product.sellerId);
  const fav = favorites.includes(product.id);
  return (
    <Link
      to="/p/$id"
      params={{ id: product.id }}
      className="group block overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">📦</div>
        )}
        <button
          type="button"
          aria-label={fav ? "Quitar de favoritos" : "Guardar"}
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.id);
            toast(fav ? "Quitado de favoritos" : "Guardado en favoritos");
          }}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur transition-transform active:scale-90"
        >
          <Heart key={String(fav)} className={`h-4 w-4 ${fav ? "fill-primary text-primary animate-in zoom-in-50 duration-300" : "text-foreground"}`} />
        </button>
        {product.status === "reserved" && (
          <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-1 text-[0.65rem] font-medium text-gold-foreground">Reservado</span>
        )}
        {product.status !== "reserved" && Date.now() - product.createdAt < 3 * 86400000 && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-medium text-primary-foreground">Nuevo</span>
        )}
      </div>
      <div className="p-3">
        <p className="font-display text-xl font-semibold text-primary">{formatPrice(product.price)}</p>
        <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
        <p className="text-xs text-muted-foreground">{product.condition}</p>
        {seller && (
          <div className="mt-2 border-t border-border pt-2">
            <p className="flex items-center gap-1 truncate text-xs text-foreground">
              {seller.name}
              {seller.rating > 0 && (
                <span className="ml-auto inline-flex items-center gap-0.5 text-muted-foreground">
                  <Star className="h-3 w-3 fill-gold text-gold" />
                  {seller.rating.toFixed(1)}
                </span>
              )}
            </p>
            <p className="text-[0.7rem] text-muted-foreground">
              {seller.level} · {seller.campus}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
