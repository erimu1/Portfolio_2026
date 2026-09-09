import { useEffect, useState } from "react";

const name = "ERIM ULUDAG";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function ScrambleName({ motion }: { motion: boolean }) {
  const [display, setDisplay] = useState(name);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let start = 0;
    let lastUpdate = -80;
    const finish = () => { cancelAnimationFrame(frame); setDisplay(name); };
    const tick = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      if (elapsed >= 1700) { setDisplay(name); return; }
      if (elapsed - lastUpdate >= 65) {
        lastUpdate = elapsed;
        setDisplay(Array.from(name, (letter, index) => {
          if (letter === " " || elapsed > 350 + index * 115) return letter;
          return alphabet[Math.floor(Math.random() * alphabet.length)];
        }).join(""));
      }
      frame = requestAnimationFrame(tick);
    };
    const onPreference = () => { if (preference.matches) finish(); };
    if (motion && !preference.matches) frame = requestAnimationFrame(tick);
    else setDisplay(name);
    preference.addEventListener("change", onPreference);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener("change", onPreference); };
  }, [motion]);

  return <span className="scramble-name" aria-hidden="true">{Array.from(name, (letter, index) =>
    <span className={`scramble-letter ${letter === " " ? "scramble-space" : ""}`} key={index}>
      <span className="scramble-measure">{letter === " " ? "\u00a0" : letter}</span>
      <span className="scramble-display">{display[index]}</span>
    </span>
  )}</span>;
}
