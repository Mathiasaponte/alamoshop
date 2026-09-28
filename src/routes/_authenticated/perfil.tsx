import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Avatar, PageTitle } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import type { Campus, Level } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — Álamos Shop" },
      { name: "description", content: "Tu perfil de estudiante en Álamos Shop." },
      { property: "og:title", content: "Mi perfil — Álamos Shop" },
      { property: "og:description", content: "Tu perfil de estudiante en Álamos Shop." },
    ],
  }),
  component: Perfil,
});

type Form = {
  first_name: string;
  last_name: string;
  campus: Campus;
  level: Level;
  bio: string;
  instagram: string;
  whatsapp: string;
};

const EMPTY: Form = { first_name: "", last_name: "", campus: "Norte", level: "Prepa", bio: "", instagram: "", whatsapp: "" };

function Perfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const p = data.profile;
    setF({
      first_name: p?.first_name ?? "",
      last_name: p?.last_name ?? "",
      campus: (p?.campus as Campus) ?? "Norte",
      level: (p?.level as Level) ?? "Prepa",
      bio: p?.bio ?? "",
      instagram: data.contacts?.instagram ?? "",
      whatsapp: data.contacts?.whatsapp ?? "",
    });
  }, [data]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const valid = f.first_name.trim() && f.last_name.trim();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await updateMyProfile({ data: { ...f, first_name: f.first_name.trim(), last_name: f.last_name.trim() } });
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Perfil guardado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-8">
        <PageTitle title="Mi perfil" subtitle="De estudiantes. Para estudiantes." />
        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-4">
              <Avatar initials={`${f.first_name[0] ?? "?"}${f.last_name[0] ?? ""}`.toUpperCase()} size={64} />
              <Link to="/u/$id" params={{ id: "me" }} className="text-sm text-primary underline-offset-4 hover:underline">Ver mi perfil público →</Link>
            </div>
            <form className="mt-6 space-y-4" onSubmit={save}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre"><input className="field" value={f.first_name} onChange={(e) => set("first_name", e.target.value)} maxLength={40} /></Field>
                <Field label="Apellido"><input className="field" value={f.last_name} onChange={(e) => set("last_name", e.target.value)} maxLength={40} /></Field>
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
              <button disabled={!valid || busy} className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
                {busy ? "Guardando…" : "Guardar perfil"}
              </button>
            </form>
            <div className="mt-8 flex items-center justify-between text-sm">
              <Link to="/tienda" className="text-primary">Mi tienda</Link>
              <button onClick={signOut} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </>
        )}
        <p className="mt-8 text-center text-xs text-muted-foreground">Álamos Shop es una plataforma independiente creada para la comunidad estudiantil.</p>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="eyebrow">{label}</span><div className="mt-1.5">{children}</div></label>);
}
