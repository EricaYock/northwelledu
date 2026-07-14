import { getBasePath as f } from "./utilities/base-path-1783368115.js";
const i = /* @__PURE__ */ new WeakMap(), u = /* @__PURE__ */ new Set(), N = ["nwhlit"];
function g(...e) {
}
function y(e) {
  const a = i.get(e);
  a && (a.disconnect(), i.delete(e));
  for (const t of e.querySelectorAll("*")) {
    const o = i.get(t);
    o && (o.disconnect(), i.delete(t));
  }
}
const $ = new MutationObserver((e) => {
  for (const { addedNodes: a, removedNodes: t } of e) {
    for (const o of t) o.nodeType === Node.ELEMENT_NODE && y(o);
    for (const o of a) if (o.nodeType === Node.ELEMENT_NODE) {
      const s = o;
      g(s.tagName), h(s), s.shadowRoot !== null && (g(s.tagName), h(s.shadowRoot));
    } else g(o.nodeType);
  }
});
async function h(e) {
  var a, t, o;
  e instanceof Element && e.tagName;
  const s = [...e instanceof Element && !e.matches(":defined") ? [e] : [], ...e.querySelectorAll(":not(:defined)")];
  if (e instanceof Element && e.matches(":defined"), e.querySelectorAll(":not(:defined)").length, s.length === 0) return;
  const l = s.filter((n) => {
    const r = n.tagName.toLowerCase();
    return N.some((d) => r.startsWith(`${d}-`));
  }).filter((n) => !customElements.get(n.tagName.toLowerCase()));
  l.map((n) => n.tagName);
  const m = new Map(l.map((n) => [n.tagName.toLowerCase(), n]));
  Array.from(m.keys()), ((o = (t = (a = window?.drupalSettings) === null || a === void 0 ? void 0 : a.nwhlitLoader) === null || t === void 0 ? void 0 : t.type) !== null && o !== void 0 ? o : "lazy") === "lazy" ? l.forEach((n) => {
    n.tagName, function(r, d) {
      if (i.has(r)) return;
      const c = new IntersectionObserver((p) => {
        p.forEach((w) => {
          w.isIntersecting && (d(!0), c.unobserve(w.target), i.delete(w.target));
        });
      }, { root: null, rootMargin: "500px 0px 500px 0px", threshold: 0 });
      i.set(r, c), c.observe(r);
    }(n, async (r) => {
      n.tagName, r && await E(n);
    });
  }) : await Promise.allSettled(Array.from(m.values()).map((n) => E(n)));
}
function v(e) {
  e instanceof Element && e.tagName, h(e), e instanceof Element && e.tagName, $.observe(e, { subtree: !0, childList: !0 });
}
function E(e) {
  var a;
  const t = e.tagName.toLowerCase();
  if (customElements.get(t)) return Promise.resolve();
  if (u.has(t)) return customElements.whenDefined(t).then(() => {
  });
  u.add(t);
  const o = (a = window.nwhlit_loader_component_extension) !== null && a !== void 0 ? a : "js", s = o !== "ts" ? `${t}-1783368115.${o}` : `${t}.${o}`, l = o === "ts" ? [f(`components/${t}/${s}`), f(`components/shared/${t}/${s}`), f(`components/design-system/${t}/${s}`)] : [f(`components/${t}/${s}`)];
  return new Promise((m, n) => {
    let r = 0;
    const d = () => {
      if (r >= l.length) return void n(new Error(`Unable to autoload <${t}> from any of: ${l.join(", ")}`));
      const c = l[r];
      l.length, r++, import(c).then(() => {
        u.delete(t), e.shadowRoot && v(e.shadowRoot), m();
      }).catch((p) => {
        l.length, r >= l.length ? (u.delete(t), n(new Error(`Unable to autoload <${t}> from any of: ${l.join(", ")}`))) : d();
      });
    };
    d();
  });
}
v(document.body);
export {
  h as discoverElements
};
//# sourceMappingURL=nwhlit-loader.js.map
