import { toast } from "sonner";
import type { Product } from "./data";

/** Helpers compartidos para compartir una publicación (SellSuccess, Mi tienda). */
export function productShare(product: Pick<Product, "id" | "title">) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${product.id}` : `/p/${product.id}`;
  const text = `Mira lo que publiqué en Álamos Shop: ${product.title}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.title, text, url });
      } catch {
        /* cancelado */
      }
      return;
    }
    await copy();
  };

  return { url, text, whatsapp, copy, share };
}
