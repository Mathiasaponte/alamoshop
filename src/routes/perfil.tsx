import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Avatar, PageTitle } from "@/components/AppShell";
import type { Campus, Level } from "@/lib/data";
import { useStore, type Profile } from "@/lib/store";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — Álamos Shop" },
      { name: "description", content: "Crea tu perfil de estudiante para comprar y vender en Álamos Shop." },
      { property: "og:title", content: "Mi perfil — Álamos Shop" },
      { property: "og:description", content: "Tu perfil de estudiante en Álamos Shop." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { profile, setProfile, prefs, hydrated, reset } = useStore();
  const navigate = useNavigate();
  const [f, setF] = useState<Profile>({ nombre: "", apellido: "", campus: "Norte", level: "Prepa", instagram: "", whatsapp: "", bio: "" });

  useEffect(() => {
    if (!hydrated) return;
    setF(profile ?? { nombre: "", apellido: "", campus: prefs.campus ?? "Norte", level: prefs.level ?? "Prepa", instagram: "", whatsapp: "", bio: "" });
  }, [hydrated, profile, prefs.campus, prefs.level]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setF((x) => ({ ...x, [k]: v }));
  const valid = f.nombre.trim() && f.apellido.trim();

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-8">
        <PageTitle title={profile ? "Mi perfil" : "Crea tu perfil"} subtitle="De estudiantes. Para estudiantes." />
        <div className="mt-6 flex items-center gap-4">
          <Avatar initials={`${f.nombre[0] ?? "?"}${f.apellido[0] ?? ""}`.toUpperCase()} size={64} />
          {profile && <Link to="/u/$id" params={{ id: "me" }} className="text-sm text-primary underline-offset-4 hover:underline">Ver mi perfil público →</Link>}
        </div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            setProfile({ ...f, nombre: f.nombre.trim(), apellido: f.apellido.trim() });
            toast.success("Perfil guardado");
            if (!profile) navigate({ to: "/vender" });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre"><input className="field" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={40} /></Field>
            <Field label="Apellido"><input className="field" value={f.apellido} onChange={(e) => set("apellido", e.target.value)} maxLength={40} /></Field>
            <Field label="Campus"><select className="field" value={f.campus} onChange={(e) => set("campus", e.target.value as Campus)}><option>Norte</option><option>Sur</option></select></Field>
            <Field label="Nivel"><select className="field" value={f.level} onChange={(e) => set("level", e.target.value as Level)}><option>Secundaria</option><option>Prepa</option></select></Field>
          </div>
          <Field label="Descripción corta (opcional)"><textarea className="field" rows={2} maxLength={140} value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Vendo sneakers y cosas que ya no uso." /></Field>
          <div className="rounded-xl bg-accent p-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5 text-primary" /> Privado: solo se comparte con quien tenga una orden aceptada contigo.</p>
            <div className="mt-3 grid gap-3">
              <Field label="Instagram"><input className="field" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@usuario" maxLength={40} /></Field>
              <Field label="WhatsApp"><input className="field" inputMode="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="998 000 0000" maxLength={20} /></Field>
            </div>
          </div>
          <button disabled={!valid} className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-40">Guardar perfil</button>
        </form>
        <div className="mt-8 flex justify-between text-sm">
          <Link to="/tienda" className="text-primary">Mi tienda</Link>
          <button onClick={() => { reset(); navigate({ to: "/" }); }} className="text-muted-foreground hover:text-destructive">Reiniciar demo</button>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">Álamos Shop es una plataforma independiente creada para la comunidad estudiantil.</p>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="eyebrow">{label}</span><div className="mt-1.5">{children}</div></label>);
}
