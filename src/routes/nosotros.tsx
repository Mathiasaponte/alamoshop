import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InfoHero, Section, SplitBar, Reveal } from "@/components/info/InfoParts";
import { TEAM } from "@/lib/legal";

export const Route = createFileRoute("/nosotros")({
  head: () => ({
    meta: [
      { title: "Nosotros — Álamos Shop" },
      { name: "description", content: "Qué es Álamos Shop, por qué existe, cómo se mantiene y cómo devuelve valor a la comunidad estudiantil." },
      { property: "og:title", content: "Un marketplace hecho para nuestra comunidad — Álamos Shop" },
      { property: "og:description", content: "Una plataforma independiente donde estudiantes compran, venden y aprenden haciendo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Nosotros,
});

const CONCEPTS = ["oferta", "demanda", "precio", "negociación", "presentación", "reputación", "servicio", "administración", "creación de valor", "emprendimiento"];
const PILLARS = [
  { t: "Estudiantes", d: "Crear oportunidades para comprar, vender, emprender y aprender." },
  { t: "Graduación", d: "Una parte de los ingresos publicitarios elegibles se reserva para apoyar los fondos de graduación." },
  { t: "Causas sociales", d: "Cuando una causa social llegue directamente a nuestra comunidad, Álamos Shop puede utilizar temporalmente parte de sus ingresos publicitarios para apoyarla." },
];
const SOURCES = [
  { t: "Comisiones", s: "Próximamente", d: "Una pequeña comisión sobre ventas completadas, cuando existan pagos dentro de la plataforma." },
  { t: "Promociones", s: "Próximamente", d: "Vendedores que quieran dar más visibilidad a una publicación. Hoy no se cobra." },
  { t: "Publicidad", s: "Próximamente", d: "Anuncios de negocios relevantes, siempre marcados como “Patrocinado”." },
];

function Nosotros() {
  return (
    <AppShell>
      <div className="bg-background">
        <InfoHero eyebrow="Nosotros" title="Un marketplace hecho para nuestra comunidad." subtitle="Álamos Shop conecta estudiantes que quieren comprar, vender y descubrir dentro de su propia comunidad." note="Una plataforma independiente." />

        <Section eyebrow="Qué es" title="Un marketplace entre estudiantes." tone="soft">
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-3 leading-relaxed">
              <p>No somos una tienda tradicional. No compramos inventario. Los productos pertenecen a sus vendedores.</p>
              <p>Álamos Shop crea la plataforma donde pueden publicar, descubrir, comprar, vender y coordinar operaciones.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              {["Vendedor", "Álamos Shop", "Comprador"].map((s, i) => (
                <Reveal key={s} delay={i * 150} className="flex w-full flex-col items-center gap-2">
                  {i > 0 && <ArrowDown className="h-4 w-4 text-gold" />}
                  <div className={`w-full max-w-[220px] rounded-lg border py-3 text-center text-xs font-medium uppercase tracking-[0.2em] ${i === 1 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{s}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Section eyebrow="Independencia" title="Independientes, pero hechos para la comunidad.">
          <div className="space-y-3 leading-relaxed">
            <p>Álamos Shop es una plataforma independiente.</p>
            <p>No somos una tienda oficial ni un canal administrativo de la institución salvo que exista una colaboración expresamente anunciada.</p>
            <p>Queremos construir algo positivo para la comunidad estudiantil.</p>
          </div>
        </Section>

        <Section eyebrow="Nuestra razón de existir" title="Aprender haciendo." tone="soft">
          <p className="font-display text-2xl leading-snug text-foreground md:text-3xl">“Vender algo parece sencillo hasta que tienes que decidir cuánto vale, encontrar a alguien que lo quiera, generar confianza y completar una operación.”</p>
          <p className="mt-6 leading-relaxed">Participar en un marketplace pone a los estudiantes en contacto real con principios sencillos de negocios:</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CONCEPTS.map((c) => <span key={c} className="rounded-full border border-border bg-background px-3 py-1 text-sm">{c}</span>)}
          </div>
          <p className="mt-6 font-medium text-primary">Álamos Shop convierte pequeñas operaciones en experiencias reales.</p>
        </Section>

        <Section eyebrow="Primero nuestra comunidad" title="Si crecemos, nuestra comunidad también debe crecer.">
          <div className="grid gap-8 md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal key={p.t} delay={i * 120}>
                <p className="font-display text-5xl font-semibold text-gold/70">0{i + 1}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{p.t}</p>
                <p className="mt-2 text-sm leading-relaxed">{p.d}</p>
              </Reveal>
            ))}
          </div>
        </Section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center md:px-6">
            <Reveal>
              <p className="font-display text-3xl leading-tight md:text-5xl">Si nuestra comunidad hace crecer Álamos Shop, Álamos Shop debe devolver valor a nuestra comunidad.</p>
              <div className="mx-auto mt-8 space-y-1 text-sm opacity-80">
                <p>Más oportunidades para estudiantes.</p>
                <p>Más apoyo para nuestras generaciones.</p>
                <p>Más alcance para causas que importan.</p>
              </div>
            </Reveal>
          </div>
        </section>

        <Section eyebrow="Sostenibilidad" title="¿Cómo se mantiene Álamos Shop?">
          <p className="leading-relaxed">Construir y mantener Álamos Shop tiene costos: infraestructura, desarrollo, almacenamiento, seguridad, moderación, soporte, diseño y crecimiento.</p>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {SOURCES.map((s) => (
              <div key={s.t} className="flex items-start justify-between gap-4 py-5">
                <div>
                  <p className="font-medium text-foreground">{s.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
                <span className="shrink-0 rounded-full border border-gold/50 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-gold-foreground">{s.s}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="Publicidad" title="Publicidad que también aporta." tone="soft">
          <p className="leading-relaxed">Los anuncios serán una fuente importante para mantener la plataforma. Por eso tienen reglas:</p>
          <ul className="mt-4 space-y-2 text-sm">
            {["Siempre marcados como “Patrocinado”.", "Relevantes para estudiantes.", "Nunca ocupan toda la experiencia.", "Pueden mostrarse por campus, sin GPS preciso.", "Los anunciantes no reciben bases de datos de estudiantes."].map((t) => (
              <li key={t} className="flex gap-3"><span className="text-primary">—</span>{t}</li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Los $10" title="Por cada $10 de publicidad">
          <SplitBar total={10} parts={[{ label: "Fondo de Graduación", amount: 4.5, tone: "gold" }, { label: "Álamos Shop", amount: 5.5, tone: "primary" }]} />
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">Los $5.50 que permanecen en Álamos Shop ayudan a financiar operación, desarrollo, infraestructura, moderación y crecimiento.</p>
        </Section>

        <Section eyebrow="Fondo de Graduación" title="Crecer juntos también significa graduarnos juntos." tone="soft">
          <p className="leading-relaxed">El 45% de los ingresos publicitarios elegibles se destina al Fondo de Graduación.</p>
          <div className="surface-card mt-6 p-6">
            <p className="eyebrow">Ejemplo: una campaña genera $1,000</p>
            <div className="mt-4 flex items-baseline justify-between border-b border-border pb-3"><span className="text-sm">Fondo de Graduación</span><span className="font-display text-3xl font-semibold text-gold-foreground">$450</span></div>
            <div className="mt-3 flex items-baseline justify-between"><span className="text-sm">Álamos Shop</span><span className="font-display text-3xl font-semibold text-primary">$550</span></div>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Estos fondos se contabilizan por separado de los ingresos operativos. Hoy el fondo está en <strong className="text-foreground">$0</strong>: todavía no hay publicidad activa. Puedes verlo en <Link to="/transparencia" className="text-primary underline">Transparencia</Link>.</p>
        </Section>

        <Section eyebrow="Campañas sociales" title="Cuando la comunidad se une por una causa.">
          <p className="leading-relaxed">Solo aplican cuando una iniciativa ha llegado directamente a la comunidad de Álamos o tiene contexto previo en ella. Ningún usuario puede crear campañas; en el futuro solo las activará el equipo administrador.</p>
          <p className="mt-8 eyebrow">Durante una campaña social, por cada $10</p>
          <div className="mt-4">
            <SplitBar total={10} parts={[{ label: "Graduación", amount: 4.5, tone: "gold" }, { label: "Causa social", amount: 2, tone: "muted" }, { label: "Álamos Shop", amount: 3.5, tone: "primary" }]} />
          </div>
          <div className="mt-10 border-l-2 border-gold pl-5">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold-foreground">Ejemplo ilustrativo</p>
            <p className="mt-2 leading-relaxed">En años recientes, iniciativas como Brincando por Ti, de Fundación Aitana, han acercado causas sociales a la comunidad.</p>
            <p className="mt-2 leading-relaxed">Son este tipo de iniciativas las que Álamos Shop busca poder apoyar cuando exista una campaña confirmada.</p>
            <p className="mt-3 text-xs text-muted-foreground">No existe actualmente una alianza, colaboración ni donación con esta iniciativa.</p>
          </div>
        </Section>

        <Section eyebrow="Equilibrio" title="Ayudar también requiere ser sostenibles." tone="soft">
          <p className="leading-relaxed">No creemos que generar ingresos y ayudar a nuestra comunidad sean ideas opuestas. Queremos construir un sistema donde ambas puedan crecer juntas.</p>
        </Section>

        {TEAM.length > 0 && (
          <Section eyebrow="Nosotros" title="Quiénes somos">
            <div className="grid gap-6 sm:grid-cols-2">
              {TEAM.map((m) => (
                <div key={m.name} className="surface-card flex gap-4 p-5">
                  {m.photo && <img src={m.photo} alt={m.name} className="h-16 w-16 rounded-full object-cover" />}
                  <div><p className="font-medium text-foreground">{m.name}</p><p className="text-xs uppercase tracking-[0.14em] text-gold-foreground">{m.role}</p><p className="mt-2 text-sm">{m.bio}</p></div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section>
          <p className="text-sm text-muted-foreground">PEAK desarrolla y opera la tecnología detrás de Álamos Shop.</p>
        </Section>
      </div>
    </AppShell>
  );
}
