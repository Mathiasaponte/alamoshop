import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { InfoHero, Section, Reveal } from "@/components/info/InfoParts";
import { CAMPAIGNS, METRICS } from "@/lib/legal";
import { formatPrice } from "@/lib/data";

export const Route = createFileRoute("/transparencia")({
  head: () => ({
    meta: [
      { title: "Transparencia — Álamos Shop" },
      { name: "description", content: "Fondo de graduación, aportaciones a causas y actividad real de Álamos Shop, sin números inventados." },
      { property: "og:title", content: "Transparencia — Álamos Shop" },
      { property: "og:description", content: "Lo que genere Álamos Shop debe poder explicarse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Transparencia,
});

function Transparencia() {
  const cards = [
    { l: "Fondo de Graduación", v: formatPrice(METRICS.graduationFund) },
    { l: "Aportado a causas", v: formatPrice(METRICS.causes) },
    { l: "Operaciones completadas", v: String(METRICS.completedOrders) },
    { l: "Usuarios participantes", v: String(METRICS.participants) },
  ];
  return (
    <AppShell>
      <div className="bg-background">
        <InfoHero eyebrow="Cuentas claras" title="Transparencia" subtitle="Lo que genere Álamos Shop debe poder explicarse." />
        <Section tone="soft" eyebrow="Día uno" title="Apenas estamos empezando.">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
            {cards.map((c, i) => (
              <Reveal key={c.l} delay={i * 100} className="bg-background p-5 md:p-8">
                <p className="font-display text-3xl font-semibold text-primary/80 sm:text-4xl md:text-5xl">{c.v}</p>
                <p className="mt-2 text-[0.68rem] uppercase leading-snug tracking-[0.12em] text-muted-foreground">{c.l}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /><p>Estos números se actualizarán con datos reales. Todavía no hay ingresos publicitarios ni operaciones registradas en línea, y nunca mostraremos cifras inventadas.</p></div>
        </Section>
        <Section eyebrow="Campañas" title="Campañas sociales">
          {CAMPAIGNS.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
              <p className="font-display text-2xl text-primary">Aún no hay campañas.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Cuando se confirme una causa, aquí verás su objetivo, fechas, porcentaje, monto generado y si los fondos ya se entregaron.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {CAMPAIGNS.map((c) => (
                <div key={c.name} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-medium text-foreground">{c.name}</p><p className="text-sm text-muted-foreground">{c.org}</p></div>
                    <span className="rounded-full border border-gold/50 px-2.5 py-0.5 text-xs text-gold-foreground">{c.status}</span>
                  </div>
                  <p className="mt-3 text-sm">{c.goal}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Periodo</dt><dd>{c.start} – {c.end}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Porcentaje</dt><dd>{c.percent}%</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Generado</dt><dd className="font-semibold text-primary">{formatPrice(c.raised)}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
