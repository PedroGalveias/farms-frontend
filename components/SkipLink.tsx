"use client";

import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Keyboard/screen-reader shortcut past the header and side rail to the page's
 * main content. Visually hidden until focused.
 */
export default function SkipLink() {
  const t = useT();
  return (
    <a className="skip-link" href="#main-content">
      {t("skip_to_content")}
    </a>
  );
}
