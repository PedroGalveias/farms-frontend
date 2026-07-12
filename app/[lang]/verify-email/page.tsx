"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, MailX } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import LetterToFarm from "@/components/auth/LetterToFarm";

type Status = "idle" | "pending" | "success" | "error" | "missing";

const REDIRECT_SECONDS = 5;

export default function VerifyEmailPage() {
  const t = useT();
  const router = useRouter();
  const { openAuth } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  // Open the login modal (lives in the persistent root-layout provider, so it
  // survives the navigation) and go home. We can't rely on a ?auth=login URL
  // param: AuthProvider only reads it once on mount, which doesn't re-run for a
  // client-side navigation.
  const goToLogin = useCallback(() => {
    openAuth("login");
    router.push("/");
  }, [openAuth, router]);

  // Read the token from the URL once, then strip it so it never lingers in
  // history or leaks via the Referer header on outbound navigations.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("token");
    if (value) {
      // Strip the token from the URL synchronously (no setState) so it can't
      // leak via history or the Referer header.
      window.history.replaceState(null, "", window.location.pathname);
    }
    // Defer state out of the effect body (repo lint: no sync setState here).
    queueMicrotask(() => {
      setToken(value);
      setStatus(value ? "idle" : "missing");
    });
  }, []);

  // After success, count down and send the user to log in.
  useEffect(() => {
    if (status !== "success") {
      return undefined;
    }
    if (countdown <= 0) {
      goToLogin();
      return undefined;
    }
    const timer = window.setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [status, countdown, goToLogin]);

  const verify = async () => {
    if (!token) {
      return;
    }
    setStatus("pending");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
      {status === "success" ? (
        <>
          <LetterToFarm className="w-full max-w-[360px]" />
          <CheckCircle2 className="mt-2 h-10 w-10 text-pine" />
          <h1 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-black leading-[0.98] tracking-[-0.04em] text-ink">
            {t("verify_success_title")}
          </h1>
          <p className="mt-3 text-lg leading-8 text-ink/60">
            {t("verify_success_body")}
          </p>
          <p className="mt-2 text-sm text-ink/60">
            {t("verify_redirect", { n: countdown })}
          </p>
          <button
            className="mt-7 inline-flex items-center justify-center rounded-full bg-ink px-7 py-4 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            onClick={goToLogin}
            type="button"
          >
            {t("verify_success_cta")}
          </button>
        </>
      ) : status === "error" || status === "missing" ? (
        <>
          <MailX className="h-12 w-12 text-rose-500" />
          <h1 className="mt-5 text-[clamp(2rem,5vw,3rem)] font-black leading-[0.98] tracking-[-0.04em] text-ink">
            {t("verify_error_title")}
          </h1>
          <p className="mt-3 max-w-md text-lg leading-8 text-ink/60">
            {status === "missing"
              ? t("verify_missing_token")
              : t("verify_error_body")}
          </p>
          <Link
            className="mt-7 inline-flex items-center justify-center rounded-full border border-line bg-cloud px-7 py-4 text-sm font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            href="/"
          >
            {t("verify_error_cta")}
          </Link>
        </>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine">
            farms
          </p>
          <h1 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-black leading-[0.98] tracking-[-0.04em] text-ink">
            {t("verify_title")}
          </h1>
          <p className="mt-3 max-w-md text-lg leading-8 text-ink/60">
            {t("verify_subtitle")}
          </p>
          <button
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 text-sm font-bold text-cloud shadow-[0_16px_40px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status === "pending"}
            onClick={verify}
            type="button"
          >
            {status === "pending" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : null}
            {status === "pending" ? t("verify_pending") : t("verify_cta")}
          </button>
        </>
      )}
    </main>
  );
}
