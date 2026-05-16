import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { sha256Hex, writeAuditLog } from "../../../lib/audit";
import { generateWebIban } from "../../../lib/bank";
import { getState, upsertEntity } from "../../../lib/placeta-api";
import type { Account, BankState, DigitalCard, LedgerTransaction, UserProfile } from "../../../lib/types";

const AGLDP_ID = "AGLDP";

function ageFromBirthDate(value: string) {
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function tierForAge(age: number) {
  if (age < 16) return { tier: "JuniorBasica", type: "Child" as const, sendLimitPz: 50 };
  if (age < 18) return { tier: "JuniorSenior", type: "Current" as const, sendLimitPz: 100 };
  return { tier: "CiudadaniaPlena", type: "Current" as const, sendLimitPz: undefined };
}

export async function POST(request: Request) {
  try {
    const { dip, displayName, password, birthDate } = (await request.json()) as {
      dip?: string;
      displayName?: string;
      password?: string;
      birthDate?: string;
    };
    const normalizedDip = dip?.trim().toUpperCase();
    const cleanName = displayName?.trim();
    if (!normalizedDip || !/^DIP-[A-Z0-9]{4}$/.test(normalizedDip)) return NextResponse.json({ error: "invalid_dip" }, { status: 400 });
    if (!cleanName || cleanName.length < 2) return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    if (!password || password.length < 4) return NextResponse.json({ error: "invalid_password" }, { status: 400 });
    if (!birthDate) return NextResponse.json({ error: "birth_date_required" }, { status: 400 });
    const age = ageFromBirthDate(birthDate);
    if (age == null || age < 0) return NextResponse.json({ error: "invalid_birth_date" }, { status: 400 });

    const state = await getState<BankState>();
    if ((state.users || []).some((user) => user.dip?.toUpperCase() === normalizedDip)) {
      return NextResponse.json({ error: "dip_already_exists" }, { status: 409 });
    }
    const placetaId = normalizedDip.replace("DIP-", "");
    const tier = tierForAge(age);
    const accountId = `web-${crypto.randomUUID()}`;
    const account: Account = {
      id: accountId,
      displayName: tier.type === "Child" ? "Cuenta Junior Web" : "Cuenta Web",
      kind: "CITIZEN",
      balancePz: 500,
      placetaId,
      role: "Citizen",
      type: tier.type,
      iban: generateWebIban(`${normalizedDip}-${accountId}`),
      sendLimitPz: tier.sendLimitPz,
      citizenshipTier: tier.tier,
      complianceStatus: "Clear"
    };
    const user: UserProfile = {
      dip: normalizedDip,
      displayName: cleanName,
      placetaId,
      primaryAccountId: accountId,
      pinHash: await sha256Hex(password),
      birthDate,
      verifiedAge: age
    };
    const card: DigitalCard = {
      id: `card-${crypto.randomUUID()}`,
      accountId,
      alias: "Tarjeta virtual web",
      tier: "Standard",
      cardNumber: crypto.randomInt(0, 1_000_000).toString().padStart(6, "0"),
      pin: crypto.randomInt(0, 10_000).toString().padStart(4, "0"),
      promoPhysical: false,
      released: false
    };
    const agldp = (state.accounts || []).find((item) => item.id === AGLDP_ID);
    const welcome: LedgerTransaction = {
      id: `welcome-web-${crypto.randomUUID()}`,
      kind: "WelcomeBonus",
      fromAccountId: AGLDP_ID,
      toAccountId: accountId,
      amountPz: 500,
      note: "Bono de bienvenida Banco de La Placeta Web",
      status: "Settled",
      createdAt: new Date().toISOString(),
      netAmount: 500,
      taxAmount: 0,
      concept: "WELCOME_WEB",
      IBAN_Origin: agldp?.iban || AGLDP_ID
    };
    await upsertEntity("users", normalizedDip, user);
    await upsertEntity("accounts", account.id, account);
    await upsertEntity("digitalCards", card.id, card);
    await upsertEntity("transactions", welcome.id, welcome);
    if (agldp) await upsertEntity("accounts", agldp.id, { ...agldp, balancePz: Math.max(0, agldp.balancePz - 500) });
    await writeAuditLog(request, { actorDip: normalizedDip, action: "WEB_REGISTER", targetId: account.id, metadata: { age, tier: tier.tier } });
    return NextResponse.json({ ok: true, user, account, card });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "register_error" }, { status: 500 });
  }
}
