"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, SendHorizontal, X } from "lucide-react";
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
      className="fixed inset-x-0 bottom-[68px] z-30 mx-auto max-w-[440px] border-t border-line bg-cream/95 px-3 pt-2 pb-2 backdrop-blur"
    >
      <input type="hidden" name="threadId" value={threadId} />
      {fileName && (
        <p className="mb-2 flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold">
          <ImagePlus className="size-4 text-rose-600" /> <span className="truncate">{fileName}</span>
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
      {state.error && <p className="mb-2 text-xs font-semibold text-danger">{state.error}</p>}
      <div className="flex items-center gap-2">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink-soft" aria-label="Add photo">
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
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 focus:border-rose-300 focus:ring-3 focus:ring-rose-100 focus:outline-none"
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
    <div className="pointer-events-none fixed inset-0 z-50 mx-auto flex max-w-[440px] items-start justify-center bg-ink/10 pt-[30vh]" aria-live="polite">
      <div className="mx-6 animate-pop-in rounded-2xl bg-white px-6 py-5 text-center shadow-raised">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-success-50 text-success">
          <Check className="size-5" strokeWidth={2.5} />
        </span>
        <p className="mt-3 text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </div>
    </div>
  );
}
