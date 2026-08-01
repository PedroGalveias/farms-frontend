"use client";

import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Keyboard/screen-reader shortcut past the header and side rail to the page's
 * main content. Visually hidden until focused.
 */
export default function SkipLink() {
  const t = useT();
  const focusMainContent = () =>
    document.getElementById("main-content")?.focus();

  return (
    <a className="skip-link" href="#main-content" onClick={focusMainContent}>
      {t("skip_to_content")}
    </a>
  );
}
