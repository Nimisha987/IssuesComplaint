import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token } = await request.json();
  const response = NextResponse.json({ success: true });
  response.cookies.set("civic_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}