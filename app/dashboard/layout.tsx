import { requireUser } from "@/lib/auth/dal";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DemoSessionExpiry } from "@/components/auth/demo-session-expiry";
import { FloatingAssistant } from "@/components/assistant/floating-assistant";
import { ActivityHeartbeat } from "@/components/dashboard/activity-heartbeat";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <div className="flex min-h-screen"><Sidebar role={user.role} /><div className="min-w-0 flex-1"><DashboardHeader name={user.name} role={user.role} authProvider={user.authProvider} /><main className="p-4 sm:p-7">{children}</main></div><FloatingAssistant /><ActivityHeartbeat /><DemoSessionExpiry expiresAt={user.demoExpiresAt} /></div>;
}
