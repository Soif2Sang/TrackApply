import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail";

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.json({ url: authUrl });
  } catch {
    return NextResponse.json(
      { error: "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI." },
      { status: 500 }
    );
  }
}
