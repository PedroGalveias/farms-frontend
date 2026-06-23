import type { LucideIcon } from "lucide-react";

/** Decorative placeholder tile used in the hero and bento overview. */
export default function ImageSlot({
  className = "",
  icon: Icon,
  label,
}: {
  className?: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div
      aria-hidden
      className={`relative flex flex-col items-center justify-center gap-3 overflow-hidden bg-tone ${className}`}
    >
      <div className="absolute inset-0 [background:radial-gradient(130%_120%_at_25%_-10%,rgba(33,160,90,0.12),transparent_60%)]" />
      <span className="relative grid h-12 w-12 place-items-center rounded-full bg-cloud text-pine shadow-[0_1px_2px_rgba(20,22,27,0.06)]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="relative text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
        {label}
      </span>
    </div>
  );
}
