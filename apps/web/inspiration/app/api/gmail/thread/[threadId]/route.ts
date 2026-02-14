import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchThreadEmails, refreshAccessToken } from "@/lib/gmail";

async function getValidToken() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("gmail_access_token")?.value;
  const refreshToken = cookieStore.get("gmail_refresh_token")?.value;
  const expiry = cookieStore.get("gmail_expiry")?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  if (refreshToken && expiry && Date.now() > Number(expiry) - 60000) {
    try {
      const tokens = await refreshAccessToken(refreshToken);
      accessToken = tokens.access_token;

      cookieStore.set("gmail_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600,
        path: "/",
      });

      cookieStore.set("gmail_expiry", String(tokens.expiry_date), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    } catch {
      return null;
    }
  }

  return accessToken;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const accessToken = await getValidToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const emails = await fetchThreadEmails(accessToken, threadId);

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Thread fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}
