import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white"><div className="container-shell flex h-18 items-center justify-between"><Logo /><ThemeToggle /></div></header>
      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,#dfff7a33,transparent_35%)] px-4 py-12">{children}</main>
      <Footer />
    </div>
  );
}
