import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { InfoHero, Section, Accordion, Toc } from "@/components/info/InfoParts";
import { LEGAL_UPDATED, TERMS_VERSION } from "@/lib/legal";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones — Álamos Shop" },
      { name: "description", content: "Términos claros y entendibles para usar Álamos Shop, el marketplace entre estudiantes." },
      { property: "og:title", content: "Términos y Condiciones — Álamos Shop" },
      { property: "og:description", content: "Cómo funciona Álamos Shop y qué esperamos de cada usuario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terminos,
});

const S: { id: string; t: string; c: ReactNode }[] = [
  { id: "naturaleza", t: "Naturaleza de Álamos Shop", c: <><p>Álamos Shop es un marketplace que permite a usuarios publicar, descubrir, comprar y vender productos o servicios entre ellos.</p><p className="mt-2">Álamos Shop no es propietario de los productos publicados. Cada vendedor es responsable de describir correctamente sus productos. Álamos Shop funciona como plataforma de conexión, descubrimiento y moderación.</p><p className="mt-2">Es una plataforma independiente, no un canal oficial de ninguna institución.</p></> },
  { id: "usuarios", t: "Usuarios", c: <p>Está pensado para la comunidad estudiantil. Debes usar información real sobre ti y eres responsable de lo que hagas con tu cuenta. Si eres menor de edad, te recomendamos que tu madre, padre o tutor sepa que usas la plataforma, sobre todo en operaciones de mayor valor.</p> },
  { id: "publicaciones", t: "Publicaciones", c: <ul><li>Usa fotos e información reales.</li><li>Muestra el precio verdadero.</li><li>Informa defectos relevantes.</li><li>No publiques productos inexistentes.</li></ul> },
  { id: "compras", t: "Compras y ventas", c: <><p>El acuerdo es entre comprador y vendedor. Se espera que ambos cumplan lo pactado.</p><ul className="mt-2"><li>No se permite cambiar el precio después de aceptar una solicitud.</li><li>No se permiten comprobantes falsos ni fraude de ningún tipo.</li></ul></> },
  { id: "conducta", t: "Conducta", c: <><p>No se permite:</p><ul><li>Acoso, amenazas o intimidación</li><li>Discriminación</li><li>Spam</li><li>Suplantación de identidad</li><li>Fraude</li><li>Publicar datos de otras personas</li></ul></> },
  { id: "prohibidos", t: "Productos prohibidos", c: <p>Drogas, alcohol, tabaco, nicotina, vapeadores, medicamentos restringidos, armas, explosivos, contenido sexual, productos robados, falsificaciones, documentos falsos, apuestas, datos personales, servicios ilegales y artículos peligrosos. Consulta las Reglas para más detalle.</p> },
  { id: "pagos", t: "Pagos futuros", c: <p>Hoy Álamos Shop no procesa pagos. Si en el futuro se habilitan, se informará antes cómo funcionan y se actualizarán estos términos.</p> },
  { id: "comisiones", t: "Comisiones", c: <p>Actualmente no se cobra ninguna comisión. Si se introduce una, se anunciará con anticipación y solo aplicará a operaciones posteriores.</p> },
  { id: "entregas", t: "Entregas", c: <p>Las entregas se coordinan entre usuarios en puntos acordados. Recomendamos lugares seguros y concurridos. Álamos Shop no transporta ni resguarda productos.</p> },
  { id: "resenas", t: "Reseñas", c: <p>Las reseñas deben ser honestas y basadas en una operación real. No se permiten reseñas falsas, ofensivas o a cambio de algo.</p> },
  { id: "moderacion", t: "Moderación", c: <p>Podemos revisar, ocultar o retirar publicaciones, reseñas o perfiles que incumplan estas reglas, y atender reportes de la comunidad.</p> },
  { id: "privacidad", t: "Privacidad", c: <p>El tratamiento de tu información se explica en el Aviso de Privacidad.</p> },
  { id: "publicidad", t: "Publicidad", c: <p>Los anuncios se marcan como “Patrocinado”, deben ser apropiados para estudiantes y los anunciantes no reciben bases de datos de usuarios.</p> },
  { id: "propiedad", t: "Propiedad intelectual", c: <p>Solo publica fotos y textos que te pertenezcan o que tengas permiso de usar. La marca y el diseño de Álamos Shop no pueden usarse sin autorización.</p> },
  { id: "suspension", t: "Suspensión", c: <p>Podemos suspender cuentas que incumplan de forma grave o repetida estos términos.</p> },
  { id: "cambios", t: "Cambios", c: <p>Podemos actualizar estos términos. Cuando cambie la versión, te pediremos aceptarla de nuevo.</p> },
  { id: "contacto", t: "Contacto", c: <p>Pronto habilitaremos un canal de contacto oficial. Mientras tanto, puedes usar la opción “Reportar” dentro de la app.</p> },
];

function Terminos() {
  return (
    <AppShell>
      <div className="bg-background">
        <InfoHero eyebrow={`Versión ${TERMS_VERSION} · Última actualización: ${LEGAL_UPDATED}`} title="Términos y Condiciones" subtitle="En lenguaje claro. Toca cada sección para leerla." />
        <Section tone="soft" eyebrow="Índice"><Toc items={S.map((s) => ({ id: s.id, label: s.t }))} /></Section>
        <Section>{S.map((s, i) => <Accordion key={s.id} id={s.id} title={`${i + 1}. ${s.t}`} defaultOpen={i === 0}>{s.c}</Accordion>)}</Section>
      </div>
    </AppShell>
  );
}
