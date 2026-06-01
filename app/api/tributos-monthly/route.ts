import { NextResponse } from "next/server";
import { chargeMonthlyTaxes, monthlyTaxPreview, normalizeState } from "../../../lib/bank";
import { productionSecret, timingSafeTokenEqual } from "../../../lib/api-security";
import { readRemoteState, writeRemoteState } from "../developer-payments/crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const headers = {
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-tributos-key"
};

const cronSecret = () => productionSecret(process.env.CRON_SECRET, process.env.TRIBUTOS_ADMIN_KEY, process.env.PLACETA_GDLP_ADMIN_KEY);

function authorized(request: Request) {
  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const key = request.headers.get("x-tributos-key") || "";
  const expected = cronSecret();
  return timingSafeTokenEqual(bearer, expected) || timingSafeTokenEqual(key, expected);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";
  const dryRun = url.searchParams.get("dryRun") === "true";
  const now = new Date();
  const state = normalizeState(await readRemoteState());
  const preview = monthlyTaxPreview(state, now);
  if (dryRun) {
    return NextResponse.json({ mode: "dryRun", preview }, { headers });
  }

  const result = chargeMonthlyTaxes(state, now, force);
  if (!result.charged) {
    return NextResponse.json({
      ok: true,
      charged: false,
      skipped: result.skipped || "already_charged_or_no_tax",
      preview: result.preview
    }, { headers });
  }

  const saved = await writeRemoteState(result.state);
  return NextResponse.json({
    ok: true,
    charged: true,
    periodKey: result.preview.periodKey,
    transactions: result.transactions?.length || 0,
    totalTaxPz: result.transactions?.reduce((sum, transaction) => sum + transaction.amountPz, 0) || 0,
    stateUpdatedAt: saved.updatedAt
  }, { headers });
}

export async function GET(request: Request) {
  try {
    return await run(request);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "monthly_tax_failed" }, { status: 500, headers });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
