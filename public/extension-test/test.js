(() => {
  "use strict";
  const el = (id) => document.getElementById(id);
  const MAX_EVENTS = 300;
  let events = [], recording = true, startedAt = new Date().toISOString();
  let lastInput = Date.now(), lastTick = Date.now(), lastMove = 0, lastScroll = 0;
  let blurCount = 0, visibilityCount = 0, syntheticCount = 0, test = null;

  function snapshot() {
    return { visibility: document.visibilityState, hidden: document.hidden, focused: document.hasFocus() };
  }

  function log(type, details = {}) {
    if (!recording) return;
    events.unshift({ time: new Date().toISOString(), type, ...snapshot(), details });
    events.length = Math.min(events.length, MAX_EVENTS);
    const rows = events.slice(0, 70).map((event) => {
      const row = document.createElement("tr");
      [event.time.slice(11, 23), event.type, JSON.stringify({ visibility: event.visibility, focused: event.focused, ...event.details })].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      });
      return row;
    });
    el("events").replaceChildren(...rows);
  }

  function sampleTest(now) {
    if (!test) return;
    // Background scheduling may delay callbacks beyond the requested window.
    if (now < test.start) {
      el("test-status").textContent = `Switch tabs now. Sampling starts in ${Math.ceil((test.start - now) / 1000)}s…`;
      return;
    }
    const state = snapshot();
    test.samples++;
    if (state.hidden || state.visibility === "hidden") test.hidden++;
    if (!state.focused) test.unfocused++;
    if (now < test.end) {
      el("test-status").textContent = `Sampling… return after ${Math.ceil((test.end - now) / 1000)}s. Background timers may delay the result.`;
      return;
    }
    const result = { ...test, completedAt: now };
    log("test-result", result);
    el("test-status").textContent = result.hidden || result.unfocused
      ? `Activity signals observed: ${result.hidden} hidden / ${result.unfocused} unfocused out of ${result.samples} samples. See exported data for timing.`
      : "No hidden or unfocused samples observed. If you switched away, the page’s signals did not reflect that action. This result is inconclusive about other sites.";
    test = null;
    el("away").disabled = false;
    el("pause").disabled = false;
  }

  function render(now, delay) {
    const state = snapshot();
    el("visibility").textContent = state.visibility;
    el("hidden").textContent = String(state.hidden);
    el("focus").textContent = state.focused ? "Focused" : "Unfocused";
    el("idle").textContent = `${Math.max(0, Math.floor((now - lastInput) / 1000))}s`;
    el("timer").textContent = `${Math.round(delay)} ms`;
    el("blur-count").textContent = blurCount;
    el("visibility-count").textContent = visibilityCount;
    el("synthetic-count").textContent = syntheticCount;
  }

  document.addEventListener("visibilitychange", (event) => {
    if (!recording) return;
    visibilityCount++;
    log("visibilitychange", { trusted: event.isTrusted });
    sampleTest(Date.now());
    render(Date.now(), 0);
  });
  ["focus", "blur", "pageshow", "pagehide"].forEach((type) => window.addEventListener(type, (event) => {
    if (!recording) return;
    if (type === "blur") blurCount++;
    log(type, { trusted: event.isTrusted });
    sampleTest(Date.now());
    render(Date.now(), 0);
  }));
  ["pointerdown", "pointermove", "keydown", "paste", "scroll"].forEach((type) => document.addEventListener(type, (event) => {
    if (!recording) return;
    const now = Date.now();
    lastInput = now;
    if (!event.isTrusted) syntheticCount++;
    if (type === "pointermove") {
      if (now - lastMove < 1000) return;
      lastMove = now;
    }
    if (type === "scroll") {
      if (now - lastScroll < 1000) return;
      lastScroll = now;
    }
    log(type, { trusted: event.isTrusted });
  }, { capture: true, passive: true }));

  el("away").addEventListener("click", () => {
    if (!recording) return;
    const now = Date.now();
    test = { start: now + 3000, end: now + 18000, samples: 0, hidden: 0, unfocused: 0 };
    el("away").disabled = true;
    el("pause").disabled = true;
    log("test-start", { countdownSeconds: 3, sampleSeconds: 15 });
    sampleTest(now);
  });
  el("pause").addEventListener("click", () => {
    if (recording) log("recording-paused");
    recording = !recording;
    el("pause").textContent = recording ? "Pause recording" : "Resume recording";
    el("recording").textContent = recording ? "● Recording" : "○ Paused";
    el("away").disabled = !recording;
    lastTick = Date.now();
    if (recording) log("recording-resumed");
  });
  el("reset").addEventListener("click", () => {
    events = [];
    blurCount = visibilityCount = syntheticCount = 0;
    lastInput = lastTick = Date.now();
    lastMove = lastScroll = 0;
    startedAt = new Date().toISOString();
    test = null;
    el("pause").disabled = false;
    el("away").disabled = !recording;
    el("test-status").textContent = "Ready when you are.";
    el("events").replaceChildren();
    log("session-reset");
    render(lastTick, 0);
  });
  el("export").addEventListener("click", () => {
    const data = { label: el("label").value, startedAt, exportedAt: new Date().toISOString(), recording,
      limits: { maxRetainedEvents: MAX_EVENTS, inputContentsRecorded: false, verdict: "No Datorium detection rules verified" },
      current: snapshot(), counts: { blurCount, visibilityCount, syntheticCount }, activeTest: test, events };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `signal-lab-${Date.now()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  log("session-start");
  render(Date.now(), 0);
  setInterval(() => {
    const now = Date.now();
    const delay = Math.max(0, now - lastTick - 1000);
    lastTick = now;
    if (!recording) return;
    if (delay > 1500) log("timer-delay", { delayMs: delay });
    sampleTest(now);
    render(now, delay);
  }, 1000);
})();
