"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { playTick } from "@/lib/sound";
import { useToast } from "@/components/ui/ToastProvider";
import HapticTap from "@/components/ui/HapticTap";
import { useT } from "@/components/i18n/LanguageProvider";

interface CopyButtonProps {
  value: string;
  /** Accessible label / button text (defaults to "Copy address"). */
  label?: string;
  className?: string;
}

const defaultClassName =
  "relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-cloud px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20";

/** Copies a string to the clipboard with a brief "Copied!" confirmation. */
export default function CopyButton({
  value,
  label,
  className,
}: CopyButtonProps) {
  const t = useT();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const text = label ?? t("copy_address");

  const copy = async () => {
    // Haptic + sound FIRST, synchronously: after the clipboard await we're
    // outside the user-gesture window and iOS mutes the switch-toggle haptic.
    // Native buttons tick on touch, not on completion, so this is also the
    // right UX.
    haptic();
    playTick();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        message: t("toast_copied"),
        icon: <Check className="h-4 w-4" />,
      });
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
        <Check className="check-pop h-3.5 w-3.5 text-pine" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? t("share_copied") : text}
      <HapticTap />
    </button>
  );
}
