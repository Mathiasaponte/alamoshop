import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { InfoHero, Section, Accordion, Reveal } from "@/components/info/InfoParts";

export const Route = createFileRoute("/reglas")({
  head: () => ({
    meta: [
      { title: "Reglas de la comunidad — Álamos Shop" },
      { name: "description", content: "Siete reglas simples y lo que no se puede publicar en Álamos Shop." },
      { property: "og:title", content: "Las reglas son simples — Álamos Shop" },
      { property: "og:description", content: "Una comunidad segura entre estudiantes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reglas,
});

const RULES = ["Sé respetuoso.", "Vende cosas reales.", "Di la verdad sobre lo que vendes.", "Cumple tus acuerdos.", "No vendas cosas prohibidas.", "Protege tu información y la de los demás.", "Si algo se ve mal, repórtalo."];

const BANNED = [
  { t: "Sustancias", items: ["Drogas", "Alcohol", "Tabaco y nicotina", "Vapeadores", "Medicamentos restringidos"] },
  { t: "Objetos peligrosos", items: ["Armas", "Explosivos", "Artículos peligrosos"] },
  { t: "Contenido para adultos", items: ["Contenido sexual", "Apuestas"] },
  { t: "Productos no legítimos", items: ["Productos robados", "Falsificaciones o réplicas", "Documentos falsos"] },
  { t: "Datos y servicios", items: ["Datos personales de otras personas", "Servicios ilegales"] },
];

function Reglas() {
  return (
    <AppShell>
      <div className="bg-background">
        <InfoHero eyebrow="Reglas" title="Las reglas son simples." subtitle="Para que comprar y vender entre nosotros sea seguro y agradable." />
        <Section tone="soft">
          <ol className="space-y-6">
            {RULES.map((r, i) => (
              <Reveal key={r} delay={i * 60}>
                <li className="flex items-baseline gap-5">
                  <span className="w-10 shrink-0 font-display text-4xl font-semibold text-gold">{i + 1}</span>
                  <span className="text-xl text-foreground md:text-2xl">{r}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </Section>
        <Section eyebrow="Productos prohibidos" title="Lo que no se publica aquí.">
          <p className="mb-4 text-sm text-muted-foreground">Toca cada grupo para ver el detalle.</p>
          {BANNED.map((b) => (
            <Accordion key={b.t} title={b.t}>
              <ul>{b.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </Accordion>
          ))}
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">Las publicaciones que no cumplan pueden ser retiradas. Más detalle en los <Link to="/terminos" className="text-primary underline">Términos</Link>.</p>
        </Section>
      </div>
    </AppShell>
  );
}
