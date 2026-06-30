"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, User, UserRound } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";

interface AccountMenuProps {
  placement?: "rail" | "header";
  triggerClassName?: string;
}

export default function AccountMenu({
  placement = "header",
  triggerClassName = "",
}: AccountMenuProps) {
  const t = useT();
  const { user, loading, openAuth, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Until the initial /me check resolves, render an inert placeholder so the
  // control doesn't flash from "log in" to "account" (or vice versa).
  if (loading) {
    return (
      <span aria-hidden className={triggerClassName} style={{ opacity: 0 }}>
        <User className="h-5 w-5" />
      </span>
    );
  }

  // Anonymous: the control is a direct "log in" button — no dropdown.
  if (!user) {
    return (
      <button
        aria-label={t("account_login")}
        className={triggerClassName}
        onClick={() => openAuth("login")}
        title={t("account_login")}
        type="button"
      >
        <LogIn className="h-5 w-5" />
      </button>
    );
  }

  const menuPosition =
    placement === "rail"
      ? "bottom-0 left-full ml-3 origin-bottom-left"
      : "right-0 top-full mt-2 origin-top-right";
  const roleLabel =
    user.role === "admin" ? t("account_role_admin") : t("account_role_user");

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("account_menu")}
        className={triggerClassName}
        onClick={() => setOpen((value) => !value)}
        title={t("account_menu")}
        type="button"
      >
        <User className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className={`absolute z-50 min-w-[190px] rounded-2xl border border-line bg-cloud p-1.5 shadow-[0_24px_50px_-20px_rgba(20,22,27,0.45)] ${menuPosition}`}
          role="menu"
        >
          <div className="px-3 pb-1.5 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/35">
              {t("account_signedIn")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{roleLabel}</p>
          </div>
          <Link
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-tone hover:text-ink"
            href="/profile"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <UserRound className="h-4 w-4" />
            {t("account_profile")}
          </Link>
          <button
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-tone hover:text-ink"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            role="menuitem"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {t("account_logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
