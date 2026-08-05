// Applies the theme class before paint so there is no flash of the wrong theme,
// plus the force-motion class (the user's "always animate" override of the OS
// reduced-motion setting — see lib/motion.ts) so animations don't flash-freeze.
//
// Modes: light/dark are explicit; system asks the media query; sun replays the
// LAST RESOLVED theme ("farms.theme", kept fresh by ThemeProvider) and the
// provider re-resolves right after mount — worst case is a brief stale theme
// after a sunrise/sunset passed while away, never a flash.
//
// Shared by app/[lang]/layout.tsx and app/global-not-found.tsx, which renders
// outside that layout and would otherwise need its own copy.
export const THEME_SCRIPT = `(function(){try{var m=localStorage.getItem("farms.themeMode");var t=localStorage.getItem("farms.theme");var dark;if(m==="dark"){dark=true}else if(m==="light"){dark=false}else if(m==="system"){dark=window.matchMedia("(prefers-color-scheme: dark)").matches}else if(m==="sun"){dark=t==="dark"}else{dark=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)}if(dark){document.documentElement.classList.add("dark")}if(localStorage.getItem("farms.motion")==="on"){document.documentElement.classList.add("force-motion")}}catch(e){}})();`;
