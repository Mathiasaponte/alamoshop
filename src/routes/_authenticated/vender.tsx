import { createFileRoute } from "@tanstack/react-router";
import { SellFlow } from "@/components/sell/SellFlow";

export const Route = createFileRoute("/_authenticated/vender")({
  head: () => ({
    meta: [
      { title: "Publicar — Álamos Shop" },
      { name: "description", content: "Publica lo que quieras vender a otros estudiantes de Álamos en unos minutos." },
      { property: "og:title", content: "Vende en Álamos Shop" },
      { property: "og:description", content: "Te ayudamos a publicarlo en unos minutos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SellFlow,
});
