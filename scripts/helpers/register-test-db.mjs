import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/cache") {
      return { url: new URL("./next-cache-stub.mjs", import.meta.url).href, shortCircuit: true };
    }
    if (specifier === "@/lib/db") {
      return { url: new URL("./test-db.mjs", import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith("@/")) {
      const path = specifier.includes(".") ? specifier.slice(2) : `${specifier.slice(2)}.js`;
      return nextResolve(new URL(`../../src/${path}`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});
