import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const ORDER_LABEL: Record<OrderStatus, string> = {
  solicitud: "Solicitud enviada",
  aceptada: "Aceptada",
  coordinando: "Coordinando entrega",
  entregado: "Entregado",
  completado: "Completado",
  cancelado: "Cancelado",
  rechazado: "Rechazado",
};

const SELECT =
  "id, product_id, buyer_id, seller_id, status, note, created_at, updated_at, product:products(id, title, price_cents, status, product_images(storage_path, sort_order)), buyer:profiles!orders_buyer_id_fkey(display_name), seller:profiles!orders_seller_id_fkey(display_name)";

export type CloudOrder = {
  id: string; product_id: string; buyer_id: string; seller_id: string; status: OrderStatus; note: string;
  created_at: string; updated_at: string;
  product: { id: string; title: string; price_cents: number; status: string; product_images: { storage_path: string; sort_order: number }[] } | null;
  buyer: { display_name: string } | null;
  seller: { display_name: string } | null;
};

export const coverOf = (o: CloudOrder) =>
  [...(o.product?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path;

export async function fetchMyOrders(uid: string) {
  const { data, error } = await supabase.from("orders").select(SELECT).or(`buyer_id.eq.${uid},seller_id.eq.${uid}`).order("updated_at", { ascending: false });
  if (error) throw error;
  return data as unknown as CloudOrder[];
}

export async function fetchOrder(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from("orders").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as CloudOrder | null;
}

export async function fetchActiveOrderFor(productId: string, uid: string) {
  const { data, error } = await supabase.from("orders").select("id, status").eq("product_id", productId).eq("buyer_id", uid)
    .in("status", ["solicitud", "aceptada", "coordinando", "entregado"]).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOrder(productId: string, note: string) {
  const { data, error } = await supabase.rpc("create_order", { _product_id: productId, _note: note });
  if (error) throw error;
  return data;
}

export async function transitionOrder(id: string, to: OrderStatus) {
  const { data, error } = await supabase.rpc("transition_order", { _order_id: id, _to: to });
  if (error) throw error;
  return data;
}

export async function fetchOrderContact(id: string) {
  const { data, error } = await supabase.rpc("get_order_contact", { _order_id: id });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function fetchMyReview(orderId: string, uid: string) {
  const { data, error } = await supabase.from("reviews").select("id, stars, text").eq("order_id", orderId).eq("reviewer_id", uid).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createReview(o: CloudOrder, uid: string, stars: number, text: string) {
  const { error } = await supabase.from("reviews").insert({ order_id: o.id, reviewer_id: uid, reviewee_id: o.seller_id, stars, text: text.trim().slice(0, 500) });
  if (error) throw error;
}

export async function fetchSellerReviews(sellerId: string) {
  const { data, error } = await supabase.from("reviews").select("id, stars, text, created_at, reviewer:profiles!reviews_reviewer_id_fkey(display_name)")
    .eq("reviewee_id", sellerId).order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  return data as unknown as { id: string; stars: number; text: string; created_at: string; reviewer: { display_name: string } | null }[];
}

/** Refresca todo lo que depende de una orden. */
export function invalidateOrderData(qc: ReturnType<typeof useQueryClient>) {
  for (const k of ["orders", "order", "product", "catalog", "seller", "reviews", "active-order", "contact", "my-review"])
    void qc.invalidateQueries({ queryKey: [k] });
}

/** Realtime filtrado por usuario (como comprador y como vendedor). */
export function useOrdersRealtime(uid: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`orders-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${uid}` }, () => invalidateOrderData(qc))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `seller_id=eq.${uid}` }, () => invalidateOrderData(qc))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [uid, qc]);
}
