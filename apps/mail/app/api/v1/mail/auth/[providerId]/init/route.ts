import { type NextRequest, NextResponse } from "next/server";
import { createDriver } from "@/app/api/driver";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { providerId } = await params;
  const driver = await createDriver(providerId, {});
  const authUrl = driver.generateConnectionAuthUrl(userId);
  return NextResponse.redirect(authUrl);
}
