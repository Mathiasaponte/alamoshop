import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SellFlow } from "@/components/sell/SellFlow";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/vender")({
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
  component: Vender,
});

function Vender() {
  const { profile, hydrated } = useStore();

  if (!hydrated) return <div className="min-h-dvh bg-secondary" />;

  if (!profile) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <p className="eyebrow">Modo vendedor</p>
          <h1 className="mt-3 text-4xl text-primary">Crea tu perfil para vender</h1>
          <p className="mt-3 text-sm text-muted-foreground">Solo toma un minuto. Tus datos de contacto nunca se muestran públicamente.</p>
          <Link to="/perfil" className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Crear mi perfil</Link>
        </div>
      </AppShell>
    );
  }

  return <SellFlow />;
}
