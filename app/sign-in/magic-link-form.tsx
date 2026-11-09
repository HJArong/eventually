"use client";

import { useActionState } from "react";
import { Mail, MailCheck } from "lucide-react";
import { Input, LinkButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { requestMagicLink, type MagicLinkState } from "@/app/actions/auth";

export function MagicLinkForm({ local }: { local: boolean }) {
  const [state, action] = useActionState<MagicLinkState, FormData>(requestMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="animate-pop-in rounded-3xl border-2 border-ink bg-calamansi-50 p-4">
        <p className="flex items-center gap-2 font-bold">
          <MailCheck className="size-5 text-calamansi" /> {state.message}
        </p>
        {state.devLink ? (
          <>
            <p className="mt-1 text-sm text-muted">
              Local mode has no email provider, so here’s your link (also printed in the server log).
            </p>
            <LinkButton href={state.devLink} prefetch={false} variant="primary" className="mt-3 w-full">
              Open magic link
            </LinkButton>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">Open it on this device to finish signing in.</p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3">
      <label htmlFor="email" className="sr-only">
        Email
      </label>
      <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@email.com" />
      {state.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-sunset">
          {state.message}
        </p>
      )}
      <SubmitButton size="lg" pendingText="Sending…">
        <Mail className="size-5" /> Email me a magic link
      </SubmitButton>
      {local && <p className="text-center text-xs text-muted">Local mode: the link appears right here.</p>}
    </form>
  );
}
