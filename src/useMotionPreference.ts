import { useEffect, useState } from "react";

const storageKey = "erim-portfolio-motion";
const query = "(prefers-reduced-motion: reduce)";

function readPreference() {
  try { return window.localStorage.getItem(storageKey) !== "off"; }
  catch { return true; }
}

export function useMotionPreference() {
  const [enabled, setEnabled] = useState(readPreference);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const toggleMotion = () => {
    if (reducedMotion) return;
    const next = !enabled;
    setEnabled(next);
    try { window.localStorage.setItem(storageKey, next ? "on" : "off"); }
    catch { /* The control still works when browser storage is unavailable. */ }
  };

  return { motion: enabled && !reducedMotion, reducedMotion, toggleMotion };
}
