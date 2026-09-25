import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p className="eyebrow">404</p><h1 className="mt-3 text-4xl font-black">That page is out of stock.</h1><p className="mt-3 text-[#68736c]">The resource may have moved or no longer exists.</p><Link href="/" className="btn btn-primary mt-6">Return home</Link></div></main>;
}
