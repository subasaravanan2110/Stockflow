import Link from "next/link";
import { siteConfig } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t bg-white py-7 text-sm text-[#68736c]">
      <div className="container-shell flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p>Built by {siteConfig.candidateName}</p>
        <nav aria-label="Developer profiles" className="flex gap-5 font-semibold">
          <Link href={siteConfig.githubUrl} target="_blank">GitHub</Link>
          <Link href={siteConfig.linkedinUrl} target="_blank">LinkedIn</Link>
        </nav>
      </div>
    </footer>
  );
}
