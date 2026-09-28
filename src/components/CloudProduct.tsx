import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useImageUrls } from "@/lib/images";

/** Vista mínima de un producto real guardado en Cloud (temporal hasta migrar /p/$id completa). */
export function CloudProduct({ id, fallback }: { id: string; fallback: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["cloud-product", id],
    enabled: /^[0-9a-f-]{36}$/i.test(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, description, price_cents, category, condition, campus, delivery_locations, status, seller:profiles!products_seller_id_fkey(id, display_name), product_images(storage_path, sort_order)")
        .eq("id", id)
        .neq("status", "removed")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const paths = (data?.product_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => i.storage_path);
  const { data: urls = [] } = useImageUrls(paths);

  if (isLoading) return <AppShell><p className="py-24 text-center text-sm text-muted-foreground">Cargando…</p></AppShell>;
  if (!data) return <>{fallback}</>;

  return (
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 md:grid-cols-2">
        <div className="space-y-2">
          <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
            {urls[0] && <img src={urls[0]} alt={data.title} className="h-full w-full object-cover" />}
          </div>
          {urls.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {urls.slice(1).map((u, i) => <img key={i} src={u} alt="" className="aspect-square rounded-lg object-cover" />)}
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow">{data.category}</p>
          <h1 className="mt-2 text-4xl text-primary">{data.title}</h1>
          <p className="mt-3 text-2xl font-semibold">${(data.price_cents / 100).toLocaleString("es-MX")} MXN</p>
          {data.status === "reserved" && <p className="mt-2 text-sm text-muted-foreground">Reservado</p>}
          {data.condition && <p className="mt-4 text-sm">Estado: {data.condition}</p>}
          <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{data.description}</p>
          <p className="mt-4 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{data.delivery_locations.join(" · ") || `Campus ${data.campus}`}</p>
          {data.seller && <p className="mt-6 text-sm">Vende: <span className="font-medium">{data.seller.display_name || "Estudiante"}</span></p>}
          <Link to="/marketplace" className="mt-8 inline-block text-sm text-primary underline">Volver al marketplace</Link>
        </div>
      </div>
    </AppShell>
  );
}
