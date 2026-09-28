import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import type { Campus, Level } from "@/lib/data";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Álamos Shop" },
      { name: "description", content: "Crea tu cuenta o entra a Álamos Shop, el marketplace de estudiantes." },
      { property: "og:title", content: "Entrar — Álamos Shop" },
      { property: "og:description", content: "Crea tu cuenta o entra a Álamos Shop." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { prefs, hydrated } = useStore();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [campus, setCampus] = useState<Campus>("Norte");
  const [level, setLevel] = useState<Level>("Prepa");

  // Prefill desde el onboarding local
  useEffect(() => {
    if (!hydrated) return;
    if (prefs.campus) setCampus(prefs.campus);
    if (prefs.level) setLevel(prefs.level);
  }, [hydrated, prefs.campus, prefs.level]);

  // Si ya hay sesión, salir de aquí
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate({ to: "/marketplace", replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/marketplace", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const valid =
    email.includes("@") &&
    password.length >= 6 &&
    (mode === "login" || (nombre.trim() && apellido.trim()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Bienvenido de vuelta");
        navigate({ to: "/marketplace", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              first_name: nombre.trim().slice(0, 40),
              last_name: apellido.trim().slice(0, 40),
              campus,
              level,
            },
          },
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-secondary px-4 py-10">
      <Logo variant="lockup" size={44} />
      <div className="mt-8 w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-sm">
        {sent ? (
          <div className="text-center">
            <MailCheck className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-2xl text-primary">Revisa tu correo</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Te enviamos un enlace de confirmación a <span className="font-medium text-foreground">{email}</span>.
              Ábrelo para activar tu cuenta.
            </p>
            <button
              onClick={() => { setSent(false); setMode("login"); }}
              className="mt-6 w-full rounded-full border border-border py-3 text-sm hover:border-primary hover:text-primary"
            >
              Ya la confirmé, entrar
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 rounded-full bg-accent p-1 text-sm">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full py-2 transition-colors ${mode === m ? "bg-background font-medium text-primary shadow-sm" : "text-muted-foreground"}`}
                >
                  {m === "login" ? "Entrar" : "Crear cuenta"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre">
                      <input className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} autoComplete="given-name" />
                    </Field>
                    <Field label="Apellido">
                      <input className="field" value={apellido} onChange={(e) => setApellido(e.target.value)} maxLength={40} autoComplete="family-name" />
                    </Field>
                    <Field label="Campus">
                      <select className="field" value={campus} onChange={(e) => setCampus(e.target.value as Campus)}>
                        <option>Norte</option>
                        <option>Sur</option>
                      </select>
                    </Field>
                    <Field label="Nivel">
                      <select className="field" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                        <option>Secundaria</option>
                        <option>Prepa</option>
                      </select>
                    </Field>
                  </div>
                </>
              )}
              <Field label="Correo">
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tucorreo@ejemplo.com" />
              </Field>
              <Field label="Contraseña">
                <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Mínimo 6 caracteres" />
              </Field>
              <button
                disabled={!valid || busy}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                {busy ? "Un momento…" : mode === "login" ? "Entrar" : "Crear mi cuenta"}
              </button>
            </form>
          </>
        )}
      </div>
      <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground">
        Álamos Shop es una plataforma independiente creada para la comunidad estudiantil.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
