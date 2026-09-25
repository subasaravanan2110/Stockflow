import Link from "next/link";
import { Boxes } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-black tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-[#176b45] text-white"><Boxes className="size-5" /></span>
      <span>Stock<span className="text-[#176b45]">Flow</span></span>
    </Link>
  );
}
