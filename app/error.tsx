"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p className="eyebrow">Something went wrong</p><h1 className="mt-3 text-4xl font-black">We couldn’t load this page.</h1><p className="mt-3 text-[#68736c]">Your saved inventory has not been changed.</p><Button onClick={reset} className="mt-6">Try again</Button></div></main>;
}
