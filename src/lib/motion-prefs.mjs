// How much the interface moves. The member picks a choice; the page applies an effective level.
//   auto: follow the system setting; calm in admin, full elsewhere.
//   full: everything. calm: feedback only (no tilt, no ambient motion). off: no animation.
// The effective level is written to <html data-fx="…"> and CSS keys off that one attribute.

export const MOTION_KEY = "library:motion";
export const MOTION_CHOICES = ["auto", "full", "calm", "off"];
export const MOTION_EVENT = "library:motion";

export function normalizeMotionChoice(value) {
  return MOTION_CHOICES.includes(value) ? value : "auto";
}

// Admin is calm by default: staff repeat the same actions all day.
export function motionZone(pathname) {
  return typeof pathname === "string" && (pathname === "/admin" || pathname.startsWith("/admin/")) ? "calm" : null;
}

export function effectiveMotion({ choice, reduced = false, zone = null } = {}) {
  const c = normalizeMotionChoice(choice);
  if (c !== "auto") return c;
  if (reduced) return "off";
  return zone === "calm" ? "calm" : "full";
}

// Runs in <head> before first paint so the page never flashes the wrong level.
// Kept self-contained (no imports); scripts/test-motion-prefs.mjs checks it agrees with effectiveMotion.
export const MOTION_BOOT_SCRIPT = `(function(){var c;try{c=localStorage.getItem(${JSON.stringify(MOTION_KEY)})}catch(e){}
var ok={auto:1,full:1,calm:1,off:1};c=ok[c]?c:"auto";var d=document.documentElement,p=location.pathname;
var r=false;try{r=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
var z=p==="/admin"||p.indexOf("/admin/")===0;d.dataset.motion=c;
d.dataset.fx=c!=="auto"?c:r?"off":z?"calm":"full"})()`;
