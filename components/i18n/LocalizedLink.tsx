"use client";

import { forwardRef } from "react";
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { localizeHref } from "@/lib/i18n-core";

type NextLinkProps = ComponentProps<typeof NextLink>;

/**
 * A drop-in `next/link` that prefixes internal, app-absolute hrefs with the
 * current locale ("/canton/be" → "/de/canton/be" for a German visitor; English
 * stays unprefixed). Without this, links relied on the proxy's cookie redirect
 * — one extra hop per navigation and weaker within-locale internal linking for
 * crawlers. Left untouched: external URLs, hashes, mailto/tel, query-only or
 * object hrefs, and paths already carrying a locale segment.
 */
const LocalizedLink = forwardRef<HTMLAnchorElement, NextLinkProps>(
  function LocalizedLink({ href, ...props }, ref) {
    const { locale } = useLanguage();
    return <NextLink href={localizeHref(href, locale)} ref={ref} {...props} />;
  },
);

export default LocalizedLink;
