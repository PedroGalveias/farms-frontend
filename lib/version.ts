// The deployed build version, injected at build time by next.config.ts
// (from a tag / commit, see resolveAppVersion there). "dev" when running
// outside a built/deployed context.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

/** The site is pre-1.0 and labelled Beta across the UI. */
export const IS_BETA = true;
