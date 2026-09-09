import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Image, Mail, MapPin, Phone } from "lucide-react";
import { profile } from "./profile";
import "./contact.css";

export default function Contact() {
  const [copyStatus, setCopyStatus] = useState("");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopyStatus("Email copied");
    } catch {
      setCopyStatus("Select the email address to copy it, or click it to open your mail app.");
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyStatus(""), 4000);
  };
  return <section className="contact-screen screen" aria-label="Contact">
    <div className="contact-topline"><span className="eyebrow">A CONVERSATION STARTS HERE</span><span className="eyebrow">SCHIEDAM, NL</span></div>
    <div className="contact-layout">
      <div className="contact-copy">
        <h1 data-page-heading tabIndex={-1}>Let's<br /><span>connect.</span></h1>
        <p className="contact-intro">An idea, a question, or just a hello.<br />There's always room for a conversation.</p>
        <div className="contact-details">
          <div className="contact-row"><Mail size={20} strokeWidth={1.4} /><div><span className="contact-label">EMAIL</span>{profile.email ? <a href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={18} /></a> : <span className="contact-placeholder">Email coming soon</span>}</div>{profile.email && <button className="copy-email" onClick={copyEmail} aria-label={copyStatus === "Email copied" ? "Email copied" : "Copy email address"} title="Copy email address">{copyStatus === "Email copied" ? <Check size={16} /> : <Copy size={16} />}</button>}</div>
          <div className="contact-row"><Phone size={20} strokeWidth={1.4} /><div><span className="contact-label">PHONE</span>{profile.phone ? <a href={`tel:${profile.phoneHref}`}>{profile.phone}<ArrowUpRight size={18} /></a> : <span className="contact-placeholder">Phone coming soon</span>}</div></div>
          <div className="contact-row"><MapPin size={20} strokeWidth={1.4} /><div><span className="contact-label">BASED IN</span><span>{profile.city}, the Netherlands</span></div></div>
        </div>
        <p className="copy-status" role="status">{copyStatus}</p>
      </div>
      <figure className="contact-portrait">
        <div className="portrait-frame">
          {profile.portraitSrc ? <img src={profile.portraitSrc} alt={profile.name} /> : <div className="portrait-placeholder" role="img" aria-label="Space for a portrait of Erim Uludag"><span className="portrait-corner portrait-corner-top" /><span className="portrait-corner portrait-corner-bottom" /><Image size={30} strokeWidth={1} aria-hidden="true" /><span>PORTRAIT SPACE</span></div>}
          <span className="portrait-index" aria-hidden="true">EU / 01</span>
        </div>
        <figcaption><span>{profile.name}</span><span>DATA, CODE & CURIOSITY</span></figcaption>
      </figure>
    </div>
  </section>;
}
