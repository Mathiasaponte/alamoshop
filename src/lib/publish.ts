import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_BUCKET } from "./images";
import type { SellDraft } from "./sell";
import type { Campus, Level } from "./data";
import { validateListing } from './listing-validation';
export { toCents } from './listing-validation';

async function toBlob(src: string): Promise<{ blob: Blob; ext: string }> {
  const blob = await (await fetch(src)).blob();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) || blob.size > 5 * 1024 * 1024) throw new Error('Usa fotos JPG, PNG o WebP de hasta 5 MB.');
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  return { blob, ext };
}

/**
 * Publica en Cloud: sube fotos → crea producto → crea product_images.
 * seller_id sale siempre de la sesión. Si algo falla, limpia lo que alcanzó a crear.
 */
export async function publishDraft(d: SellDraft, campus: Campus, level: Level | null): Promise<string> {
  const priceCents = validateListing(d);
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
      title: d.title.trim(),
      description: d.description.trim(),
      price_cents: priceCents,
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
