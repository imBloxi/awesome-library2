"use client";

import { useEffect, useState } from "react";

function browserLabel(ua) {
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Unknown browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "unknown system";
  return `${browser} on ${os}`;
}

// What this page can read about the visitor right now, straight from the browser.
// Read after mount; nothing here is sent anywhere. `stored` marks what the sign-in
// itself records with the session.
function observe() {
  const nav = window.navigator;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [
    { label: "Device", value: browserLabel(nav.userAgent), stored: true, note: "user agent" },
    { label: "Network address", value: "Visible to the server on every request", stored: true, note: "IP address, when the sign-in service receives it" },
    { label: "Language", value: nav.languages?.slice(0, 3).join(", ") || nav.language || "Not reported" },
    { label: "Time zone", value: tz || "Not reported" },
    { label: "Local time", value: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    { label: "Screen", value: `${window.screen.width} × ${window.screen.height} at ${window.devicePixelRatio || 1}×` },
    { label: "Connection", value: window.isSecureContext ? "Encrypted (HTTPS)" : "Not encrypted" },
    { label: "Cookies", value: nav.cookieEnabled ? "Enabled. Signing in sets one session cookie." : "Blocked. Signing in needs one session cookie." },
    { label: "Global Privacy Control", value: nav.globalPrivacyControl ? "On" : "Off or not supported" },
  ];
}

export function ObservationPanel({ title = "Observed on this connection" }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    // Browser-only values: read once after hydration so server and client render alike.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(observe());
  }, []);
  return (
    <aside className="ctos-panel ctos-observe" aria-labelledby="observe-heading">
      <p className="ctos-label">Passive observation</p>
      <h2 id="observe-heading" className="ctos-panel-title">{title}</h2>
      <dl className="ctos-readout">
        {(rows ?? observe.placeholder).map((row, i) => (
          <div key={row.label} className="ctos-readout-row" style={{ "--i": i }}>
            <dt>{row.label}</dt>
            <dd>
              {rows ? row.value : <span className="ctos-pending">Reading…</span>}
              {row.stored && <span className="ctos-flag" title={`Stored with your session: ${row.note}`}>Stored</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="ctos-fine">
        Items marked Stored are kept with your session when you sign in. Everything else is only visible to this page and is not sent.
        {" "}<a href="/legal/privacy#record">What ctOS records</a>
      </p>
    </aside>
  );
}
observe.placeholder = ["Device", "Network address", "Language", "Time zone", "Local time", "Screen", "Connection", "Cookies", "Global Privacy Control"].map((label) => ({ label }));
