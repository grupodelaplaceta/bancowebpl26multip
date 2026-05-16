import { NextResponse } from "next/server";
import { getState } from "../../../lib/placeta-api";
import type { BankState } from "../../../lib/types";

export async function GET() {
  try {
    const state = await getState<BankState>();
    return NextResponse.json({
      ...state,
      demoAccess: true
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "admin_state_error" }, { status: 500 });
  }
}
