const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "visible.js"), "utf8");

function setup() {
  class Document {
    get hidden() { return true; }
    get visibilityState() { return "hidden"; }
    hasFocus() { return false; }
  }
  const document = new Document();
  const handlers = new Map();
  const window = { addEventListener(type, callback, options) { handlers.set(type, { callback, options }); } };
  vm.runInNewContext(source, { Document, document, window });
  return { Document, document, window, handlers };
}

test("page API reads report visible and focused while underlying getters were hidden", () => {
  const { Document, document } = setup();
  assert.equal(document.hidden, false);
  assert.equal(document.visibilityState, "visible");
  assert.equal(document.hasFocus(), true);
  assert.equal("webkitHidden" in document, false);
  const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, "hidden");
  assert.equal(descriptor.configurable, true);
  assert.equal(descriptor.enumerable, false);
});

test("capture handlers suppress page-state events but preserve element focus", () => {
  const { document, window, handlers } = setup();
  for (const [type, { callback, options }] of handlers) {
    assert.equal(options.capture, true);
    for (const target of [window, document]) {
      let stopped = false;
      callback({ target, stopImmediatePropagation() { stopped = true; } });
      assert.equal(stopped, true, type);
    }
    callback({ target: { tagName: "INPUT" }, stopImmediatePropagation() { assert.fail("Element event suppressed"); } });
  }
  assert.equal(handlers.has("keydown"), false);
  assert.equal(handlers.has("pointermove"), false);
  assert.equal(handlers.has("pagehide"), false);
});

test("manifest uses early page-world injection with a bounded target scope", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
  const script = manifest.content_scripts[0];
  assert.equal(script.run_at, "document_start");
  assert.equal(script.world, "MAIN");
  assert.equal(script.matches.length, 4);
  assert.equal(script.matches.includes("<all_urls>"), false);
  for (const file of script.js) assert.ok(fs.existsSync(path.join(__dirname, file)));
});
