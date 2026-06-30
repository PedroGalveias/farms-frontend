"use client";

import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const INSTALL_DISMISSED_KEY = "farms.install.dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function shouldShowIosInstallHint() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return (
    !window.localStorage.getItem(INSTALL_DISMISSED_KEY) &&
    isIos() &&
    !isStandalone()
  );
}

/**
 * Registers the service worker and exposes quiet PWA affordances: install on
 * supported mobile browsers and a "refresh to update" banner when a new worker
 * is ready.
 */
export default function PwaRegister() {
  const t = useT();
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(shouldShowIosInstallHint);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );
  const [visible, setVisible] = useState(shouldShowIosInstallHint);
  // Only reload after the user explicitly applies an update — never on the
  // first worker's initial clients.claim() (which would yank the page out from
  // under a first-time visitor, e.g. mid email-verification).
  const updateRequested = useRef(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let refreshing = false;

    const onControllerChange = () => {
      // Ignore the initial claim; only reload for a user-requested update.
      if (refreshing || !updateRequested.current) {
        return;
      }
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setVisible(true);
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) {
            return;
          }
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(worker);
              setVisible(true);
            }
          });
        });
      } catch {
        // Registration failure is non-fatal — the app works without offline.
      }
    };

    // Wait for load so SW registration doesn't compete with first paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  const dismissInstall = () => {
    setVisible(false);
    setShowIosHint(false);
    setInstallPrompt(null);
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  };

  const install = async () => {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "dismissed") {
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    }
    setVisible(false);
  };

  const update = () => {
    updateRequested.current = true;
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!visible || (!installPrompt && !showIosHint && !waitingWorker)) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-3xl border border-line bg-cloud/95 p-3 shadow-[0_18px_50px_-18px_rgba(20,22,27,0.55)] backdrop-blur-xl lg:bottom-5 lg:left-auto lg:right-5 lg:mx-0">
      {waitingWorker ? (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pine/10 text-pine">
            <RefreshCw className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              {t("pwa_update_title")}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-ink/60">
              {t("pwa_update_body")}
            </p>
          </div>
          <button
            className="rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-cloud"
            onClick={update}
            type="button"
          >
            {t("pwa_update_cta")}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pine/10 text-pine">
            <Download className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              {t("pwa_install_title")}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-ink/60">
              {showIosHint ? t("pwa_install_ios") : t("pwa_install_body")}
            </p>
          </div>
          {installPrompt ? (
            <button
              className="rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-cloud"
              onClick={install}
              type="button"
            >
              {t("pwa_install_cta")}
            </button>
          ) : null}
          <button
            aria-label={t("pwa_dismiss")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tone text-ink/50"
            onClick={dismissInstall}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
