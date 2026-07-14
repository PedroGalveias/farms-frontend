"use client";

import { useId } from "react";
import {
  ArrowUpRight,
  Check,
  Heart,
  type LucideIcon,
  Route,
  Share2,
} from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";
import { useT } from "@/components/i18n/LanguageProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";
import { useTrip } from "@/components/trip/TripProvider";
import { haptic } from "@/lib/haptics";
import { playTick } from "@/lib/sound";
import HapticTap from "@/components/ui/HapticTap";
import { farmShareUrl } from "@/lib/share";
import { getCantonName } from "@/lib/farms";
import type { Farm } from "@/types/farm";

interface FarmQuickActionsProps {
  farm: Farm;
  onClose: () => void;
  /** Open the full detail sheet (the long-press's "primary" action). */
  onOpenDetails: (farm: Farm) => void;
}

/**
 * Touch quick-actions sheet — the mobile analogue of a right-click, opened by
 * long-pressing a farm card. Surfaces the same actions the detail sheet has
 * (save, plan, share, open) one tap away, without leaving the list.
 */
export default function FarmQuickActions({
  farm,
  onClose,
  onOpenDetails,
}: FarmQuickActionsProps) {
  const t = useT();
  const titleId = useId();
  const { isFavorite, toggleFavorite } = usePersonalization();
  const { isInTrip, toggleStop, isFull } = useTrip();
  const saved = isFavorite(farm.id);
  const planned = isInTrip(farm.id);

  const runAndClose = (action: () => void) => {
    haptic();
    playTick();
    action();
    onClose();
  };

  const share = async () => {
    const url = farmShareUrl(window.location.origin, farm.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: farm.name, text: farm.address, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // User dismissed the share sheet, or the API is unavailable — no-op.
    }
  };

  return (
    <BottomSheet
      closeLabel={t("detail_close")}
      labelledBy={titleId}
      onClose={onClose}
    >
      <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-1">
        <div className="px-1">
          <p className="text-xs font-semibold text-ink/60">
            {farm.canton} · {getCantonName(farm.canton)}
          </p>
          <h2
            className="mt-1 text-xl font-bold tracking-[-0.03em] text-ink"
            id={titleId}
          >
            {farm.name}
          </h2>
        </div>

        <div className="mt-4 space-y-1.5">
          <ActionRow
            icon={ArrowUpRight}
            label={t("nearest_view")}
            onClick={() => {
              onClose();
              onOpenDetails(farm);
            }}
          />
          <ActionRow
            active={saved}
            icon={saved ? Check : Heart}
            label={saved ? t("card_saved") : t("card_save")}
            onClick={() => runAndClose(() => toggleFavorite(farm.id))}
          />
          <ActionRow
            active={planned}
            disabled={!planned && isFull}
            icon={planned ? Check : Route}
            label={planned ? t("trip_added") : t("trip_add")}
            onClick={() =>
              runAndClose(() =>
                toggleStop({
                  id: farm.id,
                  name: farm.name,
                  coordinates: farm.coordinates,
                  canton: farm.canton,
                }),
              )
            }
          />
          <ActionRow
            icon={Share2}
            label={t("share_label")}
            onClick={() => {
              haptic();
              void share();
              onClose();
            }}
          />
        </div>
      </div>
    </BottomSheet>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={`relative flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold transition focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-pine/10 text-pine"
          : "text-ink/80 hover:bg-ink/[0.05] active:bg-ink/[0.08]"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
      {/* Real-switch tap-through: the reliable iOS system haptic (the
          programmatic tick in runAndClose covers Android). */}
      {disabled ? null : <HapticTap />}
    </button>
  );
}
