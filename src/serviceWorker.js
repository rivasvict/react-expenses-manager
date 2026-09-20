// Registers the workbox-generated service worker (build/service-worker.js,
// produced by the "postbuild" script from workbox-config.js) so the app
// shell can be opened with zero network connectivity once it has loaded at
// least once. See docs/deployment/tailscale-sync.md for the deployment
// context (secure-context requirement satisfied via the *.ts.net origin).
//
// react-scripts@^5 does not auto-generate a service worker for a plain
// (non-PWA-template) CRA app, so this only registers something real once
// `npm run build` has produced build/service-worker.js via the postbuild
// hook — it is a no-op in development (`npm start`).
import { Workbox } from "workbox-window";

export const register = () => {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const wb = new Workbox(`${process.env.PUBLIC_URL}/service-worker.js`);
    wb.register().catch((error) => {
      console.error("Error during service worker registration:", error);
    });
  });
};

export const unregister = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
};
