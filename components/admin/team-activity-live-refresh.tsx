"use client";

import { useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radio, RefreshCw } from "lucide-react";

const REFRESH_INTERVAL_MS = 5_000;

export function TeamActivityLiveRefresh() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refreshWhenVisible, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);

  return <button type="button" onClick={refresh} className="btn btn-secondary" disabled={isRefreshing}>
    {isRefreshing ? <RefreshCw className="size-4 animate-spin" /> : <Radio className="size-4 text-green-700" />}
    Live · {isRefreshing ? "Updating" : "Refresh"}
  </button>;
}
