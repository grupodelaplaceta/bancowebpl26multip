import { NextResponse } from "next/server";
import { appSecret, signedHeaders, baseUrl } from "../developer-payments/crypto";

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const path = "/api/payment-links";
    const secret = appSecret();
    const url = `${baseUrl()}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: signedHeaders("POST", path, bodyText, secret),
      body: bodyText,
      cache: "no-store"
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "internal_error" },
      { status: 500 }
    );
  }
}
