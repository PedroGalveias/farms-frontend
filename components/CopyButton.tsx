"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface CopyButtonProps {
  value: string;
  /** Accessible label / button text (defaults to "Copy address"). */
  label?: string;
  className?: string;
}

const defaultClassName =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-cloud px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20";

/** Copies a string to the clipboard with a brief "Copied!" confirmation. */
export default function CopyButton({
  value,
  label,
  className,
}: CopyButtonProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const text = label ?? t("copy_address");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — nothing else to do.
    }
  };

  return (
    <button
      aria-label={text}
      className={className ?? defaultClassName}
      onClick={copy}
      type="button"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-pine" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? t("share_copied") : text}
    </button>
  );
}
