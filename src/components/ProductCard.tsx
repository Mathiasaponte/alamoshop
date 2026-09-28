import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart } from "lucide-react";
import { formatPrice, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { useImageUrls } from "@/lib/images";

export function ProductCard({ product }: { product: Product }) {
  const { getSeller, favorites, toggleFavorite } = useStore();
  const seller = getSeller(product.sellerId);
  const fav = favorites.includes(product.id);
  const [loaded, setLoaded] = useState(false);
  const { data: urls } = useImageUrls(product.imagePath ? [product.imagePath] : []);
  const cover = product.imagePath ? urls?.[0] : product.images[0];
  const sellerName = product.sellerName ?? seller?.name;
  return (
    <Link to="/p/$id" params={{ id: product.id }} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={product.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0"}`}
          />
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
      </div>
      <div className="px-0.5 pt-2.5">
        <p className="text-base font-semibold text-foreground">{formatPrice(product.price)}</p>
        <p className="truncate text-sm text-foreground/80">{product.title}</p>
        {sellerName && <p className="truncate text-xs text-muted-foreground">{sellerName}</p>}
      </div>
    </Link>
  );
}
