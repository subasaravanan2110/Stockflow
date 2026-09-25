import Link from "next/link";
import { BarChart3, Boxes, LayoutDashboard, PackagePlus, Settings, ShoppingCart, Tags, Truck, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import type { Role } from "@/generated/prisma/client";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Boxes },
  { href: "/dashboard/inventory", label: "Stock movements", icon: PackagePlus },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
  { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar({ role }: { role: Role }) {
  return <aside className="hidden w-64 shrink-0 border-r bg-white lg:block"><div className="sticky top-0 flex h-screen flex-col p-5"><Logo href="/dashboard" /><nav aria-label="Main navigation" className="mt-8 space-y-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#5e6a62] hover:bg-[#eff5ef] hover:text-[#176b45]"><Icon className="size-4" />{label}</Link>)}</nav><div className="mt-auto space-y-1">{role === "ADMIN" && <Link href="/dashboard/users" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#5e6a62] hover:bg-[#eff5ef]"><Users className="size-4" />Team activity</Link>}<Link href="/dashboard/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#5e6a62] hover:bg-[#eff5ef]"><Settings className="size-4" />Settings</Link></div></div></aside>;
}
