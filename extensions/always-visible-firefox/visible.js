(() => {
  "use strict";

  function overrideGetter(name, value) {
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, name);
    if (!descriptor || !descriptor.configurable) return;
    Object.defineProperty(Document.prototype, name, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get() { return value; },
    });
  }

  overrideGetter("hidden", false);
  overrideGetter("visibilityState", "visible");
  // Only override legacy aliases if the browser already exposes them.
  overrideGetter("webkitHidden", false);
  overrideGetter("webkitVisibilityState", "visible");

  const focusDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "hasFocus");
  if (focusDescriptor?.configurable) {
    Object.defineProperty(Document.prototype, "hasFocus", {
      ...focusDescriptor,
      value: function hasFocus() { return true; },
    });
  }

  // Preserve focus changes between controls: only intercept document/window events.
  const stopPageStateEvent = (event) => {
    if (event.target === window || event.target === document) {
      event.stopImmediatePropagation();
    }
  };
  for (const type of ["visibilitychange", "webkitvisibilitychange", "blur", "focusout"]) {
    window.addEventListener(type, stopPageStateEvent, { capture: true });
  }
})();
