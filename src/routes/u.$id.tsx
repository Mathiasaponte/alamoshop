import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import {
  Ban,
  Flag,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import {
  AppShell,
  Avatar,
} from "@/components/AppShell";

import { ProductCard } from "@/components/ProductCard";

import {
  REVIEWS,
  SELLERS,
} from "@/lib/data";

import { useStore } from "@/lib/store";

export const Route = createFileRoute(
  "/u/$id",
)({
  head: ({ params }) => {
    const seller =
      SELLERS.find(
        (s) =>
          s.id === params.id,
      );

    const title = seller
      ? `${seller.name} — Álamos Shop`
      : "Perfil — Álamos Shop";

    const desc = seller
      ? `${seller.level} · ${seller.campus}. ${seller.bio}`
      : "Perfil de estudiante vendedor en Álamos Shop.";

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
          property:
            "og:description",

          content: desc,
        },
      ],
    };
  },

  component: SellerPage,
});

function SellerPage() {
  const { id } =
    Route.useParams();

  const navigate =
    useNavigate();

  const {
    getSeller,
    allProducts,
    block,
    blocked,
  } = useStore();

  const seller =
    getSeller(id);

  const [tab, setTab] =
    useState<
      | "activos"
      | "vendidos"
      | "resenas"
    >("activos");

  /*
   * Si el vendedor está bloqueado,
   * tampoco permitimos entrar directamente
   * escribiendo /u/id en la URL.
   */
  if (
    id !== "me" &&
    blocked.includes(id)
  ) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <Ban className="mx-auto h-8 w-8 text-muted-foreground" />

          <h1 className="mt-4 font-display text-3xl text-primary">
            Usuario bloqueado
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Ya no verás el perfil ni las publicaciones de este vendedor.
          </p>

          <Link
            to="/marketplace"

            className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Volver al marketplace
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!seller) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="font-display text-3xl text-primary">
            Perfil no encontrado
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Este vendedor no existe o su perfil ya no está disponible.
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
  }

  const products =
    allProducts.filter(
      (product) =>
        product.sellerId ===
        id,
    );

  const active =
    products.filter(
      (product) =>
        product.status ===
          "active" ||
        product.status ===
          "reserved",
    );

  const sold =
    products.filter(
      (product) =>
        product.status ===
        "sold",
    );

  const reviews =
    REVIEWS.filter(
      (review) =>
        review.sellerId ===
        id,
    );

  const report = () => {
    toast(
      "Reporte registrado en modo demo. La moderación real se conectará al backend.",
    );
  };

  const blockSeller = () => {
    if (id === "me") return;

    block(id);

    toast(
      "Usuario bloqueado. Ya no verás sus publicaciones.",
    );

    navigate({
      to: "/marketplace",
    });
  };

  return (
    <AppShell>
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-10 text-center md:px-6">
          <Avatar
            initials={
              seller.initials
            }

            size={88}
          />

          <h1 className="mt-4 text-3xl text-primary">
            {seller.name}
          </h1>

          <p className="text-sm text-muted-foreground">
            {seller.level} ·{" "}
            {seller.campus}
          </p>

          <div className="mt-4 flex gap-6 text-sm">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-gold text-gold" />

              {seller.rating > 0
                ? seller.rating.toFixed(
                    1,
                  )
                : "Nuevo"}
            </span>

            <span>
              {seller.reviews}{" "}
              {seller.reviews === 1
                ? "reseña"
                : "reseñas"}
            </span>

            <span>
              {seller.sales}{" "}
              {seller.sales === 1
                ? "venta"
                : "ventas"}
            </span>
          </div>

          {seller.bio && (
            <p className="mt-4 max-w-md italic text-foreground">
              “{seller.bio}”
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            En Álamos Shop desde{" "}
            {seller.since}
          </p>

          {id !== "me" && (
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <button
                onClick={report}

                className="flex items-center gap-1 hover:text-destructive"
              >
                <Flag className="h-3.5 w-3.5" />

                Reportar
              </button>

              <button
                onClick={
                  blockSeller
                }

                className="flex items-center gap-1 hover:text-destructive"
              >
                <Ban className="h-3.5 w-3.5" />

                Bloquear
              </button>
            </div>
          )}
        </div>

        <div className="mx-auto flex max-w-6xl justify-center gap-6 px-4 text-sm">
          {(
            [
              [
                "activos",
                `Activos (${active.length})`,
              ],

              [
                "vendidos",
                `Vendidos (${sold.length})`,
              ],

              [
                "resenas",
                `Reseñas (${reviews.length})`,
              ],
            ] as const
          ).map(
            ([
              key,
              label,
            ]) => (
              <button
                key={key}

                onClick={() =>
                  setTab(key)
                }

                className={`border-b-2 pb-3 ${
                  tab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {tab ===
        "resenas" ? (
          <div className="space-y-3">
            {reviews.length ===
              0 && (
              <div className="surface-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aún no hay reseñas.
                </p>
              </div>
            )}

            {reviews.map(
              (review) => (
                <div
                  key={
                    review.id
                  }

                  className="surface-card p-4"
                >
                  <p className="text-sm text-gold">
                    {"★".repeat(
                      review.stars,
                    )}

                    <span className="text-border">
                      {"★".repeat(
                        5 -
                          review.stars,
                      )}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-foreground">
                    {
                      review.text
                    }
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    —{" "}
                    {
                      review.author
                    }
                  </p>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(
              tab ===
              "activos"
                ? active
                : sold
            ).map(
              (product) => (
                <ProductCard
                  key={
                    product.id
                  }

                  product={
                    product
                  }
                />
              ),
            )}

            {(
              tab ===
              "activos"
                ? active
                : sold
            ).length === 0 && (
              <div className="surface-card col-span-full p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nada que mostrar.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
