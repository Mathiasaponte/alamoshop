import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_BUCKET = "product-images";
const SIGNED_TTL = 60 * 60; // 1 hora
const MARGIN = 5 * 60 * 1000; // renovar 5 min antes de expirar

// Cache en memoria: path → { url, expira }. Nunca se guarda en la BD.
const cache = new Map<string, { url: string; exp: number }>();

/**
 * Única puerta para convertir storage_path → URL visible.
 * Hoy el bucket es privado: signed URLs cacheadas en memoria.
 * Cuando sea público, cambiar SOLO esta función a getPublicUrl().
 */
export async function resolveImageUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const now = Date.now();
  const missing = [...new Set(paths.filter((p) => !(cache.get(p)?.exp! > now + MARGIN)))];
  if (missing.length) {
    const { data, error } = await supabase.storage.from(PRODUCT_BUCKET).createSignedUrls(missing, SIGNED_TTL);
    if (error) throw error;
    for (const d of data ?? []) if (d.path && d.signedUrl) cache.set(d.path, { url: d.signedUrl, exp: now + SIGNED_TTL * 1000 });
  }
  return paths.map((p) => cache.get(p)?.url ?? "");
}

export function useImageUrls(paths: string[]) {
  return useQuery({
    queryKey: ["image-urls", paths],
    queryFn: () => resolveImageUrls(paths),
    enabled: paths.length > 0,
    staleTime: SIGNED_TTL * 1000 - MARGIN,
  });
}
