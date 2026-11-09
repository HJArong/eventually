"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Polls the server by re-rendering the current route. Stands in for Supabase Realtime locally;
 * each refresh also runs the maintenance tick (auto-responder, quote expiry).
 */
export function LiveRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
