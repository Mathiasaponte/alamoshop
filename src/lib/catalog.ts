import { supabase } from "@/integrations/supabase/client";
import type { Campus, Category, Condition, Delivery, Level, Product } from "./data";

export const PAGE_SIZE = 12;

type Opt<T> = T | undefined;
export type CatalogFilters = {
  q?: Opt<string>; cat?: Opt<string>; campus?: Opt<string>; level?: Opt<string>;
  cond?: Opt<"Nuevo" | "Usado">; min?: Opt<number>; max?: Opt<number>;
  sort?: Opt<"recientes" | "menor" | "mayor" | "populares">; sellerId?: Opt<string>;
};

const SELECT =
  "id, seller_id, title, description, price_cents, category, condition, campus, level, delivery_locations, status, created_at, seller:profiles!products_seller_id_fkey(display_name), product_images(storage_path, sort_order)";

type Row = {
  id: string; seller_id: string; title: string; description: string; price_cents: number; category: string;
  condition: string | null; campus: string; level: string | null; delivery_locations: string[]; status: string; created_at: string;
  seller: { display_name: string } | null; product_images: { storage_path: string; sort_order: number }[];
};

export function toProduct(r: Row): Product {
  const imgs = [...(r.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: r.id,
    sellerId: r.seller_id,
    title: r.title,
    price: r.price_cents / 100,
    description: r.description,
    category: r.category as Category,
    condition: (r.condition ?? "Nuevo") as Condition,
    campus: r.campus as Campus,
    level: (r.level ?? "Prepa") as Level,
    delivery: r.delivery_locations as Delivery[],
    images: [],
    status: r.status as Product["status"],
    createdAt: new Date(r.created_at).getTime(),
    likes: 0,
    imagePath: imgs[0]?.storage_path,
    sellerName: r.seller?.display_name || "Estudiante",
  };
}

const clean = (s: string) => s.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

export async function searchSellers(term: string) {
  const t = clean(term);
  if (t.length < 2) return [];
  const { data, error } = await supabase.from("profiles").select("id, display_name, campus, level").ilike("display_name", `%${t}%`).limit(4);
  if (error) throw error;
  return data ?? [];
}

/** Una página del catálogo público (active + reserved), filtrado y ordenado en el backend. */
export async function fetchCatalogPage(f: CatalogFilters, page: number) {
  let q = supabase.from("products").select(SELECT, { count: "exact" }).in("status", ["active", "reserved"]);

  if (f.q) {
    const t = clean(f.q);
    if (t) {
      const sellers = await searchSellers(t);
      const ors = [`title.ilike.%${t}%`, `description.ilike.%${t}%`];
      if (sellers.length) ors.push(`seller_id.in.(${sellers.map((s) => s.id).join(",")})`);
      q = q.or(ors.join(","));
    }
  }
  if (f.sellerId) q = q.eq("seller_id", f.sellerId);
  if (f.cat) q = q.eq("category", f.cat);
  if (f.cond === "Nuevo") q = q.eq("condition", "Nuevo");
  if (f.cond === "Usado") q = q.neq("condition", "Nuevo");
  if (f.min != null) q = q.gte("price_cents", Math.round(f.min * 100));
  if (f.max != null) q = q.lte("price_cents", Math.round(f.max * 100));
  if (f.campus === "Norte" || f.campus === "Sur") q = q.eq("campus", f.campus);
  if (f.level === "Secundaria" || f.level === "Prepa") q = q.eq("level", f.level);

  if (f.sort === "menor") q = q.order("price_cents", { ascending: true });
  else if (f.sort === "mayor") q = q.order("price_cents", { ascending: false });
  q = q.order("created_at", { ascending: false }).order("id");

  const from = page * PAGE_SIZE;
  const { data, error, count } = await q.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { items: (data as unknown as Row[]).map(toProduct), count: count ?? 0, page };
}

export async function fetchProduct(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from("products").select(SELECT).eq("id", id).in("status", ["active", "reserved", "sold"]).maybeSingle();
  if (error) throw error;
  return data ? { product: toProduct(data as unknown as Row), paths: [...(data as unknown as Row).product_images].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.storage_path) } : null;
}

export async function fetchSeller(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [{ data: p, error }, { data: s }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, campus, level, bio, created_at").eq("id", id).maybeSingle(),
    supabase.from("seller_stats").select("rating, review_count, sales").eq("seller_id", id).maybeSingle(),
  ]);
  if (error) throw error;
  return p ? { ...p, rating: Number(s?.rating ?? 0), reviews: Number(s?.review_count ?? 0), sales: Number(s?.sales ?? 0) } : null;
}
