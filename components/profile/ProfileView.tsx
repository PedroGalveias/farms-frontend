"use client";

import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  Hammer,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Account / profile management. The backend doesn't expose editable profile
 * fields yet, so the personal-details and security sections are a clearly
 * labelled "work in progress" preview: disabled inputs that show the intended
 * shape without pretending to save anything. The Account section shows the
 * real data we do have (id + role).
 */
export default function ProfileView() {
  const t = useT();
  const { user, loading, openAuth, logout } = useAuth();

  // Signed-out (or still resolving the session): a simple prompt to log in.
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 transition hover:text-ink"
          href="/"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("farm_back")}
        </Link>
        <div className="mt-10 rounded-3xl border border-line bg-cloud p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pine/10 text-pine">
            <UserRound className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-[-0.03em] text-ink">
            {t("profile_title")}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink/55">
            {t("profile_signinPrompt")}
          </p>
          {!loading ? (
            <button
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-cloud transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
              onClick={() => openAuth("login")}
              type="button"
            >
              {t("profile_signinCta")}
            </button>
          ) : null}
        </div>
      </main>
    );
  }

  const roleLabel =
    user.role === "admin" ? t("account_role_admin") : t("account_role_user");

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 transition hover:text-ink"
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
          <p className="mt-2 text-base leading-7 text-ink/55">
            {t("profile_subtitle")}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-line bg-cloud px-5 py-2.5 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
          onClick={() => void logout()}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          {t("account_logout")}
        </button>
      </header>

      {/* Work-in-progress notice */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3.5">
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

      {/* Real account data */}
      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/40">
          {t("profile_account")}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-paper px-4 py-3.5 ring-1 ring-inset ring-line">
            <p className="text-xs font-semibold text-ink/40">
              {t("profile_accountId")}
            </p>
            <p className="mt-1.5 truncate font-mono text-sm text-ink/80">
              {user.user_id}
            </p>
          </div>
          <div className="rounded-2xl bg-paper px-4 py-3.5 ring-1 ring-inset ring-line">
            <p className="text-xs font-semibold text-ink/40">
              {t("profile_role")}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
              <ShieldCheck className="h-4 w-4" />
              {roleLabel}
            </p>
          </div>
        </div>
      </section>

      {/* WIP: personal details */}
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

      {/* WIP: security */}
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
    </main>
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
        <span className="text-ink/40">{icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-ink/40">
          {title}
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-tone px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/45">
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
    <label className="block rounded-2xl bg-paper px-4 py-3 ring-1 ring-inset ring-line">
      <span className="text-xs font-semibold text-ink/40">{label}</span>
      <span className="mt-1.5 flex items-center gap-2 text-ink/35">
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
