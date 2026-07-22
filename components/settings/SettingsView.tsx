"use client";

import { useEffect, useState } from "react";
import Link from "@/components/i18n/LocalizedLink";
import {
  ArrowLeft,
  AtSign,
  Bell,
  Eraser,
  KeyRound,
  Languages,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  SunMoon,
  Trash2,
  UserRound,
  Vibrate,
  Volume2,
} from "lucide-react";
import { useLanguage, useT } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme, type ThemeMode } from "@/components/theme/ThemeProvider";
import { LOCALES } from "@/lib/i18n-core";
import { motionForced, setMotionForced } from "@/lib/motion";
import { hapticsEnabled, setHapticsEnabled, haptic } from "@/lib/haptics";
import { playTick, setSoundEnabled, soundEnabled } from "@/lib/sound";
import { COLLECTIONS_STORAGE_KEY } from "@/lib/collections";

/**
 * The web app's settings — a native-style preferences screen. Everything here
 * is device-local (localStorage) except the Account block, whose editable
 * fields wait on the backend and stay a labelled preview.
 */
export default function SettingsView() {
  const t = useT();
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-ink"
        href="/profile"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("settings_backToProfile")}
      </Link>

      <header className="mt-6">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
          {t("settings_title")}
        </h1>
        <p className="mt-2 text-base leading-7 text-ink/60">
          {t("settings_subtitle")}
        </p>
      </header>

      <AppearanceSection />
      <LanguageSection />
      <FeedbackSection />
      <DataSection />

      {user ? (
        <section className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
            {t("settings_account")}
          </h2>
          <div className="mt-3 space-y-3">
            <WipRow
              icon={<UserRound className="h-4 w-4" />}
              label={t("settings_changeUsername")}
            />
            <WipRow
              icon={<AtSign className="h-4 w-4" />}
              label={t("settings_changeEmail")}
            />
            <WipRow
              icon={<KeyRound className="h-4 w-4" />}
              label={t("settings_changePassword")}
            />
            <WipRow
              danger
              icon={<Trash2 className="h-4 w-4" />}
              label={t("settings_deleteAccount")}
            />
            <button
              className="inline-flex items-center gap-2 rounded-chip border border-line bg-cloud px-5 py-2.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
              onClick={() => void logout()}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {t("account_logout")}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

/** Light / dark / follow-system / follow-the-sun. */
function AppearanceSection() {
  const t = useT();
  const { mode, setMode } = useTheme();

  const options: { value: ThemeMode; icon: React.ReactNode; label: string }[] =
    [
      {
        value: "system",
        icon: <Monitor className="h-4 w-4" />,
        label: t("settings_theme_system"),
      },
      {
        value: "sun",
        icon: <SunMoon className="h-4 w-4" />,
        label: t("settings_theme_sun"),
      },
      {
        value: "light",
        icon: <Sun className="h-4 w-4" />,
        label: t("settings_theme_light"),
      },
      {
        value: "dark",
        icon: <Moon className="h-4 w-4" />,
        label: t("settings_theme_dark"),
      },
    ];

  const hintKey = {
    system: "settings_theme_system_hint",
    sun: "settings_theme_sun_hint",
    light: "settings_theme_manual_hint",
    dark: "settings_theme_manual_hint",
  }[mode];

  return (
    <section className="mt-10">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
        {t("settings_appearance")}
      </h2>
      <div className="glass-inset mt-3 rounded-field px-4 py-4">
        <div
          aria-label={t("settings_appearance")}
          className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"
          role="radiogroup"
        >
          {options.map((option) => (
            <button
              aria-checked={mode === option.value}
              className={`flex items-center justify-center gap-2 rounded-field px-3 py-2.5 text-[13px] font-semibold transition ${
                mode === option.value
                  ? "bg-ink text-cloud shadow-elev-2"
                  : "bg-tone text-ink/70 hover:text-ink"
              }`}
              key={option.value}
              onClick={() => setMode(option.value)}
              role="radio"
              type="button"
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-ink/60">{t(hintKey)}</p>
      </div>
    </section>
  );
}

function LanguageSection() {
  const t = useT();
  const { locale, setLocale } = useLanguage();
  return (
    <section className="mt-10">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
        {t("profile_language")}
      </h2>
      <div className="glass-inset mt-3 rounded-field px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-ink/60">
          <Languages className="h-4 w-4" />
          {t("settings_language_hint")}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {LOCALES.map(({ code, label }) => (
            <button
              aria-pressed={locale === code}
              className={`rounded-chip px-3.5 py-1.5 text-[13px] font-semibold transition ${
                locale === code
                  ? "bg-ink text-cloud"
                  : "bg-tone text-ink/70 hover:text-ink"
              }`}
              key={code}
              onClick={() => setLocale(code)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Motion, sound, and haptic feedback — the "feel" of the app. */
function FeedbackSection() {
  const t = useT();

  const [motion, setMotion] = useState(false);
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  useEffect(() => {
    queueMicrotask(() => {
      setMotion(motionForced());
      setSound(soundEnabled());
      setHaptics(hapticsEnabled());
    });
  }, []);

  return (
    <section className="mt-10">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
        {t("settings_feedback")}
      </h2>
      <div className="mt-3 space-y-3">
        <SwitchRow
          hint={t("profile_motion_hint")}
          icon={<Sparkles className="h-4 w-4" />}
          label={t("profile_motion")}
          on={motion}
          onToggle={() => {
            const next = !motion;
            setMotionForced(next);
            setMotion(next);
          }}
        />
        <SwitchRow
          hint={t("settings_sound_hint")}
          icon={<Volume2 className="h-4 w-4" />}
          label={t("settings_sound")}
          on={sound}
          onToggle={() => {
            const next = !sound;
            setSoundEnabled(next);
            setSound(next);
            if (next) playTick(); // audible confirmation of the new state
          }}
        />
        <SwitchRow
          hint={t("settings_haptics_hint")}
          icon={<Vibrate className="h-4 w-4" />}
          label={t("settings_haptics")}
          on={haptics}
          onToggle={() => {
            const next = !haptics;
            setHapticsEnabled(next);
            setHaptics(next);
            if (next) haptic();
          }}
        />
      </div>
    </section>
  );
}

/** Local data controls — clear history or start over. */
function DataSection() {
  const t = useT();
  const [confirmReset, setConfirmReset] = useState(false);
  const [cleared, setCleared] = useState(false);

  const clearRecent = () => {
    try {
      localStorage.removeItem("farms.recent");
    } catch {
      /* ignore */
    }
    setCleared(true);
    window.setTimeout(() => setCleared(false), 2000);
  };

  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    try {
      for (const key of [
        "farms.favorites",
        "farms.recent",
        COLLECTIONS_STORAGE_KEY,
        "farms.location",
        "farms.searchStats",
        "farms.seasonalReminders",
      ]) {
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
    // Providers hydrate from storage on load — a reload is the honest reset.
    window.location.reload();
  };

  return (
    <section className="mt-10">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
        {t("settings_data")}
      </h2>
      <div className="mt-3 space-y-3">
        <div className="glass-inset flex items-center justify-between gap-4 rounded-field px-4 py-3.5">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-ink/60">
              <Eraser className="h-4 w-4" />
              {t("settings_clearRecent")}
            </p>
            <p className="mt-1 text-sm leading-6 text-ink/70">
              {t("settings_clearRecent_hint")}
            </p>
          </div>
          <button
            className="shrink-0 rounded-chip border border-line bg-cloud px-4 py-2 text-[13px] font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={clearRecent}
            type="button"
          >
            {cleared ? t("settings_cleared") : t("settings_clear")}
          </button>
        </div>

        <div className="glass-inset flex items-center justify-between gap-4 rounded-field px-4 py-3.5">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-ink/60">
              <Bell className="h-4 w-4" />
              {t("settings_resetAll")}
            </p>
            <p className="mt-1 text-sm leading-6 text-ink/70">
              {t("settings_resetAll_hint")}
            </p>
          </div>
          <button
            className={`shrink-0 rounded-chip px-4 py-2 text-[13px] font-semibold transition focus-visible:ring-2 ${
              confirmReset
                ? "bg-rose-600 text-white focus-visible:ring-rose-400"
                : "border border-rose-300/70 bg-rose-50 text-rose-700 hover:border-rose-400 focus-visible:ring-rose-300"
            }`}
            onClick={resetAll}
            type="button"
          >
            {confirmReset ? t("settings_resetConfirm") : t("settings_reset")}
          </button>
        </div>
      </div>
    </section>
  );
}

function SwitchRow({
  icon,
  label,
  hint,
  on,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="glass-inset flex items-center justify-between gap-4 rounded-field px-4 py-3.5">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold text-ink/60">
          {icon}
          {label}
        </p>
        <p className="mt-1 text-sm leading-6 text-ink/70">{hint}</p>
      </div>
      <button
        aria-pressed={on}
        className={`relative inline-flex h-7 w-[52px] shrink-0 items-center rounded-chip border transition-colors duration-300 ${
          on ? "border-pine/40 bg-pine" : "border-line bg-tone"
        }`}
        onClick={onToggle}
        type="button"
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-chip bg-white shadow-elev-1 transition-[left] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            on ? "left-[26px]" : "left-1"
          }`}
        />
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}

/** A disabled account action awaiting its backend endpoint. */
function WipRow({
  icon,
  label,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  const t = useT();
  return (
    <div
      aria-disabled
      className="glass-inset flex items-center justify-between gap-4 rounded-field px-4 py-3.5 opacity-60"
    >
      <p
        className={`flex items-center gap-2 text-sm font-semibold ${
          danger ? "text-rose-700" : "text-ink/75"
        }`}
      >
        {icon}
        {label}
      </p>
      <span className="inline-flex items-center gap-1.5 rounded-chip bg-tone px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/60">
        <ShieldCheck className="h-3 w-3" />
        {t("profile_comingSoon")}
      </span>
    </div>
  );
}
