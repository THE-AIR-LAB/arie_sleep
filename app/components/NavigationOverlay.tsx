"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SiteLogo from "./SiteLogo";

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

  // Match StudioSplash / StudioLoading so assistant selection doesn’t flash the
  // old cream bouncing-dots loader before the studio entry screen.
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <SiteLogo size={120} href={false} />
    </div>
  );
}
