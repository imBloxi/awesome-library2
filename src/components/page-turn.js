import { Suspense, ViewTransition } from "react";

// Pages slide like turned pages: forward links go left, back links go right.
// Untyped navigations (browser back, refresh, search updates) don't slide.
const TURN = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

export const FORWARD = ["nav-forward"];
export const BACK = ["nav-back"];

export function PageTurn({ children }) {
  return (
    <ViewTransition enter={TURN} exit={TURN} default="none">
      <div className="page-turn">{children}</div>
    </ViewTransition>
  );
}

// Suspense whose handoff is animated: the placeholder steps down and out, the content rises in.
export function RevealSuspense({ fallback, children }) {
  return (
    <Suspense fallback={<ViewTransition exit="slide-down" default="none"><div>{fallback}</div></ViewTransition>}>
      <ViewTransition enter="slide-up" default="none"><div>{children}</div></ViewTransition>
    </Suspense>
  );
}
