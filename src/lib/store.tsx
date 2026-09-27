import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PRODUCTS,
  SELLERS,
  ME_ID,
  type Campus,
  type Level,
  type Product,
  type Seller,
} from "./data";

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

export const ORDER_FLOW = [
  "solicitud",
  "aceptada",
  "coordinando",
  "entregado",
  "completado",
] as const;

export type OrderStatus =
  | (typeof ORDER_FLOW)[number]
  | "cancelado"
  | "rechazado";

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
  review?: {
    stars: number;
    text: string;
  };
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
  prefs: {
    onboarded: false,
    member: false,
    campus: null,
    level: null,
    intent: null,
  },
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

  publish: (
    p: Omit<
      Product,
      "id" | "sellerId" | "status" | "createdAt" | "likes"
    >,
  ) => Product;

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

  /*
   * Carga segura del estado guardado.
   *
   * Si localStorage está corrupto o contiene una versión vieja,
   * la aplicación vuelve a valores seguros en vez de romper.
   */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;

        setState({
          prefs: {
            ...initial.prefs,
            ...(parsed.prefs ?? {}),
          },

          profile: parsed.profile ?? null,

          favorites: Array.isArray(parsed.favorites)
            ? parsed.favorites
            : [],

          orders: Array.isArray(parsed.orders)
            ? parsed.orders
            : [],

          myProducts: Array.isArray(parsed.myProducts)
            ? parsed.myProducts
            : [],

          blocked: Array.isArray(parsed.blocked)
            ? [...new Set(parsed.blocked)]
            : [],
        });
      }
    } catch (error) {
      console.warn(
        "No se pudo cargar el estado guardado de Álamos Shop:",
        error,
      );
    }

    setHydrated(true);
  }, []);

  /*
   * Guardado seguro.
   *
   * Las imágenes de las publicaciones pueden hacer que localStorage
   * llegue a su límite. Si ocurre, evitamos tumbar toda la aplicación.
   */
  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      console.warn(
        "No se pudo guardar Álamos Shop en localStorage:",
        error,
      );
    }
  }, [state, hydrated]);

  const update = useCallback(
    (fn: (s: State) => State) => setState(fn),
    [],
  );

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

      sales: state.orders.filter(
        (o) =>
          o.status === "completado" &&
          state.myProducts.some(
            (product) => product.id === o.productId,
          ),
      ).length,

      since: "sep 2026",

      initials: `${p.nombre[0] ?? ""}${p.apellido[0] ?? ""}`.toUpperCase(),
    };
  }, [state.profile, state.orders, state.myProducts]);

  /*
   * Productos visibles en el marketplace.
   *
   * Los vendedores bloqueados desaparecen de aquí.
   */
  const allProducts = useMemo(
    () =>
      [...state.myProducts, ...PRODUCTS].filter(
        (product) =>
          !state.blocked.includes(product.sellerId),
      ),
    [state.myProducts, state.blocked],
  );

  const value: Ctx = {
    ...state,

    hydrated,
    me,
    allProducts,

    /*
     * getProduct conserva acceso al catálogo original porque
     * las órdenes históricas pueden necesitar información del producto
     * incluso si posteriormente bloqueaste al vendedor.
     *
     * Las páginas públicas usan allProducts directamente.
     */
    getProduct: (id) =>
      state.myProducts.find((p) => p.id === id) ??
      PRODUCTS.find((p) => p.id === id),

    getSeller: (id) =>
      id === ME_ID
        ? me ?? undefined
        : SELLERS.find((seller) => seller.id === id),

    setPrefs: (prefs) =>
      update((s) => ({
        ...s,

        prefs: {
          ...s.prefs,
          ...prefs,
        },
      })),

    setProfile: (profile) =>
      update((s) => ({
        ...s,

        profile: {
          ...profile,

          nombre: profile.nombre.trim().slice(0, 40),
          apellido: profile.apellido.trim().slice(0, 40),

          instagram: profile.instagram.trim().slice(0, 40),
          whatsapp: profile.whatsapp.trim().slice(0, 20),

          bio: profile.bio.trim().slice(0, 140),
        },
      })),

    toggleFavorite: (id) =>
      update((s) => ({
        ...s,

        favorites: s.favorites.includes(id)
          ? s.favorites.filter(
              (favoriteId) => favoriteId !== id,
            )
          : [id, ...s.favorites],
      })),

    createOrder: (productId, note) => {
      /*
       * Evita solicitudes duplicadas si el usuario hace
       * doble click o intenta disparar la acción varias veces.
       */
      const existing = state.orders.find(
        (order) =>
          order.productId === productId &&
          ![
            "cancelado",
            "rechazado",
            "completado",
          ].includes(order.status),
      );

      if (existing) return existing;

      const order: Order = {
        id: `o${Date.now()}`,

        productId,

        buyerId: ME_ID,

        status: "solicitud",

        note: note.trim().slice(0, 500),

        createdAt: Date.now(),
      };

      update((s) => ({
        ...s,

        orders: [
          order,
          ...s.orders,
        ],
      }));

      return order;
    },

    setOrderStatus: (id, status) =>
      update((s) => ({
        ...s,

        orders: s.orders.map((order) =>
          order.id === id
            ? {
                ...order,
                status,
              }
            : order,
        ),
      })),

    reviewOrder: (id, stars, text) => {
      const safeStars = Math.min(
        5,
        Math.max(1, Math.round(stars)),
      );

      const safeText = text
        .trim()
        .slice(0, 600);

      update((s) => ({
        ...s,

        orders: s.orders.map((order) => {
          if (
            order.id !== id ||
            order.status !== "completado" ||
            order.review
          ) {
            return order;
          }

          return {
            ...order,

            review: {
              stars: safeStars,
              text: safeText,
            },
          };
        }),
      }));
    },

    publish: (data) => {
      const profile = state.profile;

      const product: Product = {
        ...data,

        id: `m${Date.now()}`,

        sellerId: ME_ID,

        title: data.title
          .trim()
          .slice(0, 60),

        description: data.description
          .trim()
          .slice(0, 600),

        price: Math.max(
          0,
          Number(data.price) || 0,
        ),

        images: data.images.slice(0, 6),

        delivery: [
          ...new Set(data.delivery),
        ],

        status: "active",

        createdAt: Date.now(),

        likes: 0,

        campus:
          profile?.campus ??
          data.campus,

        level:
          profile?.level ??
          data.level,
      };

      update((s) => ({
        ...s,

        myProducts: [
          product,
          ...s.myProducts,
        ],
      }));

      return product;
    },

    setProductStatus: (id, status) =>
      update((s) => ({
        ...s,

        myProducts: s.myProducts.map(
          (product) =>
            product.id === id
              ? {
                  ...product,
                  status,
                }
              : product,
        ),
      })),

    block: (sellerId) =>
      update((s) => {
        /*
         * No puedes bloquearte a ti mismo ni añadir
         * el mismo vendedor varias veces.
         */
        if (
          sellerId === ME_ID ||
          s.blocked.includes(sellerId)
        ) {
          return s;
        }

        return {
          ...s,

          blocked: [
            ...s.blocked,
            sellerId,
          ],
        };
      }),

    reset: () => setState(initial),
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);

  if (!ctx) {
    throw new Error(
      "useStore must be used inside StoreProvider",
    );
  }

  return ctx;
}
