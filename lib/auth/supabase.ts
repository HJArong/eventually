import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { config, supabaseAuthEnabled } from "@/lib/config";

/**
 * Supabase Auth (email magic link + Google). Only used when NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are set; after the OAuth/OTP callback the app issues its own
 * session cookie keyed on the Supabase user id (profiles.id = auth.users.id).
 */
export async function supabaseServer() {
  if (!supabaseAuthEnabled) throw new Error("Supabase is not configured");
  const store = await cookies();
  return createServerClient(config.supabaseUrl!, config.supabaseAnonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) store.set(name, value, options);
      },
    },
  });
}
