import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailToken } from "@/app/actions/auth";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const { token, email } = await searchParams;
  const verified = Boolean(token && email && await verifyEmailToken(token, email));
  return <div className="card w-full max-w-md p-8 text-center">{verified ? <CheckCircle2 className="mx-auto size-11 text-green-700" /> : <XCircle className="mx-auto size-11 text-red-700" />}<h1 className="mt-4 text-3xl font-black">{verified ? "Email verified" : "Link invalid or expired"}</h1><p className="mt-2 text-sm text-[#68736c]">{verified ? "Your workspace is ready. Sign in to continue." : "Request a new verification link or contact your administrator."}</p><Link href="/login" className="btn btn-primary mt-6">Continue to sign in</Link></div>;
}
