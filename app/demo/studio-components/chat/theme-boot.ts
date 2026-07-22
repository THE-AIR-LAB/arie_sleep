/** v2: greige/sepia is the default; explicit "1" enables black & white. */
export const MONO_PREF_KEY = "sleep-studio-mono-theme-v2";
/** Splash / auth-loading / document backdrop — match studio frame tokens. */
export const SPLASH_BG_MONO = "#ffffff";
export const SPLASH_BG_SEPIA = "#d8d6c7";
/**
 * Inline boot script: sets `html[data-ra-mono]` + document background from
 * localStorage before React paints, so the auth loader and studio splash don't
 * flash white when sepia is saved. Default is sepia unless the key is "1".
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem(${JSON.stringify(MONO_PREF_KEY)})==="1";document.documentElement.setAttribute("data-ra-mono",m?"1":"0");document.documentElement.style.backgroundColor=m?${JSON.stringify(SPLASH_BG_MONO)}:${JSON.stringify(SPLASH_BG_SEPIA)};}catch(e){}})();`;
