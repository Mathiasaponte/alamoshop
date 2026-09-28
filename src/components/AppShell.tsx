import { Link } from "@tanstack/react-router";
import { Home, Search, PlusCircle, Receipt, User, Heart } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { ConsentGate } from "./ConsentGate";
import { CONTACT_EMAIL } from "@/lib/legal";

const footer = [
  { to: "/nosotros", label: "Nosotros" },
  { to: "/transparencia", label: "Transparencia" },
  { to: "/terminos", label: "Términos" },
  { to: "/privacidad", label: "Privacidad" },
  { to: "/reglas", label: "Reglas" },
] as const;

const desktop = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/categorias", label: "Categorías" },
  { to: "/vender", label: "Vender" },
  { to: "/ordenes", label: "Mis órdenes" },
  { to: "/favoritos", label: "Favoritos" },
] as const;

const mobile = [
  { to: "/marketplace", label: "Inicio", icon: Home },
  { to: "/categorias", label: "Buscar", icon: Search },
  { to: "/vender", label: "Vender", icon: PlusCircle },
  { to: "/ordenes", label: "Órdenes", icon: Receipt },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link to="/marketplace">
            <Logo variant="lockup" size={34} />
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {desktop.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "!text-primary font-medium" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/favoritos" className="rounded-full p-2 text-muted-foreground hover:text-primary md:hidden" aria-label="Favoritos">
              <Heart className="h-5 w-5" />
            </Link>
            <Link
              to="/perfil"
              className="hidden rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary md:inline-flex"
            >
              Perfil
            </Link>
          </div>
        </div>
      </header>

      <main className="animate-in fade-in duration-300">{children}</main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <Logo variant="lockup" size={28} />
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {footer.map((l) => (
                <Link key={l.to} to={l.to} className="hover:text-primary">{l.label}</Link>
              ))}
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary">Contacto</a>
            </nav>
          </div>
          <div className="mt-6 flex flex-col gap-1 text-xs text-muted-foreground md:flex-row md:justify-between">
            <p>Álamos Shop es una plataforma independiente.</p>
            <p className="tracking-[0.18em] uppercase">Built by <span className="font-semibold text-foreground">PEAK</span></p>
          </div>
        </div>
      </footer>
      <ConsentGate />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-5">
          {mobile.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 text-[0.68rem] text-muted-foreground"
              activeProps={{ className: "!text-primary" }}
            >
              {to === "/vender" ? (
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl text-primary md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-display font-semibold text-primary ring-1 ring-gold/40"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
