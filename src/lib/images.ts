import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_BUCKET = "product-images";
const SIGNED_TTL = 60 * 60; // 1 hora

/**
 * Única puerta para convertir storage_path → URL visible.
 * Hoy el bucket es privado: pedimos signed URLs (nunca se guardan en la BD).
 * Cuando sea público, cambiar SOLO esta función a getPublicUrl().
 */
export async function resolveImageUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { data, error } = await supabase.storage.from(PRODUCT_BUCKET).createSignedUrls(paths, SIGNED_TTL);
  if (error) throw error;
  return paths.map((p) => data?.find((d) => d.path === p)?.signedUrl ?? "");
}

export function useImageUrls(paths: string[]) {
  return useQuery({
    queryKey: ["image-urls", paths],
    queryFn: () => resolveImageUrls(paths),
    enabled: paths.length > 0,
    staleTime: (SIGNED_TTL - 300) * 1000,
  });
}
