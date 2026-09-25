import Link from "next/link";
import { BarChart3, Check, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  { icon: PackageCheck, title: "Reliable stock ledger", text: "Every movement is recorded, attributable, and protected against negative stock." },
  { icon: BarChart3, title: "Actionable signals", text: "See low stock, inventory value, movement trends, and reorder priorities at a glance." },
  { icon: ShieldCheck, title: "Secure by design", text: "Organization isolation, granular roles, verified identities, and immutable audit history." },
];

export default function HomePage() {
  return (
    <main>
      <header className="border-b bg-white/90">
        <div className="container-shell flex h-18 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2"><ThemeToggle /><Link href="/login" className="btn btn-secondary">Sign in</Link></div>
        </div>
      </header>
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_70%_10%,#dfff7a66,transparent_38%),radial-gradient(circle_at_25%_25%,#82d9aa55,transparent_35%)]" />
        <div className="container-shell grid items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="eyebrow mb-5">Inventory without guesswork</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.03] tracking-[-.045em] sm:text-7xl">Know what you have. Know what comes next.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5d6861]">StockFlow helps small teams protect stock accuracy, understand movement, and reorder before shelves run empty.</p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#526057]">{["No credit card", "Role-based access", "Audit-ready"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="size-4 text-[#176b45]" />{item}</span>)}</div>
          </div>
          <div className="card overflow-hidden p-3 shadow-2xl shadow-green-950/10">
            <div className="rounded-xl bg-[#11251a] p-7 text-white">
              <div className="flex items-start justify-between"><div><p className="text-sm text-white/60">Inventory health</p><p className="mt-2 text-4xl font-black">94%</p></div><Sparkles className="text-[#dfff7a]" /></div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[["Stock value", "₹6,98,240"], ["Units", "12,481"], ["Low stock", "7"], ["Suppliers", "18"]].map(([label,value]) => <div key={label} className="rounded-xl bg-white/8 p-4"><p className="text-xs text-white/55">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}
              </div>
              <div className="mt-5 rounded-xl bg-[#dfff7a] p-4 text-[#17211b]"><p className="text-xs font-bold uppercase tracking-wider">Reorder signal</p><p className="mt-1 font-bold">3 products may stock out this week</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y bg-white py-18"><div className="container-shell grid gap-5 md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border p-6"><Icon className="size-6 text-[#176b45]" /><h2 className="mt-5 text-lg font-extrabold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#68736c]">{text}</p></article>)}</div></section>
      <Footer />
    </main>
  );
}
