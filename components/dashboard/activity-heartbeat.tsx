"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HEARTBEAT_INTERVAL_MS = 15_000;

export function ActivityHeartbeat() {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;

    async function heartbeat() {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/activity", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        });
        if (response.status === 401) router.replace("/login?reason=session-expired");
      } catch {
        // A temporary network failure should not interrupt the dashboard.
      }
    }

    void heartbeat();
    const interval = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void heartbeat();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
