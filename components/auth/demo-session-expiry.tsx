"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

export function DemoSessionExpiry({ expiresAt }: { expiresAt?: number }) {
  const [seconds, setSeconds] = useState(() => expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1_000);
    const timeout = window.setTimeout(() => {
      toast.error("Demonstration session expired after one minute. Please sign in again; later sessions will not use the one-minute limit.", { duration: 4_000 });
      window.setTimeout(() => void signOut({ redirectTo: "/login?reason=demo-session-expired" }), 1_200);
    }, Math.max(0, expiresAt - Date.now()));
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [expiresAt]);

  if (!expiresAt || seconds <= 0) return null;
  return <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-950 shadow-lg" role="status">
    <Clock3 className="size-4" />One-time demo session: {seconds}s
  </div>;
}
