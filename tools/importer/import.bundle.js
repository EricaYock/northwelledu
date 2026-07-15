var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import.js
  var import_exports = {};
  __export(import_exports, {
    default: () => import_default
  });

  // tools/importer/parsers/nw-hero.js
  function parse(element, { document }) {
    const img = element.querySelector("img");
    const titleEl = element.querySelector(".hero-xl-cta__title, h1, h2");
    const h1 = document.createElement("h1");
    if (titleEl) {
      const highlight = titleEl.querySelector(".highlight");
      if (highlight) {
        const parts = [];
        titleEl.childNodes.forEach((node) => {
          if (node.nodeType === 3) {
            parts.push(node.textContent);
          } else if (node.classList && node.classList.contains("highlight")) {
            parts.push(`<em>${node.textContent.trim()}</em>`);
          } else {
            parts.push(node.textContent);
          }
        });
        h1.innerHTML = parts.join(" ").replace(/\s+/g, " ").trim();
      } else {
        h1.textContent = titleEl.textContent.trim();
      }
    }
    const bodyP = element.querySelector("p");
    const p = document.createElement("p");
    if (bodyP) p.textContent = bodyP.textContent.trim();
    const cta = element.querySelector("a[href]");
    const content = document.createElement("div");
    content.append(h1);
    if (bodyP) content.append(p);
    if (cta) {
      const btnP = document.createElement("p");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = cta.textContent.trim();
      strong.append(a);
      btnP.append(strong);
      content.append(btnP);
    }
    const imgCell = document.createElement("div");
    if (img) imgCell.append(img.cloneNode(true));
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Hero (northwell)",
      cells: [[imgCell], [content]]
    });
    block.setAttribute("data-nw-section", "display");
    element.replaceWith(block);
  }

  // tools/importer/parsers/nw-icon-cards.js
  function parse2(element, { document }) {
    const items = element.querySelectorAll("nwhlit-icon-promo");
    const cells = [];
    items.forEach((item) => {
      const FA_TO_ICON = {
        "laptop-medical": "book-care",
        "money-check-edit-alt": "pay-bill",
        "map-marker-alt": "location"
      };
      const iconName = item.getAttribute("icon-name") || "";
      const mapped = FA_TO_ICON[iconName];
      const iconCell = document.createElement("div");
      const iconP = document.createElement("p");
      iconP.textContent = mapped ? `:${mapped}:` : "";
      iconCell.append(iconP);
      const bodyCell = document.createElement("div");
      const titleLink = item.querySelector("a[href]");
      if (titleLink) {
        const h3 = document.createElement("h3");
        const a = document.createElement("a");
        a.href = titleLink.getAttribute("href");
        a.textContent = titleLink.textContent.trim();
        h3.append(a);
        bodyCell.append(h3);
      }
      const paras = item.querySelectorAll("p");
      paras.forEach((para) => {
        const txt = para.textContent.trim();
        if (txt && (!titleLink || txt !== titleLink.textContent.trim())) {
          const p = document.createElement("p");
          p.textContent = txt;
          bodyCell.append(p);
        }
      });
      cells.push([iconCell, bodyCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Icon Cards",
      cells
    });
    const header = element.querySelector('[slot="header"]');
    const titleEl = header && header.querySelector('[slot="title"] h1, [slot="title"] h2, [slot="title"] h3, [slot="title"]');
    const title = element.getAttribute("data-nw-title") || (titleEl ? titleEl.textContent.trim() : "");
    if (title) {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-nw-group", "1");
      const h2 = document.createElement("h2");
      h2.textContent = title;
      wrapper.append(h2, block);
      element.replaceWith(wrapper);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/nw-promo.js
  function parse3(element, { document }) {
    const img = element.querySelector("img");
    const content = document.createElement("div");
    const titleEl = element.querySelector('[variant*="display"], [variant*="heading"], h2, h3');
    const titleText = titleEl ? titleEl.textContent.trim() : "";
    if (titleText) {
      const h2 = document.createElement("h2");
      h2.textContent = titleText;
      content.append(h2);
    }
    const bodyEl = element.querySelector('[variant*="body"]') || element.querySelector("p");
    const bodyText = bodyEl ? bodyEl.textContent.trim() : "";
    if (bodyText && bodyText !== titleText) {
      const p = document.createElement("p");
      p.textContent = bodyText;
      content.append(p);
    }
    const links = element.querySelectorAll("a[href]");
    links.forEach((link, i) => {
      const btnP = document.createElement("p");
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = link.textContent.trim();
      if (i === 0) {
        const strong = document.createElement("strong");
        strong.append(a);
        btnP.append(strong);
      } else {
        const em = document.createElement("em");
        em.append(a);
        btnP.append(em);
      }
      content.append(btnP);
    });
    const imgCell = document.createElement("div");
    if (img) imgCell.append(img.cloneNode(true));
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Promo",
      cells: [[content, imgCell]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/nw-promo-blue.js
  function parse4(element, { document }) {
    const img = element.querySelector("img");
    const content = document.createElement("div");
    const titleEl = element.querySelector('.nwhlit-hero__title, [variant*="heading"], h2, h3');
    const titleText = titleEl ? titleEl.textContent.trim() : "";
    if (titleText) {
      const h2 = document.createElement("h2");
      h2.textContent = titleText;
      content.append(h2);
    }
    const summaryEl = element.querySelector('.nwhlit-hero__summary [variant*="body"], .nwhlit-hero__summary p, [variant*="body"], p');
    const summaryText = summaryEl ? summaryEl.textContent.trim() : "";
    if (summaryText && summaryText !== titleText) {
      const p = document.createElement("p");
      p.textContent = summaryText;
      content.append(p);
    }
    const link = element.querySelector("a[href]");
    if (link) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = link.textContent.trim() || "Learn more";
      p.append(a);
      content.append(p);
    }
    const imgCell = document.createElement("div");
    if (img) imgCell.append(img.cloneNode(true));
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Promo (blue)",
      cells: [[imgCell, content]]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/nw-cards.js
  function parse5(element, { document }) {
    const cards = element.querySelectorAll("nwhlit-card");
    if (!cards.length) {
      element.remove();
      return;
    }
    let anyDescription = false;
    const cells = [];
    const seenTitles = /* @__PURE__ */ new Set();
    cards.forEach((card) => {
      const img = card.querySelector("img");
      const titleLink = card.querySelector(".nwhlit-card__title-heading a, a[href]");
      const titleKey = titleLink ? titleLink.textContent.trim() : img ? img.getAttribute("src") : "";
      if (titleKey && seenTitles.has(titleKey)) return;
      if (titleKey) seenTitles.add(titleKey);
      const imgCell = document.createElement("div");
      if (img) imgCell.append(img.cloneNode(true));
      const bodyCell = document.createElement("div");
      if (titleLink) {
        const h3 = document.createElement("h3");
        const a = document.createElement("a");
        a.href = titleLink.getAttribute("href");
        a.textContent = titleLink.textContent.trim();
        h3.append(a);
        bodyCell.append(h3);
      }
      const desc = card.querySelector(".nwhlit-card__content p, p");
      if (desc) {
        const txt = desc.textContent.trim();
        if (txt && (!titleLink || txt !== titleLink.textContent.trim())) {
          const p = document.createElement("p");
          p.textContent = txt;
          bodyCell.append(p);
          anyDescription = true;
        }
      }
      cells.push([imgCell, bodyCell]);
    });
    const name = anyDescription ? "Carousel" : "Cards (cards-areas)";
    const block = WebImporter.Blocks.createBlock(document, { name, cells });
    const nodes = [];
    const title = element.getAttribute("data-nw-title");
    if (title) {
      const h2 = document.createElement("h2");
      h2.textContent = title;
      nodes.push(h2);
    }
    const info = element.getAttribute("data-nw-info");
    if (info) {
      const p = document.createElement("p");
      p.textContent = info;
      nodes.push(p);
    }
    const ctaText = element.getAttribute("data-nw-cta-text");
    const ctaHref = element.getAttribute("data-nw-cta-href");
    if (ctaText && ctaHref) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = ctaHref;
      a.textContent = ctaText;
      p.append(a);
      nodes.push(p);
    }
    if (nodes.length) {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-nw-group", "1");
      nodes.forEach((n) => wrapper.append(n));
      wrapper.append(block);
      element.replaceWith(wrapper);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/nw-wait-times.js
  function parse6(element, { document }) {
    const rows = [];
    const title = element.getAttribute("headline") || "Wait times";
    rows.push([title]);
    const tabNames = ["Urgent Care", "Emergency department"];
    const defaultTab = tabNames[0];
    tabNames.forEach((name) => rows.push(["tab", name]));
    const limit = parseInt(element.getAttribute("items-limit") || "30", 10);
    const seen = /* @__PURE__ */ new Set();
    const units = element.querySelectorAll("nwhlit-wait-times-unit");
    units.forEach((unit) => {
      const numeric = unit.querySelector(".nwhlit-wait-time__numeric");
      const unitLabel = unit.querySelector(".nwhlit-wait-time-unit__unit");
      const minutes = `${numeric ? numeric.textContent.trim() : "0"} ${unitLabel ? unitLabel.textContent.trim() : "min"}`.trim();
      const locLink = unit.querySelector(".nwhlit-location-link a, a[href]");
      const name = locLink ? locLink.textContent.trim() : "";
      const facility = unit.querySelector(".nwhlit-subtitle");
      const fac = facility ? facility.textContent.trim() : "";
      if (name && !seen.has(name) && seen.size < limit) {
        seen.add(name);
        rows.push([defaultTab, minutes, name, fac]);
      }
    });
    const seeAllText = element.getAttribute("see-all-button-text");
    const seeAllUrl = element.getAttribute("see-all-button-url");
    if (seeAllText && seeAllUrl) {
      const a = document.createElement("a");
      a.href = seeAllUrl.startsWith("http") ? seeAllUrl : `https://www.northwell.edu${seeAllUrl}`;
      a.textContent = seeAllText;
      rows.push([a]);
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Wait Times",
      cells: rows.map((r) => r.length === 1 ? [r[0]] : r)
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/nw-awarded.js
  function parse7(element, { document }) {
    const wrapper = document.createElement("div");
    const titleEl = element.querySelector('[variant*="display"], h2, h3');
    if (titleEl) {
      const h2 = document.createElement("h2");
      h2.textContent = titleEl.textContent.trim();
      wrapper.append(h2);
    }
    const bodyP = element.querySelector("p");
    if (bodyP) {
      const p = document.createElement("p");
      p.textContent = bodyP.textContent.trim();
      wrapper.append(p);
    }
    const link = element.querySelector("a[href]");
    if (link) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = link.textContent.trim();
      strong.append(a);
      p.append(strong);
      wrapper.append(p);
    }
    wrapper.setAttribute("data-nw-section", "accent");
    element.replaceWith(wrapper);
  }

  // tools/importer/transformers/nw-cleanup.js
  var REMOVE_SELECTORS = [
    "nwhlit-footer",
    "nwhlit-gdpr-banner",
    "header",
    "footer",
    "nav",
    "template",
    '[slot="drupal-admin"]',
    ".nwhlit-card-grid__drupal-context",
    ".nwhlit-body-section__drupal-context",
    "nwhlit-notch",
    "script",
    "style",
    "noscript",
    "svg",
    "iframe"
  ];
  function transform(hookName, element) {
    if (hookName !== "beforeTransform") return;
    REMOVE_SELECTORS.forEach((sel) => {
      element.querySelectorAll(sel).forEach((el) => el.remove());
    });
    element.querySelectorAll("nwhlit-header").forEach((el) => {
      if (el.getAttribute("slot") !== "header") el.remove();
    });
    element.querySelectorAll('[class*="alert"], [class*="modal"], [id*="alert"], [id*="modal"]').forEach((el) => {
      el.remove();
    });
  }

  // tools/importer/transformers/nw-sections.js
  var ASSET_BASE = "https://raw.githubusercontent.com/EricaYock/northwelledu/main/import-work/Northwell%20Health_files/";
  function rewriteImages(root) {
    root.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      const m = src.match(/Northwell(?:%20|\s)Health_files\/(.+)$/);
      if (m) {
        const file = m[1].split("?")[0];
        img.setAttribute("src", ASSET_BASE + encodeURIComponent(decodeURIComponent(file)));
      }
    });
  }
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const { document } = payload;
    rewriteImages(element);
    const candidates = [...element.querySelectorAll("[data-nw-group], table, [data-nw-section]")];
    const seen = /* @__PURE__ */ new Set();
    const blockEls = [];
    candidates.forEach((el) => {
      if (seen.has(el)) return;
      if (el.tagName === "TABLE" && el.closest("[data-nw-group]")) return;
      blockEls.push(el);
      seen.add(el);
      el.querySelectorAll("table, [data-nw-section]").forEach((n) => seen.add(n));
    });
    if (!blockEls.length) return;
    const detached = blockEls.map((el) => {
      const style = el.getAttribute && el.getAttribute("data-nw-section");
      if (style) el.removeAttribute("data-nw-section");
      if (el.hasAttribute && el.hasAttribute("data-nw-group")) el.removeAttribute("data-nw-group");
      if (el.parentElement) el.parentElement.removeChild(el);
      return { el, style };
    });
    while (element.firstChild) element.removeChild(element.firstChild);
    detached.forEach(({ el, style }, i) => {
      if (i > 0) element.appendChild(document.createElement("hr"));
      if (el.tagName === "DIV" && !style) {
        while (el.firstChild) element.appendChild(el.firstChild);
      } else {
        element.appendChild(el);
      }
      if (style) {
        const metaBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style }
        });
        element.appendChild(metaBlock);
      }
    });
  }

  // tools/importer/import.js
  var BLOCK_REGISTRY = [
    // Hero — XL hero CTA (angled blue panel)
    { name: "nw-hero", selectors: ["nwhlit-xl-hero-cta"], parser: parse },
    // "I am looking to" — card grid of icon-promos
    { name: "nw-icon-cards", selectors: ["nwhlit-card-grid:has(nwhlit-icon-promo)"], parser: parse2 },
    // Split promos — cta-hero (MyNorthwell) and full-width-hero (blue callout)
    { name: "nw-promo-blue", selectors: ["nwhlit-full-width-hero"], parser: parse4 },
    { name: "nw-promo", selectors: ["nwhlit-cta-hero"], parser: parse3 },
    // Awarded gold band — stat ticker
    { name: "nw-awarded", selectors: ["nwhlit-xl-stat-ticker"], parser: parse7 },
    // Wait times — the -async element is the canonical widget; the inner
    // nwhlit-wait-times-tabs is a render copy (skipped as a descendant).
    { name: "nw-wait-times", selectors: ["nwhlit-wait-times-tabs-async", "nwhlit-wait-times-tabs"], parser: parse6 },
    // Card collections — card grids and carousels containing nwhlit-card
    // (parser picks cards-areas vs carousel based on presence of descriptions)
    { name: "nw-cards-grid", selectors: ["nwhlit-card-grid:has(nwhlit-card)"], parser: parse5 },
    { name: "nw-cards-carousel", selectors: ["nwhlit-carousel:has(nwhlit-card)"], parser: parse5 }
  ];
  function isDescendantOfMatched(el, matched) {
    let parent = el.parentElement;
    while (parent) {
      if (matched.has(parent)) return true;
      parent = parent.parentElement;
    }
    return false;
  }
  function findBlocksOnPage(document) {
    const pageBlocks = [];
    const matched = /* @__PURE__ */ new Set();
    for (const entry of BLOCK_REGISTRY) {
      for (const selector of entry.selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            if (!matched.has(el) && !isDescendantOfMatched(el, matched)) {
              matched.add(el);
              pageBlocks.push({ name: entry.name, element: el, parser: entry.parser });
            }
          });
        } catch (e) {
          console.warn(`Invalid selector for ${entry.name}: ${selector}`, e);
        }
      }
    }
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  function executeTransformers(hookName, element, payload) {
    const transformers = [transform, transform2];
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, payload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function hoistShadowHeaders(document) {
    const collections = document.querySelectorAll("nwhlit-card-grid, nwhlit-carousel");
    collections.forEach((el) => {
      const roots = [];
      const collectRoots = (root) => {
        roots.push(root);
        const nodes = root.querySelectorAll ? root.querySelectorAll("*") : [];
        nodes.forEach((child) => {
          if (child.shadowRoot) collectRoots(child.shadowRoot);
        });
      };
      collectRoots(el);
      if (el.shadowRoot) collectRoots(el.shadowRoot);
      const findText = (selList) => {
        for (const root of roots) {
          for (const sel of selList) {
            const found = root.querySelector(sel);
            if (found && found.textContent.trim()) return found.textContent.trim();
          }
        }
        return "";
      };
      const findLink = (selList) => {
        for (const root of roots) {
          for (const sel of selList) {
            const a = root.querySelector(sel);
            if (a && a.getAttribute("href") && a.textContent.trim()) {
              return { href: a.getAttribute("href"), text: a.textContent.trim() };
            }
          }
        }
        return null;
      };
      let title = findText(['[slot="title"] h1', '[slot="title"] h2', '[slot="title"] h3', '[slot="title"]']);
      let info = findText(['[slot="info"] p', '[slot="info"]']);
      let cta = findLink(['[slot="cta"] a[href]']);
      if (!title) {
        let anc = el.parentElement;
        while (anc && !title) {
          const t = anc.querySelector && anc.querySelector('nwhlit-typography[variant^="heading-lg"], nwhlit-typography[variant^="heading-md"]');
          if (t && t.textContent.trim()) {
            title = t.textContent.trim();
            const infoEl = anc.querySelector('nwhlit-typography[variant^="body"][slot="info"], [slot="info"]');
            if (infoEl && infoEl.textContent.trim()) info = infoEl.textContent.trim();
            const ctaA = anc.querySelector('[slot="cta"] a[href]');
            if (ctaA && ctaA.textContent.trim()) cta = { href: ctaA.getAttribute("href"), text: ctaA.textContent.trim() };
          }
          anc = anc.parentElement;
        }
      }
      if (title) el.setAttribute("data-nw-title", title);
      if (info) el.setAttribute("data-nw-info", info);
      if (cta) {
        el.setAttribute("data-nw-cta-text", cta.text);
        el.setAttribute("data-nw-cta-href", cta.href);
      }
    });
  }
  var import_default = {
    onLoad: async ({ document }) => {
      try {
        hoistShadowHeaders(document);
      } catch (e) {
        console.error("hoistShadowHeaders failed:", e);
      }
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const originalURL = params.originalURL || url;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document);
      pageBlocks.forEach((block) => {
        try {
          block.parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name}:`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url);
      const path = WebImporter.FileUtils.sanitizePath("/index");
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_exports);
})();
