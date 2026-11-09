import { redirect } from "next/navigation";
import { CalendarHeart, Store } from "lucide-react";
import { Logo } from "@/components/logo";
import { Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { homeFor, requireViewer } from "@/lib/auth/session";
import { chooseRole } from "@/app/actions/auth";

export default async function ChooseRole() {
  const viewer = await requireViewer();
  if (viewer.role) redirect(homeFor(viewer.role));

  return (
    <main className="flex min-h-dvh flex-col px-5 pt-6 pb-10">
      <Logo size={30} />
      <h1 className="mt-10 text-[34px] leading-tight font-semibold">Welcome! What brings you here?</h1>
      <form action={chooseRole} className="mt-8 grid gap-4">
        <div>
          <Label htmlFor="displayName">Your first name</Label>
          <Input id="displayName" name="displayName" defaultValue={viewer.displayName} placeholder="e.g. Hazel" required />
        </div>
        <fieldset className="grid gap-3">
          <legend className="sr-only">Choose your role</legend>
          {[
            { value: "planner", title: "I'm planning", body: "A debut, wedding, binyag, party or fiesta.", icon: CalendarHeart, tone: "bg-rose-50 text-rose-600" },
            { value: "vendor", title: "I'm a vendor", body: "Get qualified inquiries and send quotes fast.", icon: Store, tone: "bg-sand text-ink-soft" },
          ].map((r, i) => (
            <label key={r.value} className="cursor-pointer">
              <input type="radio" name="role" value={r.value} defaultChecked={i === 0} className="peer sr-only" />
              <span className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition peer-checked:border-rose-300 peer-checked:ring-3 peer-checked:ring-rose-100">
                <span className={`flex size-14 shrink-0 items-center justify-center rounded-xl border border-line ${r.tone}`}>
                  <r.icon className="size-7" />
                </span>
                <span>
                  <span className="block font-display text-xl font-semibold">{r.title}</span>
                  <span className="block text-sm text-muted">{r.body}</span>
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <SubmitButton size="lg" className="mt-4">
          Continue
        </SubmitButton>
      </form>
    </main>
  );
}
