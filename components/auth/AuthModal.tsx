"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { LoaderCircle, X } from "lucide-react";
import {
  mapAuthError,
  normaliseUsername,
  validateEmailFormat,
  validatePassword,
  validateUsername,
  type AuthUser,
} from "@/lib/auth";
import { useT } from "@/components/i18n/LanguageProvider";
import LetterToFarm from "@/components/auth/LetterToFarm";

export type AuthMode = "login" | "register";

interface AuthModalProps {
  mode: AuthMode | null;
  noticeKey: string | null;
  onClose: () => void;
  onSwitch: (mode: AuthMode) => void;
  onAuthenticated: (user?: AuthUser) => void;
}

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-transparent bg-tone px-4 py-3 text-sm font-medium text-ink transition duration-300 placeholder:font-normal placeholder:text-ink/70 focus:border-pine/50 focus:bg-cloud focus:ring-4 focus:ring-pine/10";
const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-ink/60";

type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export default function AuthModal({
  mode,
  noticeKey,
  onClose,
  onSwitch,
  onAuthenticated,
}: AuthModalProps) {
  const t = useT();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const open = mode !== null;

  // Reset everything whenever the modal closes, so it reopens clean. Deferred
  // out of the effect body (repo lint: no sync setState in effects).
  useEffect(() => {
    if (open) {
      return;
    }
    queueMicrotask(() => {
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setFieldErrors({});
      setFormError(null);
      setPending(false);
      setRegistered(false);
    });
  }, [open]);

  // Switching between login and register clears any errors from the other form
  // (the full reset only runs on close), so a wrong-password message doesn't
  // linger onto the register view. Email/password are kept so nothing retypes.
  useEffect(() => {
    queueMicrotask(() => {
      setFieldErrors({});
      setFormError(null);
    });
  }, [mode]);

  // Body scroll lock + focus the first field on open; Escape to close.
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("sheet-open");
    queueMicrotask(() => emailRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("sheet-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, pending, onClose]);

  if (!open) {
    return null;
  }

  const isLogin = mode === "login";

  const onBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !pending) {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    // Client-side validation (UX only — the backend is authoritative).
    const nextErrors: FieldErrors = {};
    if (!validateEmailFormat(email)) {
      nextErrors.email = "auth_err_email_invalid";
    }
    if (isLogin) {
      if (password.length === 0) {
        nextErrors.password = "auth_err_credentials";
      }
    } else {
      const usernameError = validateUsername(username);
      if (usernameError) {
        nextErrors.username = usernameError;
      }
      const passwordError = validatePassword(password);
      if (passwordError) {
        nextErrors.password = passwordError;
      }
      if (confirm !== password) {
        nextErrors.confirm = "auth_err_password_mismatch";
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setPending(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email: email.trim(), password }
        : {
            username: normaliseUsername(username),
            email: email.trim(),
            password,
          };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (isLogin) {
        if (res.ok) {
          // Reuse the login response {user_id, role} so the provider doesn't
          // have to round-trip /me again right after.
          const user = (await res.json().catch(() => null)) as AuthUser | null;
          onAuthenticated(user ?? undefined);
          return;
        }
        setFormError(t(mapAuthError(res.status)));
      } else {
        if (res.status === 202 || res.ok) {
          setRegistered(true);
          return;
        }
        // Username is public, so a clash is reported on the field (the only
        // enumerable signal — email stays a generic 202 either way).
        if (res.status === 409) {
          setFieldErrors({ username: "auth_err_username_taken" });
          return;
        }
        setFormError(t(mapAuthError(res.status)));
      }
    } catch {
      setFormError(t("auth_err_generic"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="qs-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-md"
      onClick={onBackdrop}
      role="presentation"
    >
      <div
        aria-labelledby="auth-heading"
        aria-modal="true"
        className="qs-sheet max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[32px] border border-line bg-cloud shadow-[0_50px_100px_-24px_rgba(20,22,27,0.45)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-pine">
              farms
            </p>
            <h2
              className="mt-2.5 text-3xl font-extrabold leading-[0.95] tracking-[-0.04em] text-ink"
              id="auth-heading"
            >
              {registered
                ? t("auth_check_email_title")
                : isLogin
                  ? t("auth_login_title")
                  : t("auth_register_title")}
            </h2>
            {!registered ? (
              <p className="mt-3 text-sm leading-6 text-ink/60">
                {isLogin
                  ? t("auth_login_subtitle")
                  : t("auth_register_subtitle")}
              </p>
            ) : null}
          </div>
          <button
            aria-label={t("auth_close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tone text-ink/70 transition hover:bg-ink hover:text-cloud focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-50"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {registered ? (
          <div className="px-6 pb-8 pt-6 text-center sm:px-8">
            <LetterToFarm className="mx-auto w-full max-w-[320px]" />
            <p className="mt-5 text-[15px] leading-7 text-ink/65">
              {t("auth_check_email_body")}
            </p>
            <button
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-cloud transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
              onClick={onClose}
              type="button"
            >
              {t("auth_check_email_cta")}
            </button>
          </div>
        ) : (
          <form
            className="px-6 pb-7 pt-6 sm:px-8"
            noValidate
            onSubmit={handleSubmit}
          >
            {noticeKey ? (
              <p className="mb-5 rounded-2xl bg-pine/10 px-4 py-3 text-sm font-medium text-pine">
                {t(noticeKey)}
              </p>
            ) : null}

            {!isLogin ? (
              <div className="mb-5">
                <label className={labelClassName} htmlFor="auth-username">
                  {t("auth_username_label")}
                </label>
                <input
                  aria-describedby={
                    fieldErrors.username
                      ? "auth-username-err"
                      : "auth-username-hint"
                  }
                  aria-invalid={fieldErrors.username ? true : undefined}
                  autoComplete="username"
                  className={fieldClassName}
                  id="auth-username"
                  inputMode="text"
                  onChange={(e) => {
                    // Lowercase as they type — what they see is what's stored.
                    setUsername(e.target.value.toLowerCase());
                    setFieldErrors((p) => ({ ...p, username: undefined }));
                    setFormError(null);
                  }}
                  onBlur={(e) => setUsername(normaliseUsername(e.target.value))}
                  placeholder={t("auth_username_placeholder")}
                  type="text"
                  value={username}
                />
                {fieldErrors.username ? (
                  <p
                    className="mt-2 text-sm text-rose-600"
                    id="auth-username-err"
                  >
                    {t(fieldErrors.username)}
                  </p>
                ) : (
                  <p
                    className="mt-2 text-xs text-ink/60"
                    id="auth-username-hint"
                  >
                    {t("auth_username_hint")}
                  </p>
                )}
              </div>
            ) : null}

            <div>
              <label className={labelClassName} htmlFor="auth-email">
                {t("auth_email_label")}
              </label>
              <input
                aria-describedby={
                  fieldErrors.email ? "auth-email-err" : undefined
                }
                aria-invalid={fieldErrors.email ? true : undefined}
                autoComplete="email"
                className={fieldClassName}
                id="auth-email"
                inputMode="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((p) => ({ ...p, email: undefined }));
                  setFormError(null);
                }}
                placeholder="you@example.com"
                ref={emailRef}
                type="email"
                value={email}
              />
              {fieldErrors.email ? (
                <p className="mt-2 text-sm text-rose-600" id="auth-email-err">
                  {t(fieldErrors.email)}
                </p>
              ) : null}
            </div>

            <div className="mt-5">
              <label className={labelClassName} htmlFor="auth-password">
                {t("auth_password_label")}
              </label>
              <input
                aria-describedby={
                  fieldErrors.password
                    ? "auth-pw-err"
                    : !isLogin
                      ? "auth-pw-hint"
                      : undefined
                }
                aria-invalid={fieldErrors.password ? true : undefined}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className={fieldClassName}
                id="auth-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, password: undefined }));
                  setFormError(null);
                }}
                placeholder="••••••••••••"
                type="password"
                value={password}
              />
              {fieldErrors.password ? (
                <p className="mt-2 text-sm text-rose-600" id="auth-pw-err">
                  {t(fieldErrors.password)}
                </p>
              ) : !isLogin ? (
                <p className="mt-2 text-xs text-ink/60" id="auth-pw-hint">
                  {t("auth_password_hint")}
                </p>
              ) : null}
            </div>

            {!isLogin ? (
              <div className="mt-5">
                <label className={labelClassName} htmlFor="auth-confirm">
                  {t("auth_confirm_label")}
                </label>
                <input
                  aria-describedby={
                    fieldErrors.confirm ? "auth-confirm-err" : undefined
                  }
                  aria-invalid={fieldErrors.confirm ? true : undefined}
                  autoComplete="new-password"
                  className={fieldClassName}
                  id="auth-confirm"
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setFieldErrors((p) => ({ ...p, confirm: undefined }));
                    setFormError(null);
                  }}
                  placeholder="••••••••••••"
                  type="password"
                  value={confirm}
                />
                {fieldErrors.confirm ? (
                  <p
                    className="mt-2 text-sm text-rose-600"
                    id="auth-confirm-err"
                  >
                    {t(fieldErrors.confirm)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {formError ? (
              <p
                className="mt-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <button
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-bold text-cloud shadow-[0_16px_36px_-12px_rgba(20,22,27,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : null}
              {isLogin ? t("auth_login_submit") : t("auth_register_submit")}
            </button>

            <button
              className="mt-4 w-full text-center text-sm font-semibold text-ink/60 transition hover:text-ink"
              onClick={() => onSwitch(isLogin ? "register" : "login")}
              type="button"
            >
              {isLogin ? t("auth_to_register") : t("auth_to_login")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
