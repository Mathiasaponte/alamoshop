import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import {
  AppShell,
  Avatar,
} from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";

import {
  formatPrice,
  PRODUCTS,
} from "@/lib/data";

import { useStore } from "@/lib/store";
import { CloudProduct } from "@/components/CloudProduct";

export const Route = createFileRoute("/p/$id")({
  head: ({ params }) => {
    const p = PRODUCTS.find(
      (product) => product.id === params.id,
    );

    const title = p
      ? `${p.title} · ${formatPrice(p.price)} — Álamos Shop`
      : "Producto — Álamos Shop";

    const desc = p
      ? p.description
      : "Publicación de un estudiante en Álamos Shop.";

    return {
      meta: [
        {
          title,
        },
        {
          name: "description",
          content: desc,
        },
        {
          property: "og:title",
          content: title,
        },
        {
          property: "og:description",
          content: desc,
        },

        ...(p?.images[0]
          ? [
              {
                property: "og:image",
                content: p.images[0],
              },
              {
                name: "twitter:image",
                content: p.images[0],
              },
            ]
          : []),
      ],
    };
  },

  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();

  const {
    allProducts,
    getSeller,
    favorites,
    toggleFavorite,
    createOrder,
    orders,
    hydrated,
  } = useStore();

  const navigate = useNavigate();

  /*
   * IMPORTANTE:
   *
   * Las páginas públicas solamente buscan dentro de allProducts.
   *
   * Esto evita que alguien pueda entrar manualmente a /p/ID
   * para volver a ver una publicación de un usuario bloqueado.
   */
  const product = allProducts.find(
    (p) => p.id === id,
  );

  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);

  if (!product) {
    const notFound = (
      <AppShell>
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <p className="font-display text-3xl text-primary">
            {hydrated
              ? "Esta publicación ya no está disponible"
              : "Cargando…"}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Puede haber sido eliminada, vendida o pertenecer a un usuario bloqueado.
          </p>

          <Link
            to="/marketplace"
            className="mt-6 inline-block text-sm text-primary underline"
          >
            Volver al marketplace
          </Link>
        </div>
      </AppShell>
    );
    return <CloudProduct id={id} fallback={notFound} />;
  }

  const seller = getSeller(
    product.sellerId,
  );

  const fav = favorites.includes(
    product.id,
  );

  const existing = orders.find(
    (order) =>
      order.productId === product.id &&
      ![
        "cancelado",
        "rechazado",
        "completado",
      ].includes(order.status),
  );

  const isMine =
    product.sellerId === "me";

  const isAvailable =
    product.status === "active";

  const unavailableLabel =
    product.status === "reserved"
      ? "Producto reservado"
      : "Producto no disponible";

  const visible = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      (
        p.status === "active" ||
        p.status === "reserved"
      ),
  );

  const fromSeller = visible
    .filter(
      (p) =>
        p.sellerId === product.sellerId,
    )
    .slice(0, 4);

  const similar = visible
    .filter(
      (p) =>
        p.category === product.category &&
        p.sellerId !== product.sellerId,
    )
    .slice(0, 4);

  const request = () => {
    if (!isAvailable) {
      toast.error(
        "Este producto ya no está disponible.",
      );

      return;
    }

    const order = createOrder(
      product.id,
      note,
    );

    toast.success(
      "Solicitud enviada",
      {
        description:
          "Te avisaremos cuando el vendedor responda.",
      },
    );

    navigate({
      to: "/ordenes/$id",

      params: {
        id: order.id,
      },
    });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-0 md:px-6 md:py-8">
        <button
          onClick={() => history.back()}
          className="m-4 hidden items-center gap-2 text-sm text-muted-foreground hover:text-primary md:m-0 md:mb-4 md:inline-flex"
        >
          <ArrowLeft className="h-4 w-4" />

          Volver
        </button>

        <div className="grid gap-0 md:grid-cols-2 md:gap-10">
          <div className="relative aspect-square overflow-hidden bg-muted md:rounded-2xl">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">
                📦
              </div>
            )}

            <button
              onClick={() => history.back()}
              className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 md:hidden"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-6 md:px-0 md:py-0">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-accent px-3 py-1 text-primary">
                {product.category}
              </span>

              <span className="rounded-full bg-accent px-3 py-1 text-foreground">
                {product.condition}
              </span>

              {product.status === "reserved" && (
                <span className="rounded-full bg-gold px-3 py-1 text-gold-foreground">
                  Reservado
                </span>
              )}

              {product.status === "sold" && (
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                  Vendido
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl text-foreground md:text-4xl">
              {product.title}
            </h1>

            <p className="mt-2 font-display text-4xl font-semibold text-primary">
              {formatPrice(
                product.price,
              )}
            </p>

            <p className="mt-5 leading-relaxed text-foreground">
              {product.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-border py-5 text-sm">
              <div>
                <dt className="eyebrow">
                  Disponible en
                </dt>

                <dd className="mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />

                  Campus {product.campus}
                </dd>
              </div>

              <div>
                <dt className="eyebrow">
                  Nivel del vendedor
                </dt>

                <dd className="mt-1">
                  {product.level}
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="eyebrow">
                  Entrega
                </dt>

                <dd className="mt-1">
                  {product.delivery.join(
                    " · ",
                  )}
                </dd>
              </div>
            </dl>

            {seller && (
              <Link
                to="/u/$id"

                params={{
                  id: seller.id,
                }}

                className="mt-5 flex items-center gap-3 rounded-xl p-3 ring-1 ring-border transition-colors hover:ring-primary"
              >
                <Avatar
                  initials={seller.initials}
                  size={46}
                />

                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {seller.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {seller.level} ·{" "}
                    {seller.campus}
                  </p>
                </div>

                {seller.rating > 0 && (
                  <p className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-gold text-gold" />

                    {seller.rating.toFixed(
                      1,
                    )}

                    <span className="text-muted-foreground">
                      ({seller.sales})
                    </span>
                  </p>
                )}
              </Link>
            )}

            {asking &&
              isAvailable &&
              !existing && (
                <div className="mt-5 animate-in fade-in slide-in-from-top-2">
                  <label className="eyebrow">
                    Mensaje para el vendedor (opcional)
                  </label>

                  <textarea
                    value={note}

                    onChange={(e) =>
                      setNote(
                        e.target.value,
                      )
                    }

                    rows={3}
                    maxLength={500}

                    placeholder="¿Cuándo podrías entregarlo?"

                    className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-primary"
                  />

                  <p className="mt-1 text-right text-[0.7rem] text-muted-foreground">
                    {note.length}/500
                  </p>
                </div>
              )}

            <div className="sticky bottom-20 mt-6 flex gap-2 md:static">
              {isMine ? (
                <Link
                  to="/tienda"

                  className="flex-1 rounded-full bg-primary py-3.5 text-center text-sm font-medium text-primary-foreground"
                >
                  Administrar en Mi tienda
                </Link>
              ) : existing ? (
                <Link
                  to="/ordenes/$id"

                  params={{
                    id: existing.id,
                  }}

                  className="flex-1 rounded-full bg-primary py-3.5 text-center text-sm font-medium text-primary-foreground"
                >
                  Ver mi orden
                </Link>
              ) : !isAvailable ? (
                <button
                  disabled

                  className="flex-1 cursor-not-allowed rounded-full bg-muted py-3.5 text-sm font-medium text-muted-foreground"
                >
                  {unavailableLabel}
                </button>
              ) : (
                <button
                  onClick={() =>
                    asking
                      ? request()
                      : setAsking(true)
                  }

                  className="flex-1 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-deep)] active:scale-[0.98]"
                >
                  {asking
                    ? "Enviar solicitud"
                    : "Solicitar compra"}
                </button>
              )}

              <button
                onClick={() =>
                  toggleFavorite(
                    product.id,
                  )
                }

                className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background"

                aria-label={
                  fav
                    ? "Quitar de favoritos"
                    : "Guardar en favoritos"
                }

                aria-pressed={fav}
              >
                <Heart
                  className={`h-5 w-5 ${
                    fav
                      ? "fill-primary text-primary"
                      : ""
                  }`}
                />
              </button>
            </div>

            {!isMine && (
              <button
                disabled={
                  !existing &&
                  !isAvailable
                }

                onClick={() => {
                  if (existing) {
                    navigate({
                      to: "/ordenes/$id",

                      params: {
                        id: existing.id,
                      },
                    });

                    return;
                  }

                  if (!isAvailable) {
                    return;
                  }

                  setAsking(true);

                  toast(
                    "Envía una solicitud para iniciar la compra.",
                  );
                }}

                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />

                {existing
                  ? "Ver coordinación"
                  : isAvailable
                    ? "Contactar"
                    : "No disponible"}
              </button>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-accent p-4 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />

              <p>
                Los datos de contacto solo se comparten durante la coordinación de una compra. Realiza las entregas en lugares públicos y seguros.
              </p>
            </div>

            <button
              onClick={() =>
                toast(
                  "Reporte registrado en modo demo. La moderación real se conectará al backend.",
                )
              }

              className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Flag className="h-3.5 w-3.5" />

              Reportar publicación
            </button>
          </div>
        </div>

        {[
          [
            "Más productos de este vendedor",
            fromSeller,
          ],

          [
            "Productos similares",
            similar,
          ],
        ].map(([title, list]) =>
          (list as typeof visible)
            .length ? (
            <section
              key={title as string}
              className="px-4 pt-10 md:px-0"
            >
              <h2 className="text-2xl text-primary">
                {title as string}
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-5">
                {(
                  list as typeof visible
                ).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                  />
                ))}
              </div>
            </section>
          ) : null,
        )}

        <div className="h-10" />
      </div>
    </AppShell>
  );
}
