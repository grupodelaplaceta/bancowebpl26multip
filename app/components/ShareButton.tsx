"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title, url }: { title: string; url?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareUrl = url || window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url: shareUrl }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className="share-button" onClick={share}>
      <Share2 size={17} />
      {copied ? "Enlace copiado" : "Compartir"}
    </button>
  );
}
