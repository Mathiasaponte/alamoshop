export type Campus = "Norte" | "Sur";
export type Level = "Secundaria" | "Prepa";
export type Condition = "Nuevo" | "Como nuevo" | "Buen estado" | "Usado";
export type Delivery = "Campus Norte" | "Campus Sur" | "Ambos" | "Otro acuerdo";
export type ProductStatus = "draft" | "pending" | "active" | "paused" | "reserved" | "sold" | "removed";

export const CATEGORIES = [
  "Ropa",
  "Sneakers",
  "Tecnología",
  "Perfumes",
  "Accesorios",
  "Comida",
  "Videojuegos",
  "Arte",
  "Servicios",
  "Escuela",
  "Otros",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<Category, string> = {
  Ropa: "👕",
  Sneakers: "👟",
  Tecnología: "🎧",
  Perfumes: "🧴",
  Accesorios: "⌚",
  Comida: "🍪",
  Videojuegos: "🎮",
  Arte: "🎨",
  Servicios: "✨",
  Escuela: "📚",
  Otros: "📦",
};

export type Seller = {
  id: string;
  name: string;
  campus: Campus;
  level: Level;
  bio: string;
  rating: number;
  reviews: number;
  sales: number;
  since: string;
  initials: string;
};

export type Product = {
  id: string;
  sellerId: string;
  title: string;
  price: number;
  description: string;
  category: Category;
  condition: Condition;
  campus: Campus;
  level: Level;
  delivery: Delivery[];
  images: string[];
  status: ProductStatus;
  createdAt: number;
  likes: number;
  /** Cloud: ruta de portada en Storage (se resuelve a URL con src/lib/images.ts) */
  imagePath?: string | undefined;
  /** Cloud: nombre público del vendedor */
  sellerName?: string | undefined;
};

export type Review = { id: string; sellerId: string; author: string; stars: number; text: string };

const img = (id: string) => `https://images.unsplash.com/${id}?w=800&q=70&auto=format&fit=crop`;

export const SELLERS: Seller[] = [
  { id: "juan-perez", name: "Juan Pérez", campus: "Norte", level: "Prepa", bio: "Vendiendo cosas que ya no uso y sneakers.", rating: 4.8, reviews: 12, sales: 17, since: "feb 2026", initials: "JP" },
  { id: "sofia-ramirez", name: "Sofía Ramírez", campus: "Sur", level: "Prepa", bio: "Postres caseros cada viernes 🍫 Pedidos hasta el jueves.", rating: 4.9, reviews: 31, sales: 58, since: "ene 2026", initials: "SR" },
  { id: "diego-martinez", name: "Diego Martínez", campus: "Norte", level: "Secundaria", bio: "Gamer. Vendo juegos y controles en buen estado.", rating: 4.6, reviews: 7, sales: 9, since: "mar 2026", initials: "DM" },
  { id: "valeria-torres", name: "Valeria Torres", campus: "Sur", level: "Prepa", bio: "Fotografía y edición de video para tus eventos y proyectos.", rating: 5.0, reviews: 14, sales: 20, since: "nov 2025", initials: "VT" },
  { id: "mateo-gonzalez", name: "Mateo González", campus: "Norte", level: "Prepa", bio: "Tutorías de mate y física. Paciencia garantizada.", rating: 4.9, reviews: 22, sales: 40, since: "ago 2025", initials: "MG" },
  { id: "camila-lopez", name: "Camila López", campus: "Sur", level: "Secundaria", bio: "Pulseras y cadenas hechas a mano ✨", rating: 4.7, reviews: 9, sales: 26, since: "abr 2026", initials: "CL" },
  { id: "emilio-herrera", name: "Emilio Herrera", campus: "Norte", level: "Prepa", bio: "Diseño logos, posters y merch para equipos y eventos.", rating: 4.8, reviews: 6, sales: 11, since: "may 2026", initials: "EH" },
  { id: "regina-castro", name: "Regina Castro", campus: "Sur", level: "Prepa", bio: "Closet clean-out: ropa y perfumes casi nuevos.", rating: 4.5, reviews: 5, sales: 8, since: "jun 2026", initials: "RC" },
];

const day = 86_400_000;
const now = Date.UTC(2026, 8, 26);

type Seed = Omit<Product, "id" | "status" | "createdAt" | "likes" | "campus" | "level"> & { ago: number; likes: number };

const seeds: Seed[] = [
  { sellerId: "juan-perez", title: "Nike Air Max 90", price: 1450, description: "Talla 27 MX. Usados pocas veces, sin caja. Suela en muy buen estado.", category: "Sneakers", condition: "Buen estado", delivery: ["Campus Norte"], images: [img("photo-1542291026-7eec264c27ff")], ago: 1, likes: 34 },
  { sellerId: "juan-perez", title: "AirPods Pro", price: 1200, description: "Primera generación. Funcionan perfecto, incluye estuche de carga y puntas extra.", category: "Tecnología", condition: "Usado", delivery: ["Campus Norte", "Otro acuerdo"], images: [img("photo-1600294037681-c80b4cb5b434")], ago: 2, likes: 52 },
  { sellerId: "sofia-ramirez", title: "Caja de brownies (6 pzas)", price: 120, description: "Brownies de chocolate amargo con nuez. Hechos el mismo día de la entrega.", category: "Comida", condition: "Nuevo", delivery: ["Campus Sur"], images: [img("photo-1606313564200-e75d5e30476c")], ago: 0, likes: 71 },
  { sellerId: "sofia-ramirez", title: "Galletas chocochip x12", price: 90, description: "Galletas gigantes estilo NY. Pedidos antes del jueves.", category: "Comida", condition: "Nuevo", delivery: ["Campus Sur", "Campus Norte"], images: [img("photo-1499636136210-6f4ee915583e")], ago: 3, likes: 40 },
  { sellerId: "diego-martinez", title: "Control DualSense PS5", price: 850, description: "Blanco, sin drift. Lo cambio porque compré uno de color.", category: "Tecnología", condition: "Como nuevo", delivery: ["Campus Norte"], images: [img("photo-1606144042614-b2417e99c4e3")], ago: 4, likes: 18 },
  { sellerId: "valeria-torres", title: "Sesión de fotos (1 hora)", price: 600, description: "Fotos para graduación, redes o proyectos. Incluye 15 fotos editadas.", category: "Servicios", condition: "Nuevo", delivery: ["Ambos"], images: [img("photo-1516035069371-29a1b244cc32")], ago: 2, likes: 29 },
  { sellerId: "valeria-torres", title: "Edición de video para reels", price: 350, description: "Hasta 60 segundos, con música, subtítulos y transiciones.", category: "Servicios", condition: "Nuevo", delivery: ["Otro acuerdo"], images: [img("photo-1574717024653-61fd2cf4d44d")], ago: 6, likes: 15 },
  { sellerId: "mateo-gonzalez", title: "Tutoría de Cálculo", price: 200, description: "Sesión de 1 hora en biblioteca o en línea. Preparación para exámenes.", category: "Escuela", condition: "Nuevo", delivery: ["Campus Norte", "Otro acuerdo"], images: [img("photo-1497633762265-9d179a990aa6")], ago: 1, likes: 44 },
  { sellerId: "camila-lopez", title: "Cadena plateada minimal", price: 180, description: "Hecha a mano, acero inoxidable. No se oscurece.", category: "Accesorios", condition: "Nuevo", delivery: ["Campus Sur"], images: [img("photo-1599643478518-a784e5dc4c8f")], ago: 5, likes: 23 },
  { sellerId: "emilio-herrera", title: "Diseño de logo o poster", price: 400, description: "Para tu equipo, evento o emprendimiento. 2 rondas de cambios.", category: "Arte", condition: "Nuevo", delivery: ["Otro acuerdo"], images: [img("photo-1561070791-2526d30994b5")], ago: 3, likes: 12 },
  { sellerId: "regina-castro", title: "Perfume Carolina Herrera 212", price: 950, description: "80 ml, queda aprox. 85%. Original, con caja.", category: "Perfumes", condition: "Como nuevo", delivery: ["Campus Sur"], images: [img("photo-1541643600914-78b084683601")], ago: 2, likes: 37 },
  { sellerId: "regina-castro", title: "Hoodie oversize gris", price: 320, description: "Talla M, muy cómoda. La usé dos veces.", category: "Ropa", condition: "Como nuevo", delivery: ["Campus Sur", "Campus Norte"], images: [img("photo-1556821840-3a63f95609a7")], ago: 7, likes: 19 },
  { sellerId: "juan-perez", title: "Jordan 1 Low", price: 1900, description: "Talla 26.5 MX. Con caja original. Las vendo porque me quedan chicas.", category: "Sneakers", condition: "Buen estado", delivery: ["Campus Norte"], images: [img("photo-1600185365483-26d7a4cc7519")], ago: 8, likes: 60 },
  { sellerId: "diego-martinez", title: "Audífonos inalámbricos", price: 550, description: "Cancelación de ruido, 20 horas de batería.", category: "Tecnología", condition: "Usado", delivery: ["Campus Norte"], images: [img("photo-1505740420928-5e560c06d30e")], ago: 9, likes: 11 },
  { sellerId: "camila-lopez", title: "Reloj minimalista", price: 420, description: "Correa de piel café, pila nueva.", category: "Accesorios", condition: "Buen estado", delivery: ["Campus Sur"], images: [img("photo-1523275335684-37898b6baf30")], ago: 10, likes: 14 },
  { sellerId: "regina-castro", title: "Playera básica blanca", price: 150, description: "Algodón pesado, talla S. Nueva con etiqueta.", category: "Ropa", condition: "Nuevo", delivery: ["Campus Sur"], images: [img("photo-1521572163474-6864f9cf17ab")], ago: 4, likes: 8 },
  { sellerId: "emilio-herrera", title: "Pintura acrílica original", price: 700, description: "Lienzo 40x50 cm. Pieza única hecha por mí.", category: "Arte", condition: "Nuevo", delivery: ["Campus Norte"], images: [img("photo-1513364776144-60967b0f800f")], ago: 11, likes: 26 },
  { sellerId: "mateo-gonzalez", title: "iPad 9ª gen 64GB", price: 3800, description: "Con funda. Batería al 89%. Ideal para tomar apuntes.", category: "Tecnología", condition: "Buen estado", delivery: ["Campus Norte"], images: [img("photo-1544244015-0df4b3ffc6b0")], ago: 5, likes: 48 },
  { sellerId: "diego-martinez", title: "Gorra negra New Era", price: 250, description: "Ajustable. Sin uso.", category: "Accesorios", condition: "Nuevo", delivery: ["Campus Norte", "Campus Sur"], images: [img("photo-1588850561407-ed78c282e89b")], ago: 12, likes: 6 },
];

export const PRODUCTS: Product[] = seeds.map(({ ago, ...s }, i) => {
  const seller = SELLERS.find((x) => x.id === s.sellerId)!;
  return { ...s, id: `p${i + 1}`, campus: seller.campus, level: seller.level, status: "active", createdAt: now - ago * day, likes: s.likes };
});

export const REVIEWS: Review[] = [
  { id: "r1", sellerId: "juan-perez", author: "Andrea M.", stars: 5, text: "Súper puntual en la entrega, los tenis como en las fotos." },
  { id: "r2", sellerId: "juan-perez", author: "Luis R.", stars: 4, text: "Todo bien, buena comunicación." },
  { id: "r3", sellerId: "sofia-ramirez", author: "Paula G.", stars: 5, text: "Los mejores brownies de la escuela 🤤" },
  { id: "r4", sellerId: "mateo-gonzalez", author: "Iker S.", stars: 5, text: "Pasé mi examen gracias a sus tutorías." },
  { id: "r5", sellerId: "valeria-torres", author: "Natalia F.", stars: 5, text: "Las fotos quedaron increíbles." },
];

export const ME_ID = "me";

export const formatPrice = (n: number) =>
  `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
