"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Magnetic from "@/components/motion/Magnetic";
import { useT } from "@/components/i18n/LanguageProvider";
import type { ServiceStatus } from "@/types/farm";

const serviceStatusCopy = {
  degraded: {
    badgeClassName: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
    dotClassName: "bg-amber-500",
    icon: AlertTriangle,
    labelKey: "status_degraded",
  },
  offline: {
    badgeClassName: "bg-rose-500/10 text-rose-700 ring-rose-500/25",
    dotClassName: "bg-rose-500",
    icon: ShieldAlert,
    labelKey: "status_offline",
  },
  online: {
    badgeClassName: "bg-pine/10 text-pine ring-pine/20",
    dotClassName: "bg-pine-bright",
    icon: CheckCircle2,
    labelKey: "status_live",
  },
} as const;

export default function HomeHero({
  serviceStatus,
  onAddFarm,
}: {
  serviceStatus: ServiceStatus;
  onAddFarm: () => void;
}) {
  const t = useT();
  const statusMeta = serviceStatusCopy[serviceStatus];

  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col justify-center">
        <div
          className="rise-in flex flex-wrap items-center gap-2.5"
          style={{ ["--rise-delay" as string]: "0ms" }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full bg-pine-surface px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white"
            title={t("beta_title")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("beta_label")}
          </span>
          {serviceStatus !== "online" ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusMeta.badgeClassName}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full pulse-dot ${statusMeta.dotClassName}`}
              />
              {t(statusMeta.labelKey)}
            </span>
          ) : null}
        </div>

        <h1
          className="rise-in mt-6 text-[clamp(3rem,7.5vw,5.5rem)] font-black leading-[0.9] tracking-[-0.045em] text-ink"
          style={{ ["--rise-delay" as string]: "80ms" }}
        >
          {t("hero_lead")}{" "}
          <span className="whitespace-nowrap text-pine">
            {t("hero_accent")}
          </span>
        </h1>

        <p
          className="rise-in mt-7 max-w-md text-lg leading-8 text-ink/60"
          style={{ ["--rise-delay" as string]: "280ms" }}
        >
          {t("hero_subcopy")}
        </p>

        <div
          className="rise-in mt-9 flex flex-wrap items-center gap-3"
          style={{ ["--rise-delay" as string]: "380ms" }}
        >
          <Magnetic>
            <Link
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-bold text-cloud shadow-[0_16px_40px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(20,22,27,0.7)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
              href="/quick-search"
            >
              {t("cta_startQuickSearch")}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Magnetic>

          <button
            className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-6 py-4 text-sm font-semibold text-ink/70 transition-all duration-300 hover:border-ink/25 hover:text-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={onAddFarm}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {t("cta_addFarm")}
          </button>
        </div>
      </div>

      {/* The hero pane is now plain frosted glass over the sitewide living
          backdrop (AmbientBackdrop): the pane's backdrop-filter refracts the
          breathing orbs behind the page, so the "liquid glass" moment costs
          nothing beyond the blur the chrome already pays — the standalone
          WebGL showcase it replaces ran its own full render loop. */}
      <div
        aria-hidden
        className="glass rise-in relative min-h-[260px] overflow-hidden rounded-[32px] lg:min-h-0"
      >
        <div className="glass-inset absolute left-6 top-6 h-16 w-16 rounded-2xl" />
        <div className="glass-inset qs-float absolute bottom-8 right-8 h-24 w-24 rounded-[28px]" />
        <div className="glass-chip absolute bottom-12 left-8 h-8 w-28 rounded-full" />
      </div>
    </div>
  );
}
