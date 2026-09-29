import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./use-session";
import { useStore } from "./store";

/*
 * Favoritos: con sesión viven en Cloud (tabla favorites, un solo query compartido
 * por todas las tarjetas); sin sesión, en el navegador. Al iniciar sesión los
 * locales se suben (dedupe por PK) y se limpian.
 */
type Ctx = { ids: Set<string>; isFav: (id: string) => boolean; toggle: (id: string) => void; userId: string | null; ready: boolean };
const FavCtx = createContext<Ctx | null>(null);

const UUID = /^[0-9a-f-]{36}$/i;

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useSession();
  const uid = user?.id ?? null;
  const qc = useQueryClient();
  const store = useStore();
  const key = ["favorites", uid] as const;

  const q = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("product_id").eq("user_id", uid!);
      if (error) throw error;
      return data.map((r) => r.product_id);
    },
  });

  // Migrar favoritos locales al iniciar sesión
  const migrated = useRef<string | null>(null);
  useEffect(() => {
    if (!uid || !store.hydrated || migrated.current === uid) return;
    migrated.current = uid;
    const local = store.favorites.filter((id) => UUID.test(id));
    if (!local.length) return;
    void supabase
      .from("favorites")
      .upsert(local.map((product_id) => ({ user_id: uid, product_id })), { onConflict: "user_id,product_id", ignoreDuplicates: true })
      .then(({ error }) => {
        if (error) { migrated.current = null; return; }
        local.forEach((id) => store.toggleFavorite(id)); // quita la copia local ya migrada
        void qc.invalidateQueries({ queryKey: ["favorites"] });
      });
  }, [uid, store.hydrated, store.favorites, store, qc]);

  const m = useMutation({
    mutationFn: async ({ id, add }: { id: string; add: boolean }) => {
      const { error } = add
        ? await supabase.from("favorites").upsert({ user_id: uid!, product_id: id }, { onConflict: "user_id,product_id", ignoreDuplicates: true })
        : await supabase.from("favorites").delete().eq("user_id", uid!).eq("product_id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, add }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData<string[]>(key, add ? [id, ...prev.filter((x) => x !== id)] : prev.filter((x) => x !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.prev);
      toast.error("No pudimos guardar el cambio. Intenta de nuevo.");
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const ids = new Set(uid ? q.data ?? [] : store.favorites);
  const value: Ctx = {
    ids,
    userId: uid,
    ready,
    isFav: (id) => ids.has(id),
    toggle: (id) => {
      const add = !ids.has(id);
      if (uid) m.mutate({ id, add });
      else store.toggleFavorite(id);
      toast(add ? "Guardado en favoritos" : "Quitado de favoritos");
    },
  };
  return <FavCtx.Provider value={value}>{children}</FavCtx.Provider>;
}

export function useFavorites() {
  const c = useContext(FavCtx);
  if (!c) throw new Error("useFavorites fuera de FavoritesProvider");
  return c;
}
