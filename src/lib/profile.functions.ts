import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile, error: e1 }, { data: contacts, error: e2 }] =
      await Promise.all([
        context.supabase
          .from("profiles")
          .select("id, first_name, last_name, display_name, campus, level, bio, avatar_url")
          .eq("id", context.userId)
          .maybeSingle(),
        context.supabase
          .from("private_contacts")
          .select("instagram, whatsapp")
          .eq("user_id", context.userId)
          .maybeSingle(),
      ]);
    if (e1) throw e1;
    if (e2) throw e2;
    return { profile, contacts };
  });

const updateSchema = z.object({
  first_name: z.string().trim().min(1).max(40),
  last_name: z.string().trim().min(1).max(40),
  campus: z.enum(["Norte", "Sur"]),
  level: z.enum(["Secundaria", "Prepa"]),
  bio: z.string().trim().max(140).default(""),
  instagram: z.string().trim().max(40).default(""),
  whatsapp: z.string().trim().max(20).default(""),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => updateSchema.parse(data))
  .handler(async ({ context, data }) => {
    const display_name = `${data.first_name} ${data.last_name}`.trim().slice(0, 80);
    const { error: e1 } = await context.supabase
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        display_name,
        campus: data.campus,
        level: data.level,
        bio: data.bio,
      })
      .eq("id", context.userId);
    if (e1) throw e1;

    const { error: e2 } = await context.supabase
      .from("private_contacts")
      .upsert(
        { user_id: context.userId, instagram: data.instagram, whatsapp: data.whatsapp },
        { onConflict: "user_id" },
      );
    if (e2) throw e2;
    return { ok: true };
  });
