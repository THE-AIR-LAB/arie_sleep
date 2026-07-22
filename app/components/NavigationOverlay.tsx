"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SiteLogo from "./SiteLogo";
import {
  MONO_PREF_KEY,
  SPLASH_BG_MONO,
  SPLASH_BG_SEPIA,
} from "../demo/studio-components/chat/constants";

function applyBootThemeFromStorage() {
  try {
    const mono = window.localStorage.getItem(MONO_PREF_KEY) === "1";
    document.documentElement.setAttribute("data-ra-mono", mono ? "1" : "0");
    document.documentElement.style.backgroundColor = mono
      ? SPLASH_BG_MONO
      : SPLASH_BG_SEPIA;
  } catch {
    // ignore
  }
}

export default function NavigationOverlay() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      // Skip external links, anchors-only, or new-tab links
      if (anchor.target === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto")) return;

      const newPath = href.split("?")[0].split("#")[0];
      const currentPath = window.location.pathname;

      if (newPath !== currentPath) {
        // Sync sepia/mono before paint so the overlay isn’t stuck white.
        applyBootThemeFromStorage();
        setIsVisible(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Hide when the new page finishes rendering
  useEffect(() => {
    setIsVisible(false);
  }, [pathname]);

  if (!isVisible) return null;

  // Match StudioSplash / StudioLoading — backdrop follows html[data-ra-mono]
  // (set by demo THEME_BOOT_SCRIPT / studio mono toggle) so sepia doesn’t flash white.
  return (
    <div className="studio-boot-bg fixed inset-0 z-[9999] flex items-center justify-center">
      <SiteLogo size={120} href={false} />
    </div>
  );
}
