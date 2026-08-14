import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso de familias — Álamos Shop" },
      {
        name: "description",
        content:
          "Ingresa con el correo registrado en el Colegio Álamos Cancún para acceder a la tienda oficial Álamos Shop.",
      },
      { property: "og:title", content: "Acceso de familias — Álamos Shop" },
      {
        property: "og:description",
        content: "Acceso seguro a la tienda oficial del Colegio Álamos Cancún.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-6 py-16">
      <Logo variant="full" size={150} />
      <div className="mt-8 h-px w-20 rule-gold" />
      <div className="surface-card mt-10 w-full max-w-md p-8">
        <h1 className="text-center text-2xl text-primary">Acceso de familias</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Usa el correo registrado en el colegio.
        </p>
        <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Correo
            </label>
            <input
              id="email"
              type="email"
              placeholder="familia@colegioalamos.mx"
              className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-xs uppercase tracking-[0.16em] text-muted-foreground"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-deep)]"
          >
            Entrar
          </button>
        </form>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Colegio Álamos Cancún · Comunidad verificada
      </p>
    </div>
  );
}
