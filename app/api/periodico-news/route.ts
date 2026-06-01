import { NextResponse } from "next/server";
import { GdlpSharedNewsItem, normalizeState } from "../../../lib/bank";
import { productionSecret, timingSafeTokenEqual } from "../../../lib/api-security";
import { periodicoNews } from "../../../lib/periodico-content";
import { readRemoteState, writeRemoteState } from "../developer-payments/crypto";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,x-gdlp-admin-key",
  "access-control-max-age": "86400"
};

const adminKey = () => productionSecret(process.env.PERIODICO_ADMIN_KEY, process.env.GDLP_ADMIN_KEY, process.env.PLACETA_GDLP_ADMIN_KEY);

type PeriodicoNewsPayload = Partial<GdlpSharedNewsItem> & {
  adminKey?: string;
  news?: Partial<GdlpSharedNewsItem> | Partial<GdlpSharedNewsItem>[];
};

function text(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeItem(input: Partial<GdlpSharedNewsItem>): GdlpSharedNewsItem {
  const title = text(input.title, "Noticia del periodico").slice(0, 140);
  const slug = text(input.slug, slugify(title)).slice(0, 120) || `noticia-${Date.now()}`;
  const summary = text(input.summary || input.body?.[0] || title).slice(0, 320);
  const image = text(input.image || input.images?.[0] || "/assets/logobanco.jpg");
  const body = list(input.body).length ? list(input.body).slice(0, 24) : [summary];
  const videos = list(input.videos).slice(0, 8);
  return {
    slug,
    title,
    tag: text(input.tag, "Redaccion").slice(0, 60),
    summary,
    date: text(input.date, new Date().toLocaleDateString("es-ES")),
    image,
    images: [image, ...list(input.images)].filter(Boolean).slice(0, 12),
    body,
    html: text(input.html).slice(0, 16000) || undefined,
    videoUrl: text(input.videoUrl || videos[0]) || undefined,
    videos,
    source: "periodico-gdlp",
    updatedAt: new Date().toISOString()
  };
}

async function newsPayload() {
  const remote = normalizeState(await readRemoteState());
  const shared = remote.periodicoNews || [];
  return shared.length ? shared : periodicoNews;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const news = await newsPayload();
    return NextResponse.json({ news }, { headers: corsHeaders });
  } catch {
    return NextResponse.json({ news: periodicoNews, fallback: true }, { headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PeriodicoNewsPayload;
    const provided = request.headers.get("x-gdlp-admin-key") || text(payload.adminKey);
    if (!timingSafeTokenEqual(provided, adminKey())) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });

    const incoming: Partial<GdlpSharedNewsItem>[] = Array.isArray(payload.news) ? payload.news : [payload.news || payload];
    const items = incoming.map((item: Partial<GdlpSharedNewsItem>) => sanitizeItem(item));
    const remote = normalizeState(await readRemoteState());
    const bySlug = new Map<string, GdlpSharedNewsItem>();
    [...items, ...(remote.periodicoNews || [])].forEach((item) => bySlug.set(item.slug, sanitizeItem(item)));
    const next = normalizeState({
      ...remote,
      periodicoNews: [...bySlug.values()].slice(0, 80)
    });
    const saved = await writeRemoteState(next);
    return NextResponse.json({ ok: true, news: saved.periodicoNews }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "periodico_news_save_failed" }, { status: 400, headers: corsHeaders });
  }
}
