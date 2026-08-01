"use client";

import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import Link from "@/components/i18n/LocalizedLink";
import { settingsHref } from "@/lib/settings-navigation";

type SettingsLinkProps = Omit<ComponentProps<typeof Link>, "href">;

/** A Settings route link that carries an explicit in-app return target. */
export default function SettingsLink(props: SettingsLinkProps) {
  return <Link href={settingsHref(usePathname() ?? "/")} {...props} />;
}
