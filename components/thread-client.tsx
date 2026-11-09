"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, SendHorizontal, X } from "lucide-react";
import { sendMessageAction, type MessageState } from "@/app/actions/messages";
import { SubmitButton } from "./submit-button";

export function Composer({ threadId }: { threadId: string }) {
  const [state, action] = useActionState<MessageState, FormData>(sendMessageAction, {});
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [prevSentAt, setPrevSentAt] = useState(state.sentAt);
  if (state.sentAt !== prevSentAt) {
    setPrevSentAt(state.sentAt);
    setFileName(null);
  }

  return (
    <form
      action={action}
      className="fixed inset-x-0 bottom-[68px] z-30 mx-auto max-w-[440px] border-t-2 border-ink/10 bg-cream/95 px-3 pt-2 pb-2 backdrop-blur"
    >
      <input type="hidden" name="threadId" value={threadId} />
      {fileName && (
        <p className="mb-2 flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold">
          <ImagePlus className="size-4 text-ube" /> <span className="truncate">{fileName}</span>
          <button
            type="button"
            className="ml-auto"
            aria-label="Remove photo"
            onClick={() => {
              if (fileRef.current) fileRef.current.value = "";
              setFileName(null);
            }}
          >
            <X className="size-4" />
          </button>
        </p>
      )}
      {state.error && <p className="mb-2 text-xs font-semibold text-sunset">{state.error}</p>}
      <div className="flex items-center gap-2">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-white" aria-label="Add photo">
          <ImagePlus className="size-5" />
          <input
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <label htmlFor="message-body" className="sr-only">
          Message
        </label>
        <input
          id="message-body"
          name="body"
          autoComplete="off"
          placeholder="Message…"
          className="h-11 min-w-0 flex-1 rounded-full border-2 border-ink/20 bg-white px-4 focus:border-ink focus:outline-none"
        />
        <SubmitButton size="md" className="size-11 shrink-0 px-0" aria-label="Send">
          <SendHorizontal className="size-5" />
        </SubmitButton>
      </div>
    </form>
  );
}

export function ScrollToBottom({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: count > 0 ? "smooth" : "auto", block: "end" });
  }, [count]);
  return <div ref={ref} />;
}

const CONFETTI_COLORS = ["#ffc23d", "#ff6b4a", "#6b3fd4", "#5fae2e", "#2f8fff"];

export function Celebrate({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("booked");
    window.history.replaceState(null, "", url);
    const id = window.setTimeout(() => setOpen(false), 3800);
    return () => window.clearTimeout(id);
  }, []);
  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 mx-auto max-w-[440px] overflow-hidden" aria-live="polite">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="absolute top-[-20px] block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animation: `confetti-fall ${1.6 + (i % 5) * 0.35}s ${(i % 7) * 0.08}s ease-in forwards`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
      <div className="absolute inset-x-6 top-1/3 animate-pop-in rounded-3xl border-2 border-ink bg-white p-5 text-center shadow-pop-lg">
        <p className="font-display text-2xl font-extrabold">{title}</p>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </div>
      <style>{`@keyframes confetti-fall { to { transform: translateY(105vh) rotate(720deg); } }`}</style>
    </div>
  );
}
