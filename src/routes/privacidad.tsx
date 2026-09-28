import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { InfoHero, Section, Accordion } from "@/components/info/InfoParts";
import { CONTACT_EMAIL, LEGAL_UPDATED, PRIVACY_VERSION } from "@/lib/legal";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Aviso de Privacidad — Álamos Shop" },
      { name: "description", content: "Qué información usa Álamos Shop, qué nunca se muestra públicamente y cómo funciona la publicidad sin compartir tus datos." },
      { property: "og:title", content: "Aviso de Privacidad — Álamos Shop" },
      { property: "og:description", content: "Tu información, explicada de forma sencilla." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidad,
});

const DATA = ["Nombre y apellido", "Campus y nivel", "Foto de perfil", "Productos publicados", "Favoritos", "Órdenes", "Reseñas", "Reportes", "Datos técnicos básicos"];

function Privacidad() {
  return (
    <AppShell>
      <div className="bg-background">
        <InfoHero eyebrow={`Versión ${PRIVACY_VERSION} · Última actualización: ${LEGAL_UPDATED}`} title="Aviso de Privacidad" subtitle="Qué información existe en Álamos Shop y cómo la cuidamos." />
        <Section eyebrow="Qué información puede existir" tone="soft">
          <div className="flex flex-wrap gap-2">{DATA.map((d) => <span key={d} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm">{d}</span>)}</div>
          <p className="mt-6 leading-relaxed">WhatsApp, teléfono y domicilio <strong className="text-primary">no se muestran públicamente por defecto</strong>.</p>
          <p className="mt-3 text-sm text-muted-foreground">Hoy, mientras no existan cuentas en línea, tu información se guarda solo en este dispositivo.</p>
        </Section>
        <Section>
          <Accordion title="Para qué se usa" defaultOpen><ul><li>Mostrar tus publicaciones y tu perfil.</li><li>Coordinar compras y ventas.</li><li>Mantener la comunidad segura (reportes y moderación).</li><li>Mejorar la plataforma.</li></ul></Accordion>
          <Accordion title="Publicidad y privacidad"><ul><li>Los anunciantes no reciben bases de datos de estudiantes.</li><li>La publicidad puede personalizarse por campus seleccionado y contexto general de uso.</li><li>No necesitamos GPS preciso para mostrar anuncios por campus.</li></ul></Accordion>
          <Accordion title="Menores de edad"><p>Nuestra comunidad puede incluir menores. Por eso no se permite contenido adulto, alcohol, nicotina, apuestas ni productos ilegales, y la publicidad debe ser apropiada para estudiantes.</p><p className="mt-2">Para operaciones de mayor valor recomendamos contar con el apoyo o conocimiento de madre, padre o tutor.</p></Accordion>
          <Accordion title="Tus opciones"><p>Puedes editar tu perfil, borrar tus publicaciones o pedirnos eliminar tu información escribiendo a <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.</p></Accordion>
          <Accordion title="Cambios a este aviso"><p>Si el aviso cambia, actualizaremos la versión y te pediremos revisarlo de nuevo.</p></Accordion>
        </Section>
      </div>
    </AppShell>
  );
}
