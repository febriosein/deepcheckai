"use client";

import { useEffect } from "react";

export function SuppressDevtools() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cleanup = () => {
      // Find all nextjs portal and overlay elements
      const devElements = document.querySelectorAll(
        "nextjs-portal, script[data-nextjs-dev-overlay], [data-nextjs-dev-overlay], [data-nextjs-toast], [data-nextjs-dialog-overlay]"
      );
      devElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.setProperty("display", "none", "important");
        htmlEl.style.setProperty("visibility", "hidden", "important");
        htmlEl.style.setProperty("opacity", "0", "important");
        htmlEl.style.setProperty("pointer-events", "none", "important");
        try {
          if (htmlEl.parentElement && htmlEl.parentElement !== document.body) {
            htmlEl.remove();
          }
        } catch {
          // ignore
        }
      });
    };

    cleanup();

    const observer = new MutationObserver((mutations) => {
      let needsCleanup = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              ((node as Element).tagName?.toLowerCase() === "nextjs-portal" ||
                (node as Element).hasAttribute?.("data-nextjs-dev-overlay") ||
                (node as Element).querySelector?.("nextjs-portal, [data-nextjs-dev-overlay]"))
            ) {
              needsCleanup = true;
              break;
            }
          }
        }
        if (needsCleanup) break;
      }
      if (needsCleanup) cleanup();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
