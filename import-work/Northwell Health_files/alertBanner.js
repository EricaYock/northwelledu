import { getNwhCookie as p } from "../utilities/cookie-utils-1783368115.js";
window.Drupal = window.Drupal || { behaviors: {} }, window.Drupal.behaviors.alertBanner = { attach: (f) => {
  if (p("nwh_alert_cookie") !== "") return;
  const l = window.drupalSettings, s = l?.alerts_api;
  s ? fetch(s, { cache: "force-cache" }).then((e) => {
    if (!e.ok) throw new Error(`API returned ${e.status}: ${e.statusText}`);
    return e.json();
  }).then((e) => {
    if (!e) return;
    if (String(e.code) !== "200") return void e.code;
    if (!e.alert || !e.alert.message || e.alert.message.trim() === "") return;
    const c = e.alert.level, m = c === "level4" || c === "info" ? "info" : "warning", h = e.alert.message, r = e.alert.cta, t = document.createElement("nwhlit-alert");
    t.setAttribute("variant", "global"), t.setAttribute("color", m), t.setAttribute("cookie-duration", String(1)), t.setAttribute("dismiss-btn", ""), t.tagName, t.getAttribute("variant"), t.getAttribute("color"), t.getAttribute("cookie-duration");
    const n = document.createElement("nwhlit-typography");
    n.setAttribute("variant", "body-md"), n.setAttribute("color", "primary");
    const u = document.createElement("span");
    u.innerHTML = `
          ${h}
          ${r?.url ? `<a href="${r.url}" target="${r.target || "_self"}">${r.text || "Learn more"}</a>` : ""}
        `, n.appendChild(u), t.appendChild(n);
    const i = document.createElement("nwhlit-button");
    i.setAttribute("slot", "close-button");
    const d = document.createElement("button"), o = document.createElement("nwhlit-fontawesome-icon");
    o.setAttribute("icon-prefix", "fa-light"), o.setAttribute("icon-name", "xmark"), o.setAttribute("color", "primary"), d.appendChild(o), i.appendChild(d), t.appendChild(i);
    const a = document.querySelector(".site-header");
    if (a?.parentNode) a.parentNode.insertBefore(t, a);
    else {
      if (!document.body) return void console.error("[alertBanner] Cannot insert alert - body element not found");
      document.body.insertBefore(t, document.body.firstChild);
    }
  }).catch((e) => {
    console.error("[alertBanner] Error fetching alert:", e), e instanceof Error ? e.message : String(e), e instanceof Error && e.stack;
  }) : console.error("[alertBanner] No alerts_api endpoint configured in drupalSettings");
} };
//# sourceMappingURL=alertBanner.js.map
