import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS, SELLERS, ME_ID, type Campus, type Level, type Product, type Seller } from "./data";

export type Intent = "comprar" | "vender" | "ambos";
export type Prefs = {
  onboarded: boolean;
  member: boolean;
  campus: Campus | null;
  level: Level | null;
  intent: Intent | null;
};
export type Profile = {
  nombre: string;
  apellido: string;
  campus: Campus;
  level: Level;
  instagram: string;
  whatsapp: string;
  bio: string;
};

export const ORDER_FLOW = ["solicitud", "aceptada", "coordinando", "entregado", "completado"] as const;
export type OrderStatus = (typeof ORDER_FLOW)[number] | "cancelado" | "rechazado";
export const ORDER_LABEL: Record<OrderStatus, string> = {
  solicitud: "Solicitud enviada",
  aceptada: "Aceptada",
  coordinando: "Coordinando entrega",
  entregado: "Entregado",
  completado: "Completado",
  cancelado: "Cancelado",
  rechazado: "Rechazado",
};

export type Order = {
  id: string;
  productId: string;
  buyerId: string;
  status: OrderStatus;
  note: string;
  createdAt: number;
  review?: { stars: number; text: string };
};

type State = {
  prefs: Prefs;
  profile: Profile | null;
  favorites: string[];
  orders: Order[];
  myProducts: Product[];
  blocked: string[];
};

const initial: State = {
  prefs: { onboarded: false, member: false, campus: null, level: null, intent: null },
  profile: null,
  favorites: [],
  orders: [],
  myProducts: [],
  blocked: [],
};

const KEY = "alamos-shop-v1";

type Ctx = State & {
  hydrated: boolean;
  setPrefs: (p: Partial<Prefs>) => void;
  setProfile: (p: Profile) => void;
  toggleFavorite: (id: string) => void;
  createOrder: (productId: string, note: string) => Order;
  setOrderStatus: (id: string, s: OrderStatus) => void;
  reviewOrder: (id: string, stars: number, text: string) => void;
  publish: (p: Omit<Product, "id" | "sellerId" | "status" | "createdAt" | "likes">) => Product;
  setProductStatus: (id: string, s: Product["status"]) => void;
  block: (sellerId: string) => void;
  allProducts: Product[];
  getProduct: (id: string) => Product | undefined;
  getSeller: (id: string) => Seller | undefined;
  me: Seller | null;
  reset: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const update = useCallback((fn: (s: State) => State) => setState(fn), []);

  const me: Seller | null = useMemo(() => {
    const p = state.profile;
    if (!p) return null;
    return {
      id: ME_ID,
      name: `${p.nombre} ${p.apellido}`.trim(),
      campus: p.campus,
      level: p.level,
      bio: p.bio,
      rating: 0,
      reviews: 0,
      sales: state.orders.filter((o) => o.status === "completado" && state.myProducts.some((m) => m.id === o.productId)).length,
      since: "sep 2026",
      initials: `${p.nombre[0] ?? ""}${p.apellido[0] ?? ""}`.toUpperCase(),
    };
  }, [state.profile, state.orders, state.myProducts]);

  const allProducts = useMemo(
    () => [...state.myProducts, ...PRODUCTS].filter((p) => !state.blocked.includes(p.sellerId)),
    [state.myProducts, state.blocked],
  );

  const value: Ctx = {
    ...state,
    hydrated,
    me,
    allProducts,
    getProduct: (id) => allProducts.find((p) => p.id === id) ?? PRODUCTS.find((p) => p.id === id),
    getSeller: (id) => (id === ME_ID ? me ?? undefined : SELLERS.find((s) => s.id === id)),
    setPrefs: (p) => update((s) => ({ ...s, prefs: { ...s.prefs, ...p } })),
    setProfile: (profile) => update((s) => ({ ...s, profile })),
    toggleFavorite: (id) =>
      update((s) => ({
        ...s,
        favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
      })),
    createOrder: (productId, note) => {
      const order: Order = { id: `o${Date.now()}`, productId, buyerId: ME_ID, status: "solicitud", note, createdAt: Date.now() };
      update((s) => ({ ...s, orders: [order, ...s.orders] }));
      return order;
    },
    setOrderStatus: (id, status) =>
      update((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
    reviewOrder: (id, stars, text) =>
      update((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, review: { stars, text } } : o)) })),
    publish: (data) => {
      const p = state.profile;
      const product: Product = {
        ...data,
        id: `m${Date.now()}`,
        sellerId: ME_ID,
        status: "active",
        createdAt: Date.now(),
        likes: 0,
        campus: p?.campus ?? data.campus,
        level: p?.level ?? data.level,
      };
      update((s) => ({ ...s, myProducts: [product, ...s.myProducts] }));
      return product;
    },
    setProductStatus: (id, status) =>
      update((s) => ({ ...s, myProducts: s.myProducts.map((m) => (m.id === id ? { ...m, status } : m)) })),
    block: (sellerId) => update((s) => ({ ...s, blocked: [...s.blocked, sellerId] })),
    reset: () => setState(initial),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
