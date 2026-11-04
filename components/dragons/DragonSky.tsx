"use client";
// Toothless and Light Fury flying over Berk, as a sky banner at the top of the
// Dashboard page in the Dragons style (Faizuddin, 2026-10-29). Its own strip,
// not behind the widgets: with Jira data the cards fill the page and would
// hide the dragons, and dragons crossing text made it hard to read (checked
// in a screenshot the same day). Pixel sprites from public/dragons/, motion in
// app/styles/dragons/home.css. Renders nothing in the other styles.
import { useEffect, useState } from "react";

export default function DragonSky() {
  const [on, setOn] = useState(false);

  // data-style is set on <html> by lib/themes.ts after the shell starts.
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setOn(root.getAttribute("data-style") === "dragons");
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["data-style"] });
    const first = setTimeout(read, 0);
    return () => { clearTimeout(first); obs.disconnect(); };
  }, []);

  if (!on) return null;
  return (
    <div className="dragon-sky" aria-hidden>
      <div className="dragon-path dragon-path--toothless"><div className="dragon dragon--toothless" /></div>
      <div className="dragon-path dragon-path--lightfury"><div className="dragon dragon--lightfury" /></div>
    </div>
  );
}
