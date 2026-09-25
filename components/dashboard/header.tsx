import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDisplayRole } from "@/lib/auth/display-role";
import type { Role } from "@/generated/prisma/client";

export function DashboardHeader({ name, role, authProvider }: { name: string | null; role: Role; authProvider?: string }) {
  const displayRole = getDisplayRole(role, authProvider);
  return <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur"><div className="flex min-h-17 items-center gap-4 px-4 py-2 sm:px-7"><div className="lg:hidden"><Logo href="/dashboard" /></div><div className="ml-auto flex shrink-0 items-center gap-3"><div className="hidden text-right sm:block"><p className="whitespace-nowrap text-sm font-bold">{name ?? "StockFlow user"}</p><p className="text-xs text-[#68736c]">{displayRole}</p></div><ThemeToggle /><form action={logoutAction}><button className="grid size-10 place-items-center rounded-xl border bg-white" aria-label="Sign out"><LogOut className="size-4" /></button></form><button className="grid size-10 place-items-center rounded-xl border bg-white lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button></div></div><nav className="flex gap-2 overflow-x-auto border-t px-4 py-2 lg:hidden"><Link href="/dashboard" className="badge bg-[#eff5ef]">Overview</Link><Link href="/dashboard/products" className="badge bg-[#eff5ef]">Products</Link><Link href="/dashboard/inventory" className="badge bg-[#eff5ef]">Inventory</Link><Link href="/dashboard/suppliers" className="badge bg-[#eff5ef]">Suppliers</Link>{role === "ADMIN" && <Link href="/dashboard/users" className="badge bg-[#eff5ef]">Team activity</Link>}<Link href="/dashboard/settings" className="badge bg-[#eff5ef]">Settings</Link></nav></header>;
}
