import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (
    !session?.user?.id
    || !session.user.organizationId
    || session.requiresTwoFactor
    || session.demoSessionExpired
  ) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
