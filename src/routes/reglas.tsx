import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/reglas")({
  head: () => ({
    meta: [
      { title: "Reglas de la comunidad — Álamos Shop" },
      { name: "description", content: "Qué se puede y qué no se puede publicar en Álamos Shop." },
      { property: "og:title", content: "Reglas de Álamos Shop" },
      { property: "og:description", content: "Una comunidad segura entre estudiantes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reglas,
});

const NO = ["Drogas, alcohol, tabaco o vapeadores", "Armas o cualquier objeto peligroso", "Contenido sexual", "Productos robados", "Falsificaciones o réplicas", "Servicios ilegales o que rompan el reglamento escolar"];

function Reglas() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <PageTitle title="Reglas de Álamos Shop" subtitle="Una comunidad segura entre estudiantes." />
        <div className="surface-card mt-6 p-6">
          <p className="eyebrow">No está permitido publicar</p>
          <ul className="mt-4 space-y-2 text-sm">{NO.map((n) => <li key={n} className="flex gap-2"><span className="text-primary">—</span>{n}</li>)}</ul>
        </div>
        <div className="surface-card mt-4 p-6 text-sm leading-relaxed text-muted-foreground">
          Describe tus productos con honestidad, usa fotos reales y entrega solo en puntos acordados dentro de la escuela. Las publicaciones que no cumplan pueden ser retiradas.
        </div>
      </div>
    </AppShell>
  );
}
