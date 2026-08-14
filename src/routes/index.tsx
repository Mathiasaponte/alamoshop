import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Álamos Shop — Tienda oficial del Colegio Álamos Cancún" },
      {
        name: "description",
        content:
          "Uniformes, papelería y artículos oficiales del Colegio Álamos Cancún. Una tienda escolar clara, segura y organizada para la comunidad.",
      },
      { property: "og:title", content: "Álamos Shop — Tienda oficial del Colegio Álamos Cancún" },
      {
        property: "og:description",
        content:
          "Uniformes, papelería y artículos oficiales del Colegio Álamos Cancún para toda la comunidad escolar.",
      },
    ],
  }),
  component: Index,
});

const categories = [
  {
    title: "Uniformes",
    copy: "Diario, deportivo y gala. Tallas verificadas por nivel escolar.",
    tag: "Oficial",
  },
  {
    title: "Papelería",
    copy: "Listas de útiles por grado, listas para comprar en un paso.",
  },
  {
    title: "Eventos",
    copy: "Boletos, aportaciones y artículos de temporada del colegio.",
    tag: "Premium",
  },
];

const steps = [
  { n: "01", t: "Verifica tu familia", d: "Acceso con el correo registrado en el colegio." },
  { n: "02", t: "Elige por grado", d: "Cada lista se arma según el nivel de tu hijo." },
  { n: "03", t: "Recoge en plantel", d: "Entrega organizada, sin filas ni confusiones." },
];

function Index() {
  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo variant="lockup" size={38} />
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a className="transition-colors hover:text-primary" href="#catalogo">
              Catálogo
            </a>
            <a className="transition-colors hover:text-primary" href="#como-funciona">
              Cómo funciona
            </a>
            <a className="transition-colors hover:text-primary" href="#comunidad">
              Comunidad
            </a>
          </nav>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-deep)]"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main>
        <section className="bg-background">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
            <Logo variant="full" size={190} className="mx-auto" />
            <div className="mx-auto mt-10 h-px w-24 rule-gold" />
            <p className="eyebrow mt-8">Tienda oficial · Colegio Álamos Cancún</p>
            <h1 className="mt-5 text-4xl leading-tight text-primary md:text-6xl">
              Todo lo que la escuela necesita, en un solo lugar
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Álamos Shop reúne uniformes, papelería y artículos oficiales del colegio en una
              experiencia clara, segura y pensada para las familias de la comunidad.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#catalogo"
                className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--primary-deep)] sm:w-auto"
              >
                Ver catálogo
              </a>
              <Link
                to="/auth"
                className="w-full rounded-md border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary sm:w-auto"
              >
                Acceso de familias
              </Link>
            </div>
          </div>
        </section>

        <section id="catalogo" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl text-primary md:text-3xl">Categorías</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Organizado como funciona el colegio, no como una tienda genérica.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {categories.map((c) => (
              <article key={c.title} className="surface-card p-7">
                <div className="flex items-start justify-between">
                  <Logo variant="emblem" size={30} />
                  {c.tag && (
                    <span className="rounded-full border border-gold/50 px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-gold-foreground">
                      {c.tag}
                    </span>
                  )}
                </div>
                <h3 className="mt-6 text-xl text-foreground">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-2xl text-primary md:text-3xl">Cómo funciona</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="border-t border-border pt-6">
                  <span className="font-display text-2xl text-gold">{s.n}</span>
                  <h3 className="mt-3 text-lg text-foreground">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="comunidad" className="mx-auto max-w-3xl px-6 py-24 text-center">
          <Logo variant="emblem" size={56} className="mx-auto" />
          <h2 className="mt-8 text-2xl text-primary md:text-3xl">
            Una comunidad escolar mejor organizada
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Cada compra queda registrada al nombre de la familia, con confirmaciones claras y
            entregas coordinadas directamente con el plantel.
          </p>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-14 text-center">
          <Logo variant="full" size={130} />
          <div className="h-px w-16 rule-gold" />
          <p className="text-xs text-muted-foreground">
            Álamos Shop · Colegio Álamos Cancún — Tienda oficial de la comunidad escolar
          </p>
        </div>
      </footer>
    </div>
  );
}
