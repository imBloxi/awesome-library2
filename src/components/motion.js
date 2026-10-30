"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MOTION_CHOICES, MOTION_EVENT, MOTION_KEY, effectiveMotion, motionZone, normalizeMotionChoice } from "@/lib/motion-prefs.mjs";

const REDUCED = "(prefers-reduced-motion: reduce)";

function readChoice() {
  try {
    return normalizeMotionChoice(localStorage.getItem(MOTION_KEY));
  } catch {
    return "auto";
  }
}

// Keeps <html data-fx> right after client navigation, system changes and footer changes.
// The first value is set before paint by MOTION_BOOT_SCRIPT.
export function MotionController() {
  const pathname = usePathname();
  useEffect(() => {
    const media = window.matchMedia(REDUCED);
    const apply = () => {
      const choice = readChoice();
      const root = document.documentElement;
      root.dataset.motion = choice;
      root.dataset.fx = effectiveMotion({ choice, reduced: media.matches, zone: motionZone(pathname) });
    };
    apply();
    media.addEventListener("change", apply);
    window.addEventListener(MOTION_EVENT, apply);
    window.addEventListener("storage", apply);
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener(MOTION_EVENT, apply);
      window.removeEventListener("storage", apply);
    };
  }, [pathname]);
  return null;
}

const LABELS = { auto: "Auto", full: "Full", calm: "Calm", off: "Off" };
const HINTS = {
  auto: "Follows your system setting",
  full: "All animation",
  calm: "Feedback only",
  off: "No animation",
};

export function MotionSwitch() {
  const [choice, setChoice] = useState("auto");
  useEffect(() => {
    // Storage is only readable after mount; the server renders the default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(readChoice());
  }, []);

  function pick(value) {
    setChoice(value);
    try {
      localStorage.setItem(MOTION_KEY, value);
    } catch {}
    window.dispatchEvent(new Event(MOTION_EVENT));
  }

  return (
    <fieldset className="motion-switch">
      <legend>Motion</legend>
      <div className="motion-switch-options">
        {MOTION_CHOICES.map((value) => (
          <label key={value} title={HINTS[value]}>
            <input type="radio" name="motion" value={value} checked={choice === value} onChange={() => pick(value)} />
            <span>{LABELS[value]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// One listener for the whole page: the cover under the pointer leans toward it and its
// foil catches the light. Writes three CSS variables; CSS decides whether to use them.
export function PointerTilt() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let active = null;
    let frame = 0;
    let last = null;

    const reset = (el) => {
      el.style.removeProperty("--tilt-x");
      el.style.removeProperty("--tilt-y");
      el.style.removeProperty("--glint-x");
      el.style.removeProperty("--glint-y");
      el.removeAttribute("data-tilting");
    };

    const update = () => {
      frame = 0;
      if (!last) return;
      const cover = last.target instanceof Element ? last.target.closest(".book-cover[data-tilt]") : null;
      if (active && active !== cover) reset(active);
      active = cover;
      if (!cover || document.documentElement.dataset.fx !== "full") return;
      const r = cover.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (last.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (last.clientY - r.top) / r.height));
      cover.style.setProperty("--tilt-x", `${((0.5 - y) * 10).toFixed(2)}deg`);
      cover.style.setProperty("--tilt-y", `${((x - 0.5) * 14).toFixed(2)}deg`);
      cover.style.setProperty("--glint-x", `${(x * 100).toFixed(1)}%`);
      cover.style.setProperty("--glint-y", `${(y * 100).toFixed(1)}%`);
      cover.setAttribute("data-tilting", "");
    };

    const onMove = (e) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onLeave = () => {
      if (active) reset(active);
      active = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (active) reset(active);
    };
  }, []);
  return null;
}
