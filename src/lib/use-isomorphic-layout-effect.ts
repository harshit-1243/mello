import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect on the client (so GSAP set-up runs before paint, no FOUC),
 * useEffect on the server (avoids React's SSR warning).
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
