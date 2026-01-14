export function getRoute() {
  const h = location.hash || "#/";
  const route = h.replace(/^#/, "");
  return route;
}

export function onRouteChange(cb) {
  window.addEventListener("hashchange", cb);
  window.addEventListener("load", cb);
}
