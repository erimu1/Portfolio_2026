import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Pause, Play, X } from "lucide-react";
import Projects from "./Projects";
import Contact from "./Contact";
import ScrambleName from "./ScrambleName";
import { profile } from "./profile";
import { usePageTransition } from "./usePageTransition";
import "./transitions.css";

type View = "home" | "projects" | "about" | "contact";
const views: readonly View[] = ["home", "projects", "about", "contact"];
const phaseLabels = ["Observe", "Explore", "Build", "Glorious Evolution"];
const pageLabels = { home: "Home", projects: "Projects", about: "About", contact: "Contact" };
// Replace platform URLs with personal profiles when supplied.
const socialLinks = [
  { name: "LinkedIn", url: "https://www.linkedin.com/", detail: "Let's connect" },
  { name: "GitHub", url: "https://github.com/erimu1", detail: "Explore the code" },
];

function Logo({ onClick }: { onClick: () => void }) {
  const filterId = useId();
  return <button className="logo" onClick={onClick} aria-label="Erim Uludag home">
    <svg className="logo-art" viewBox="0 0 350 199" role="img" aria-label="EU with smiling daisies">
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          {/* Remove the black matte from alpha without darkening the edge colours. */}
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1 0 0 0 1" result="blackMatte" />
          <feComposite in="SourceGraphic" in2="blackMatte" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0" />
        </filter>
      </defs>
      <image href="./logo.png" width="350" height="199" filter={`url(#${filterId})`} />
    </svg>
  </button>;
}

function App() {
  const [motion, setMotion] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [menuOpen, setMenuOpen] = useState(false);
  const { view, navigate, phase, isTransitioning } = usePageTransition<View>("home", motion, views);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigation = [
    { label: "Home", description: "Back to the beginning", target: "home" as View },
    { label: "Projects", description: "A selection of ideas", target: "projects" as View },
    { label: "About", description: "A little about me", target: "about" as View },
    { label: "Connect", description: "Start a conversation", target: "contact" as View },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const menu = menuRef.current;
    menu?.querySelector<HTMLButtonElement>(".nav-card")?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setMenuOpen(false); }
      if (event.key !== "Tab" || !menu) return;
      const controls = Array.from(menu.querySelectorAll<HTMLElement>("button, a[href]"));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; previous?.focus({ preventScroll: true }); };
  }, [menuOpen]);

  useEffect(() => {
    document.title = `Erim Uludag — ${view === "home" ? "Creative portfolio" : view === "projects" ? "Projects" : view === "about" ? "About" : "Contact"}`;
  }, [view]);

  const go = (target: View, focusId?: string) => {
    setMenuOpen(false);
    navigate(target, focusId ? { focusId } : undefined);
  };

  return <main className={`portfolio view-${view} ${motion ? "motion-on" : "motion-off"}`}>
    <div className="canvas">
      <header className="site-header" inert={menuOpen || isTransitioning}>
        <Logo onClick={() => go("home")} />
        <p className="header-signature">DATA, CODE<br /><span>& A LITTLE CURIOSITY.</span></p>
        <div className="header-controls">
          <button className="header-contact" onClick={() => go("contact")}>Let's talk <ArrowUpRight size={15} aria-hidden="true" /></button>
          <button className="motion-button" onClick={() => setMotion(!motion)} aria-label={motion ? "Pause animations" : "Play animations"} aria-pressed={!motion}>
            {motion ? <Pause size={13} /> : <Play size={13} />}<span>{motion ? "Motion on" : "Motion off"}</span>
          </button>
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="navigation">
            <span>Menu</span><span className="menu-lines" aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </header>
      <div className="page-content" inert={menuOpen || isTransitioning}>
        {view === "home" && <section className="home-screen screen" aria-label="Home">
          <p className="vertical-label">DESIGNED TO EXPLORE. GLORIOUS EVOLUTION.</p>
          <div className="phase-row" aria-label="Four stages of a creative process">
            {[360, 270, 180, 90].map((fill, index) => <div key={fill} className={`phase phase-${index}`} style={{ "--fill": `${fill}deg`, "--phase-delay": `${180 + index * 150}ms` } as CSSProperties} role="img" aria-label={`${phaseLabels[index]}: ${["full", "three-quarter", "half", "quarter"][index]} circle`}>
              <div className="phase-disc" aria-hidden="true" />
              {index === 1 && <svg className="orbit-art" viewBox="0 0 130 130" aria-hidden="true"><path d="M27 17A61 61 0 0 1 118 39M103 113A61 61 0 0 1 12 91" /><path d="m113 36 5 3 1-6M17 94l-5-3-1 6" /></svg>}
              <span className="phase-caption" aria-hidden="true"><span>0{index + 1}</span><span>{phaseLabels[index]}</span></span>
            </div>)}
          </div>
          <div className="home-bottom">
            <div className="name-block">
              <p className="eyebrow"><span className="eyebrow-rule" aria-hidden="true" />DATA SCIENCE & CREATIVE DEVELOPMENT</p>
              <h1 data-page-heading tabIndex={-1} aria-label="Erim Uludag"><ScrambleName motion={motion} /></h1>
              <div className="home-caption"><span>Curiosity, shaped into digital experiences.</span><span className="location"><i aria-hidden="true" />{profile.city}, NL</span></div>
            </div>
            <div className="corner-content">
              <button className="explore-arrow" onClick={() => go("projects")} aria-label="Explore projects">
                <svg viewBox="0 0 224 112" aria-hidden="true"><path fill="currentColor" d="M101 0H209a14 14 0 0 1 0 28H106a13 13 0 0 0-9 3L59 64c-9 8-3 21 8 21h22a13.5 13.5 0 0 1 0 27H14A14 14 0 0 1 0 98V35c0-8 5-12 11-17 9-8 20-1 20 9 0 12 13 17 22 9L91 4a15 15 0 0 1 10-4Z" /></svg>
                <span>Explore projects <span aria-hidden="true">↗</span></span>
              </button>
              <div className="social-links" id="links" tabIndex={-1} aria-label="Social links">
                {socialLinks.map(({ name, url, detail }) => <a key={name} href={url} target="_blank" rel="noreferrer" aria-label={`Open ${name} in a new tab`}>
                  {name === "LinkedIn" ? <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.4 7.5H1.2V22h4.2V7.5ZM3.3 1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM22.8 13.7c0-4.4-2.3-6.5-5.4-6.5-2.5 0-3.6 1.4-4.2 2.3v-2H9V22h4.2v-8.1c0-2.1.4-4.1 3-4.1s2.6 2.4 2.6 4.2v8h4V13.7Z" /></svg> : <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.55v-2.14c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.03 1.78 2.71 1.27 3.37.97.1-.75.4-1.27.73-1.56-2.57-.29-5.27-1.29-5.27-5.73 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.16 1.18a10.98 10.98 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.6.23 2.78.12 3.07.74.8 1.18 1.83 1.18 3.09 0 4.45-2.71 5.44-5.29 5.72.42.36.79 1.06.79 2.14v3.16c0 .31.21.67.8.55A11.5 11.5 0 0 0 12 .7Z" /></svg>}
                  <span className="social-copy"><strong>{name}</strong><small>{detail}</small></span>
                  <ArrowUpRight className="social-arrow" size={17} strokeWidth={1.5} />
                </a>)}
              </div>
            </div>
          </div>
        </section>}
        {view === "projects" && <Projects motion={motion} onHome={() => go("home")} onNext={() => go("about")} />}
        {view === "about" && <section className="about-screen screen" aria-label="About Erim">
          <div className="about-topline"><span className="eyebrow">A LITTLE ABOUT ME</span><span className="eyebrow">DESIGN + DEVELOPMENT</span></div>
          <h1 data-page-heading tabIndex={-1}>Curious by nature.<br /><span>Creative by code.</span></h1>
          <div className="about-bottom">
            <div className="about-aside"><div className="about-mark" aria-hidden="true"><span /><span /><span /><span /></div><p className="about-aside-note">CONNECTING THE DOTS<br />BETWEEN DATA & DESIGN.</p><div className="about-disciplines"><span>Data science</span><span>Machine learning</span><span>Creative development</span></div></div>
            <div className="about-copy"><p>I'm Erim Uludag, a student based in {profile.city}. I explore where data, code, and design meet.</p><p>A space to experiment, build, and pursue a glorious evolution.</p><div className="education-detail"><span>BACHELOR'S DEGREE</span><strong>{profile.degree}</strong><span>{profile.school}</span></div><button className="text-link" onClick={() => go("contact")}>Let's connect <ArrowUpRight size={20} /></button></div>
          </div>
        </section>}
        {view === "contact" && <Contact />}
      </div>
      <footer inert={menuOpen || isTransitioning}><span>ERIM ULUDAG © {new Date().getFullYear()}</span><nav className="page-index" aria-label="Page shortcuts">{views.map(target => <button key={target} onClick={() => go(target)} aria-label={`Go to ${pageLabels[target]}`} aria-current={view === target ? "page" : undefined}><span /></button>)}</nav><span>{view === "home" ? "01 — HOME" : view === "projects" ? "02 — PROJECTS" : view === "about" ? "03 — ABOUT" : "04 — CONTACT"}</span></footer>
      {menuOpen && <div ref={menuRef} className="navigation-overlay" id="navigation" role="dialog" aria-modal="true" aria-label="Main navigation">
        <div className="navigation-header"><Logo onClick={() => go("home")} /><button className="menu-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><span>Close</span><X size={16} /></button></div>
        <nav className="navigation-screen" aria-label="Main navigation">
          {navigation.map((item, index) => <button key={item.label} className="nav-card" onClick={() => go(item.target)} style={{ "--i": index } as CSSProperties} aria-current={item.target === view ? "page" : undefined}>
            <span className="card-number">0{index + 1}</span><span className="card-label">{item.label}</span><ArrowUpRight className="card-arrow" aria-hidden="true" /><span className="card-description">{item.description}</span>
          </button>)}
        </nav>
        <p className="navigation-caption">A little curiosity can take you somewhere new.</p>
      </div>}
      <div className={`page-transition page-transition--${phase}`} aria-hidden="true"><span className="page-transition__panel page-transition__panel--green" /><span className="page-transition__panel page-transition__panel--orange" /></div>
    </div>
  </main>;
}

export default App;
