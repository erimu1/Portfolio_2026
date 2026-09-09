import { useCallback, useEffect, useRef, useState } from "react";

export type TransitionPhase = "idle" | "cover" | "reveal";

export type NavigationOptions = {
  /** Focus a section after arrival, for example the home page's social links. */
  focusId?: string;
  /** Browser navigation uses "none" to avoid creating another history entry. */
  history?: "push" | "replace" | "none";
};

type NavigationRequest<T extends string> = NavigationOptions & { target: T };

const COVER_DURATION = 350;
const REVEAL_DURATION = 500;

function readHash<T extends string>(initialView: T, views: readonly T[]): T | null {
  if (typeof window === "undefined") return initialView;
  const hash = window.location.hash.slice(1).replace(/^\//, "");
  if (!hash) return initialView;
  return views.find((view) => view === hash) ?? null;
}

/**
 * Render `view`; use `navigate` for every page link.
 * Give the page heading data-page-heading and tabIndex={-1}.
 * The fixed overlay uses page-transition--${phase}; see transitions.css.
 *
 * Valid URL hashes and browser Back/Forward are handled automatically.
 * Requests made during cover replace the pending destination; requests made
 * during reveal are queued, so rapid navigation never exposes a page swap.
 */
export function usePageTransition<T extends string>(
  initialView: T,
  motion: boolean,
  availableViews: readonly T[] = [initialView],
) {
  const [view, setView] = useState<T>(
    () => readHash(initialView, availableViews) ?? initialView,
  );
  const [targetView, setTargetView] = useState<T>(view);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const viewRef = useRef(view);
  const phaseRef = useRef<TransitionPhase>("idle");
  const viewsRef = useRef(availableViews);
  const motionRef = useRef(motion && !reducedMotion);
  const activeRequest = useRef<NavigationRequest<T> | null>(null);
  const queuedRequest = useRef<NavigationRequest<T> | null>(null);
  const timers = useRef<number[]>([]);
  const focusFrame = useRef<number | null>(null);
  const beginRef = useRef<(request: NavigationRequest<T>) => void>(() => {});

  viewsRef.current = availableViews;
  motionRef.current = motion && !reducedMotion;

  const clearScheduledWork = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    if (focusFrame.current !== null) {
      window.cancelAnimationFrame(focusFrame.current);
      focusFrame.current = null;
    }
  }, []);

  const focusDestination = useCallback((request: NavigationRequest<T>) => {
    if (focusFrame.current !== null) window.cancelAnimationFrame(focusFrame.current);
    // Wait for React to commit the destination before moving keyboard focus.
    focusFrame.current = window.requestAnimationFrame(() => {
      focusFrame.current = window.requestAnimationFrame(() => {
        focusFrame.current = null;
        const destination = (
          request.focusId ? document.getElementById(request.focusId) : null
        ) ?? document.querySelector<HTMLElement>("[data-page-heading], main h1");
        if (!destination) return;
        if (!destination.hasAttribute("tabindex")) destination.tabIndex = -1;
        destination.focus({ preventScroll: true });
        if (request.focusId) {
          destination.scrollIntoView({ block: "nearest", behavior: "instant" });
        }
      });
    });
  }, []);

  const commit = useCallback((request: NavigationRequest<T>) => {
    const changed = viewRef.current !== request.target;
    const historyMode = request.history ?? "push";
    if (historyMode !== "none" && (changed || historyMode === "replace")) {
      const url = new URL(window.location.href);
      url.hash = request.target === initialView ? "" : request.target;
      if (url.href !== window.location.href) {
        if (historyMode === "replace") {
          window.history.replaceState(window.history.state, "", url);
        } else {
          window.history.pushState(window.history.state, "", url);
        }
      }
    }
    viewRef.current = request.target;
    setView(request.target);
    setTargetView(request.target);
    if (changed) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [initialView]);

  const settleImmediately = useCallback((request?: NavigationRequest<T>) => {
    const destination = request ?? queuedRequest.current ?? activeRequest.current;
    clearScheduledWork();
    activeRequest.current = null;
    queuedRequest.current = null;
    phaseRef.current = "idle";
    if (destination) {
      commit(destination);
      focusDestination(destination);
    }
    setPhase("idle");
  }, [clearScheduledWork, commit, focusDestination]);

  const begin = useCallback((request: NavigationRequest<T>) => {
    if (!motionRef.current || request.target === viewRef.current) {
      settleImmediately(request);
      return;
    }

    clearScheduledWork();
    activeRequest.current = request;
    queuedRequest.current = null;
    phaseRef.current = "cover";
    setTargetView(request.target);
    setPhase("cover");

    timers.current.push(window.setTimeout(() => {
      const destination = activeRequest.current;
      if (!destination) return;
      commit(destination);
      phaseRef.current = "reveal";
      setPhase("reveal");

      timers.current.push(window.setTimeout(() => {
        const next = queuedRequest.current;
        queuedRequest.current = null;
        activeRequest.current = null;
        phaseRef.current = "idle";
        setPhase("idle");

        if (next && next.target !== viewRef.current) {
          beginRef.current(next);
        } else {
          focusDestination(next ?? destination);
        }
      }, REVEAL_DURATION));
    }, COVER_DURATION));
  }, [clearScheduledWork, commit, focusDestination, settleImmediately]);

  beginRef.current = begin;

  const navigate = useCallback((target: T, options: NavigationOptions = {}) => {
    if (!viewsRef.current.includes(target)) return;
    const request = { target, ...options };
    if (!motionRef.current) {
      settleImmediately(request);
    } else if (phaseRef.current === "cover") {
      activeRequest.current = request;
      setTargetView(target);
    } else if (phaseRef.current === "reveal") {
      queuedRequest.current = request;
    } else {
      begin(request);
    }
  }, [begin, settleImmediately]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    // Pausing decorative motion must never leave the navigation curtain closed.
    if ((!motion || reducedMotion) && phaseRef.current !== "idle") {
      settleImmediately();
    }
  }, [motion, reducedMotion, settleImmediately]);

  useEffect(() => {
    const onHistoryChange = () => {
      const destination = readHash(initialView, viewsRef.current);
      if (destination !== null) navigate(destination, { history: "none" });
    };
    window.addEventListener("popstate", onHistoryChange);
    window.addEventListener("hashchange", onHistoryChange);
    return () => {
      window.removeEventListener("popstate", onHistoryChange);
      window.removeEventListener("hashchange", onHistoryChange);
    };
  }, [initialView, navigate]);

  useEffect(() => clearScheduledWork, [clearScheduledWork]);

  return {
    view,
    targetView,
    phase,
    isTransitioning: phase !== "idle",
    navigate,
  };
}

