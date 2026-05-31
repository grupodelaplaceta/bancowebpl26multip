import { NextResponse } from "next/server";
import { GdlpSharedNewsItem, normalizeState } from "../../../lib/bank";
import { gdlpNews } from "../../../lib/gdlp-content";
import { productionSecret, timingSafeTokenEqual } from "../../../lib/api-security";
import { readRemoteState, writeRemoteState } from "../developer-payments/crypto";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,x-gdlp-admin-key",
  "access-control-max-age": "86400"
};

const adminKey = () => productionSecret(process.env.GDLP_ADMIN_KEY, process.env.PLACETA_GDLP_ADMIN_KEY);

type GdlpNewsPayload = Partial<GdlpSharedNewsItem> & {
  adminKey?: string;
  news?: Partial<GdlpSharedNewsItem> | Partial<GdlpSharedNewsItem>[];
};

function text(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function sanitizeItem(input: Partial<GdlpSharedNewsItem>): GdlpSharedNewsItem {
  const title = text(input.title, "Noticia GDLP").slice(0, 140);
  const slug = text(input.slug, title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).slice(0, 120);
  const summary = text(input.summary || input.body?.[0] || title).slice(0, 320);
  const image = text(input.image || input.images?.[0] || "/assets/promoscarrusel/1.png");
  const body = list(input.body).length ? list(input.body).slice(0, 24) : [summary];
  const videos = list(input.videos).slice(0, 8);
  return {
    slug,
    title,
    tag: text(input.tag, "Comunicado").slice(0, 60),
    summary,
    date: text(input.date, new Date().toLocaleDateString("es-ES")),
    image,
    images: [image, ...list(input.images)].filter(Boolean).slice(0, 12),
    body,
    html: text(input.html).slice(0, 16000) || undefined,
    videoUrl: text(input.videoUrl || videos[0]) || undefined,
    videos,
    source: text(input.source, "gdlp-web"),
    updatedAt: new Date().toISOString()
  };
}

async function newsPayload() {
  const remote = normalizeState(await readRemoteState());
  const shared = remote.gdlpSharedNews || [];
  return shared.length ? shared : gdlpNews;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const news = await newsPayload();
    return NextResponse.json({ news }, { headers: corsHeaders });
  } catch {
    return NextResponse.json({ news: gdlpNews, fallback: true }, { headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GdlpNewsPayload;
    const provided = request.headers.get("x-gdlp-admin-key") || text(payload.adminKey);
    if (!timingSafeTokenEqual(provided, adminKey())) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });

    const incoming: Partial<GdlpSharedNewsItem>[] = Array.isArray(payload.news) ? payload.news : [payload.news || payload];
    const items = incoming.map((item: Partial<GdlpSharedNewsItem>) => sanitizeItem(item));
    const remote = normalizeState(await readRemoteState());
    const bySlug = new Map<string, GdlpSharedNewsItem>();
    [...items, ...(remote.gdlpSharedNews || [])].forEach((item) => bySlug.set(item.slug, sanitizeItem(item)));
    const next = normalizeState({
      ...remote,
      gdlpSharedNews: [...bySlug.values()].slice(0, 60)
    });
    const saved = await writeRemoteState(next);
    return NextResponse.json({ ok: true, news: saved.gdlpSharedNews }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "gdlp_news_save_failed" }, { status: 400, headers: corsHeaders });
  }
}
