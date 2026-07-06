"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (placement === "rail") {
      setStyle({
        position: "fixed",
        left: rect.right + 12,
        bottom: window.innerHeight - rect.bottom,
      });
    } else {
      setStyle({
        position: "fixed",
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
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

  const roleLabel =
    user.role === "admin" ? t("account_role_admin") : t("account_role_user");

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("account_menu")}
        className={triggerClassName}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        title={t("account_menu")}
        type="button"
      >
        <User className="h-5 w-5" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="glass glass-chrome z-[70] min-w-[190px] max-w-[calc(100vw-1.5rem)] rounded-2xl p-1.5"
              ref={menuRef}
              role="menu"
              style={style}
            >
              <div className="px-3 pb-1.5 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
                  {t("account_signedIn")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {roleLabel}
                </p>
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
