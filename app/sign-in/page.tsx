import { redirect } from "next/navigation";
import { CalendarHeart, Store } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, DemoNote } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { config, supabaseAuthEnabled } from "@/lib/config";
import { getViewer, homeFor } from "@/lib/auth/session";
import { demoSignIn, signInWithGoogle } from "@/app/actions/auth";
import { MagicLinkForm } from "./magic-link-form";

const ERRORS: Record<string, string> = {
  link: "That sign-in link is invalid or expired. Request a new one.",
  google: "Google sign-in failed. Try again or use email.",
  "google-unconfigured": "Google sign-in needs Supabase keys. Use email or a demo account for now.",
  "demo-missing": "Demo accounts aren't seeded. Run pnpm db:seed.",
};

export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer.role));
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col px-5 pt-6 pb-10">
      <Logo size={30} />
      <h1 className="mt-10 text-[34px] leading-tight font-extrabold">Hello! Let’s get you in.</h1>
      <p className="mt-2 text-sm text-ink-soft">New here? Signing in creates your account.</p>

      {typeof error === "string" && ERRORS[error] && (
        <p role="alert" className="mt-4 rounded-2xl border-2 border-sunset bg-sunset-50 px-4 py-3 text-sm font-semibold text-sunset">
          {ERRORS[error]}
        </p>
      )}

      <form action={signInWithGoogle} className="mt-8">
        <Button type="submit" variant="outline" size="lg" className="w-full" disabled={!supabaseAuthEnabled}>
          <GoogleG /> Continue with Google
        </Button>
        {!supabaseAuthEnabled && (
          <p className="mt-2 text-center text-xs text-muted">Google sign-in turns on when Supabase is configured.</p>
        )}
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-bold text-muted uppercase">
        <span className="h-0.5 flex-1 bg-ink/10" /> or email <span className="h-0.5 flex-1 bg-ink/10" />
      </div>

      <MagicLinkForm local={!supabaseAuthEnabled} />

      {config.demoMode && (
        <section id="demo" className="mt-10 rounded-3xl border-2 border-dashed border-ink/25 bg-white/70 p-4">
          <h2 className="text-lg font-extrabold">One-click demo</h2>
          <p className="mb-4 text-sm text-muted">Jump into a pre-filled account. Data resets anytime.</p>
          <div className="grid gap-3">
            <form action={demoSignIn}>
              <input type="hidden" name="who" value="planner" />
              <SubmitButton variant="mango" size="lg" className="h-auto w-full justify-start py-3 text-left">
                <CalendarHeart className="size-6 shrink-0" />
                <span>
                  <span className="block">Sign in as demo planner</span>
                  <span className="block text-xs font-medium">Bea · planning Sofia’s 18th debut</span>
                </span>
              </SubmitButton>
            </form>
            <form action={demoSignIn}>
              <input type="hidden" name="who" value="vendor" />
              <SubmitButton variant="outline" size="lg" className="h-auto w-full justify-start py-3 text-left">
                <Store className="size-6 shrink-0" />
                <span>
                  <span className="block">Sign in as demo vendor</span>
                  <span className="block text-xs font-medium text-muted">Inday · runs Lechon ni Inday</span>
                </span>
              </SubmitButton>
            </form>
          </div>
          <DemoNote className="mt-4">Demo mode: vendors auto-reply with a sample quote a few seconds after you ask.</DemoNote>
        </section>
      )}
    </main>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}
