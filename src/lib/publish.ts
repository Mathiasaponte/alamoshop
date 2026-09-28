import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_BUCKET } from "./images";
import type { SellDraft } from "./sell";
import type { Campus, Level } from "./data";

export function toCents(price: string): number {
  // Evita floats: "850.5" → 85050
  const [int, dec = ""] = price.trim().replace(",", ".").split(".");
  return Number(int || "0") * 100 + Number((dec + "00").slice(0, 2));
}

async function toBlob(src: string): Promise<{ blob: Blob; ext: string }> {
  const blob = await (await fetch(src)).blob();
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  return { blob, ext };
}

/**
 * Publica en Cloud: sube fotos → crea producto → crea product_images.
 * seller_id sale siempre de la sesión. Si algo falla, limpia lo que alcanzó a crear.
 */
export async function publishDraft(d: SellDraft, campus: Campus, level: Level | null): Promise<string> {
  const { data: u, error: ue } = await supabase.auth.getUser();
  if (ue || !u.user) throw new Error("Necesitas iniciar sesión");
  const uid = u.user.id;
  const productId = crypto.randomUUID();
  const uploaded: string[] = [];
  let productCreated = false;

  try {
    // 1. Fotos (en orden: la primera es portada)
    for (const img of d.images) {
      const { blob, ext } = await toBlob(img);
      const path = `${uid}/${productId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw error;
      uploaded.push(path);
    }

    // 2. Producto
    const { error: pe } = await supabase.from("products").insert({
      id: productId,
      seller_id: uid,
      type: d.kind === "servicio" ? "service" : "product",
      title: d.title.trim().slice(0, 120),
      description: d.description.trim().slice(0, 2000),
      price_cents: toCents(d.price),
      currency: "MXN",
      category: d.category ?? "Otros",
      condition: d.kind === "servicio" ? null : d.condition,
      campus,
      level,
      delivery_locations: d.delivery,
      status: "active",
    });
    if (pe) throw pe;
    productCreated = true;

    // 3. Imágenes con sort_order
    const { error: ie } = await supabase.from("product_images").insert(
      uploaded.map((storage_path, i) => ({ product_id: productId, storage_path, sort_order: i })),
    );
    if (ie) throw ie;

    return productId;
  } catch (err) {
    // Cleanup best-effort: no dejar publicaciones rotas visibles
    if (productCreated) await supabase.from("products").update({ status: "removed" }).eq("id", productId);
    if (uploaded.length) await supabase.storage.from(PRODUCT_BUCKET).remove(uploaded);
    throw err;
  }
}
