"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Bookmark,
  Clock,
  FolderHeart,
  Hammer,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePersonalization } from "@/components/personalization/PersonalizationProvider";

/**
 * Account home. The library (saved farms, collections, recently viewed) and
 * preferences (language, theme, motion) are device-local and shown to
 * everyone; the account section needs a session. Editable profile fields are
 * still a clearly-labelled work-in-progress preview — the backend doesn't
 * expose them yet.
 */
export default function ProfileView() {
  const t = useT();
  const { user, loading, openAuth, logout } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 transition hover:text-ink"
        href="/"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("farm_back")}
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
            {t("profile_title")}
          </h1>
          <p className="mt-2 text-base leading-7 text-ink/60">
            {t("profile_subtitle")}
          </p>
        </div>
        {user ? (
          <button
            className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-5 py-2.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            onClick={() => void logout()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {t("account_logout")}
          </button>
        ) : null}
      </header>

      {/* Signed out: a compact sign-in invitation (the library and
          preferences below are device-local and work without an account). */}
      {!user ? (
        <div className="glass mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
          <div className="flex items-center gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pine/10 text-pine">
              <UserRound className="h-5 w-5" />
            </span>
            <p className="max-w-sm text-sm leading-6 text-ink/60">
              {t("profile_signinPrompt")}
            </p>
          </div>
          {!loading ? (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-cloud transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
              onClick={() => openAuth("login")}
              type="button"
            >
              {t("profile_signinCta")}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Account (real data) */}
      {user ? <AccountSection /> : null}

      <LibrarySection />
      <SettingsLink />

      {user ? (
        <>
          {/* Work-in-progress notice for the editable fields below. */}
          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3.5">
            <Hammer className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                {t("profile_wip_badge")}
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800/80">
                {t("profile_wip_note")}
              </p>
            </div>
          </div>

          <ProfileSection
            icon={<UserRound className="h-4 w-4" />}
            title={t("profile_personal")}
            wipLabel={t("profile_comingSoon")}
          >
            <Field
              icon={<UserRound className="h-4 w-4" />}
              label={t("profile_displayName")}
              placeholder="—"
            />
            <Field
              icon={<AtSign className="h-4 w-4" />}
              label={t("profile_email")}
              placeholder="—"
            />
          </ProfileSection>

          <ProfileSection
            icon={<ShieldCheck className="h-4 w-4" />}
            title={t("profile_security")}
            wipLabel={t("profile_comingSoon")}
          >
            <Field
              icon={<ShieldCheck className="h-4 w-4" />}
              label={t("profile_password")}
              placeholder="••••••••••••"
              type="password"
            />
          </ProfileSection>
        </>
      ) : null}
    </main>
  );
}

function AccountSection() {
  const t = useT();
  const { user } = useAuth();
  if (!user) return null;
  const roleLabel =
    user.role === "admin" ? t("account_role_admin") : t("account_role_user");

  return (
    <section className="mt-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
        {t("profile_account")}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="glass-inset rounded-2xl px-4 py-3.5">
          <p className="text-xs font-semibold text-ink/60">
            {t("profile_accountId")}
          </p>
          <p className="mt-1.5 truncate font-mono text-sm text-ink/80">
            {user.user_id}
          </p>
        </div>
        <div className="glass-inset rounded-2xl px-4 py-3.5">
          <p className="text-xs font-semibold text-ink/60">
            {t("profile_role")}
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
            <ShieldCheck className="h-4 w-4" />
            {roleLabel}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Saved farms, collections, recently viewed — the visitor's local library. */
function LibrarySection() {
  const t = useT();
  const { favoritesCount, collections, recent } = usePersonalization();

  const tiles = [
    {
      href: "/saved",
      icon: <Bookmark className="h-5 w-5" />,
      label: t("profile_savedFarms"),
      count: favoritesCount,
    },
    {
      href: "/saved",
      icon: <FolderHeart className="h-5 w-5" />,
      label: t("profile_collections"),
      count: collections.length,
    },
    {
      href: "/",
      icon: <Clock className="h-5 w-5" />,
      label: t("profile_recentlyViewed"),
      count: recent.length,
    },
  ];

  return (
    <section className="mt-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
        {t("profile_library")}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            className="glass glass-card glass-interactive group rounded-2xl px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2"
            href={tile.href}
            key={tile.label}
          >
            <span className="flex items-center justify-between text-pine">
              {tile.icon}
              <ArrowRight className="h-4 w-4 text-ink/30 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
            <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-ink">
              {tile.count}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-ink/60">
              {tile.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** The web-app settings live on their own page — link there. */
function SettingsLink() {
  const t = useT();
  return (
    <section className="mt-8">
      <Link
        className="glass glass-card glass-interactive group flex items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2"
        href="/settings"
      >
        <span className="flex items-center gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine/10 text-pine">
            <Settings className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">
              {t("settings_title")}
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-ink/60">
              {t("settings_subtitle")}
            </span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-ink/30 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}

function ProfileSection({
  icon,
  title,
  wipLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  wipLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <span className="text-ink/60">{icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">
          {title}
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-tone px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/60">
          {wipLabel}
        </span>
      </div>
      {/* Disabled preview — visually dimmed and non-interactive. */}
      <div
        aria-disabled
        className="mt-3 space-y-3 opacity-60 [&_*]:pointer-events-none"
      >
        {children}
      </div>
    </section>
  );
}

function Field({
  icon,
  label,
  placeholder,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block glass-inset rounded-2xl px-4 py-3">
      <span className="text-xs font-semibold text-ink/60">{label}</span>
      <span className="mt-1.5 flex items-center gap-2 text-ink/60">
        {icon}
        <input
          className="w-full bg-transparent text-sm text-ink/70 outline-none placeholder:text-ink/30"
          disabled
          placeholder={placeholder}
          tabIndex={-1}
          type={type}
        />
      </span>
    </label>
  );
}
