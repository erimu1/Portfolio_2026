import { type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import "./projects.css";

export default function Projects({ motion, onHome, onNext }: { motion: boolean; onHome: () => void; onNext: () => void }) {
  return <section className={`projects-screen ${motion ? "projects-motion" : "projects-still"}`} aria-label="Projects">
    <div className="projects-heading">
      <h1 data-page-heading tabIndex={-1}>Projects</h1>
      <span><i aria-hidden="true" /> IN THE MAKING</span>
    </div>
    <div className="project-gallery" aria-hidden="true">
      {[0, 1, 2, 3].map(index => <div className="project-slot" key={index} style={{ "--i": index } as CSSProperties}>
        <div className="project-card"><div className="project-card-surface" /></div>
      </div>)}
    </div>
    <div className="projects-pagination">
      <button className="project-home-link" onClick={onHome}>Back home</button>
      <button className="projects-next" onClick={onNext}><span className="projects-arrow-circle"><ArrowRight size={22} strokeWidth={3} /></span><span className="projects-next-label">Next page</span></button>
      <span className="project-page-note">GOOD THINGS TAKE SHAPE.</span>
    </div>
  </section>;
}
