"use client";

import { useState } from "react";
import { haptic } from "@/lib/haptics";
import { Check, Share2 } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface ShareButtonProps {
  /** Absolute URL, or an in-app path that's resolved against the current origin. */
  url: string;
  title: string;
  text?: string;
  className?: string;
}

const defaultClassName =
  "inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-6 py-3.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20";

/**
 * Shares a link via the native Web Share sheet where available (mostly mobile),
 * otherwise copies it to the clipboard and shows a brief "copied" confirmation.
 */
export default function ShareButton({
  url,
  title,
  text,
  className,
}: ShareButtonProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    // Haptic first, inside the user-gesture window (awaits below leave it).
    haptic();
    const absolute = /^https?:\/\//.test(url)
      ? url
      : `${window.location.origin}${url}`;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({ title, text, url: absolute });
        return;
      } catch (error) {
        // The user dismissing the share sheet is not an error to recover from.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Any other failure falls through to the copy path below.
      }
    }

    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — nothing else to do.
    }
  };

  return (
    <button
      className={className ?? defaultClassName}
      onClick={share}
      type="button"
    >
      {copied ? (
        <Check className="h-4 w-4 text-pine" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {copied ? t("share_copied") : t("share_label")}
    </button>
  );
}
