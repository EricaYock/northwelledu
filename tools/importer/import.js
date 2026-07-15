/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS — Northwell homepage blocks
import nwHeroParser from './parsers/nw-hero.js';
import nwIconCardsParser from './parsers/nw-icon-cards.js';
import nwPromoParser from './parsers/nw-promo.js';
import nwPromoBlueParser from './parsers/nw-promo-blue.js';
import nwCardsParser from './parsers/nw-cards.js';
import nwWaitTimesParser from './parsers/nw-wait-times.js';
import nwAwardedParser from './parsers/nw-awarded.js';

// TRANSFORMER IMPORTS
import nwCleanupTransformer from './transformers/nw-cleanup.js';
import nwSectionsTransformer from './transformers/nw-sections.js';

/**
 * BLOCK_REGISTRY — content-driven block detection for the Northwell design system.
 * Northwell renders content inside nwhlit-* custom elements; each block is
 * identified by its custom-element tag. Order matters: containers whose cards
 * could match a broader rule are disambiguated inside the card parser itself.
 */
const BLOCK_REGISTRY = [
  // Hero — XL hero CTA (angled blue panel)
  { name: 'nw-hero', selectors: ['nwhlit-xl-hero-cta'], parser: nwHeroParser },

  // "I am looking to" — card grid of icon-promos
  { name: 'nw-icon-cards', selectors: ['nwhlit-card-grid:has(nwhlit-icon-promo)'], parser: nwIconCardsParser },

  // Split promos — cta-hero (MyNorthwell) and full-width-hero (blue callout)
  { name: 'nw-promo-blue', selectors: ['nwhlit-full-width-hero'], parser: nwPromoBlueParser },
  { name: 'nw-promo', selectors: ['nwhlit-cta-hero'], parser: nwPromoParser },

  // Awarded gold band — stat ticker
  { name: 'nw-awarded', selectors: ['nwhlit-xl-stat-ticker'], parser: nwAwardedParser },

  // Wait times — the -async element is the canonical widget; the inner
  // nwhlit-wait-times-tabs is a render copy (skipped as a descendant).
  { name: 'nw-wait-times', selectors: ['nwhlit-wait-times-tabs-async', 'nwhlit-wait-times-tabs'], parser: nwWaitTimesParser },

  // Card collections — card grids and carousels containing nwhlit-card
  // (parser picks cards-areas vs carousel based on presence of descriptions)
  { name: 'nw-cards-grid', selectors: ['nwhlit-card-grid:has(nwhlit-card)'], parser: nwCardsParser },
  { name: 'nw-cards-carousel', selectors: ['nwhlit-carousel:has(nwhlit-card)'], parser: nwCardsParser },
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
  const matched = new Set();

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
  const transformers = [nwCleanupTransformer, nwSectionsTransformer];
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, payload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * The Northwell design system renders section titles/subtitles/CTAs into
 * declarative shadow DOM (nwhlit-* custom elements), so they aren't reachable
 * by light-DOM querySelector during parsing. onLoad runs in the live browser
 * before transform: it pierces shadow roots and copies each collection's
 * header title/info/cta into light-DOM data-* attributes the parsers can read.
 */
function hoistShadowHeaders(document) {
  const collections = document.querySelectorAll('nwhlit-card-grid, nwhlit-carousel');
  collections.forEach((el) => {
    // Collect this element's light DOM + all nested shadow roots (recursively),
    // so slotted header parts rendered into shadow DOM are reachable.
    const roots = [];
    const collectRoots = (root) => {
      roots.push(root);
      const nodes = root.querySelectorAll ? root.querySelectorAll('*') : [];
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
      return '';
    };
    const findLink = (selList) => {
      for (const root of roots) {
        for (const sel of selList) {
          const a = root.querySelector(sel);
          if (a && a.getAttribute('href') && a.textContent.trim()) {
            return { href: a.getAttribute('href'), text: a.textContent.trim() };
          }
        }
      }
      return null;
    };

    let title = findText(['[slot="title"] h1', '[slot="title"] h2', '[slot="title"] h3', '[slot="title"]']);
    let info = findText(['[slot="info"] p', '[slot="info"]']);
    let cta = findLink(['[slot="cta"] a[href]']);

    // Fallback: the section header may live on an ancestor collection (e.g. an
    // outer carousel wrapping nested card carousels). Climb until we find a
    // heading-lg/heading-md title that isn't a card title (heading-xs).
    if (!title) {
      let anc = el.parentElement;
      while (anc && !title) {
        const t = anc.querySelector && anc.querySelector('nwhlit-typography[variant^="heading-lg"], nwhlit-typography[variant^="heading-md"]');
        if (t && t.textContent.trim()) {
          title = t.textContent.trim();
          const infoEl = anc.querySelector('nwhlit-typography[variant^="body"][slot="info"], [slot="info"]');
          if (infoEl && infoEl.textContent.trim()) info = infoEl.textContent.trim();
          const ctaA = anc.querySelector('[slot="cta"] a[href]');
          if (ctaA && ctaA.textContent.trim()) cta = { href: ctaA.getAttribute('href'), text: ctaA.textContent.trim() };
        }
        anc = anc.parentElement;
      }
    }
    if (title) el.setAttribute('data-nw-title', title);
    if (info) el.setAttribute('data-nw-info', info);
    if (cta) {
      el.setAttribute('data-nw-cta-text', cta.text);
      el.setAttribute('data-nw-cta-href', cta.href);
    }
  });
}

export default {
  onLoad: async ({ document }) => {
    try {
      hoistShadowHeaders(document);
    } catch (e) {
      console.error('hoistShadowHeaders failed:', e);
    }
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const originalURL = params.originalURL || url;

    const main = document.body;

    // 1. Cleanup + section-break insertion
    executeTransformers('beforeTransform', main, payload);

    // 2. Content-driven block detection + parsing
    const pageBlocks = findBlocksOnPage(document);
    pageBlocks.forEach((block) => {
      try {
        block.parser(block.element, { document, url, params });
      } catch (e) {
        console.error(`Failed to parse ${block.name}:`, e);
      }
    });

    // 3. afterTransform (section metadata)
    executeTransformers('afterTransform', main, payload);

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url);

    // 5. Sanitized path — this importer targets the Northwell homepage; always /index.
    //    (source may be a file:// path or the live URL; both map to the homepage)
    const path = WebImporter.FileUtils.sanitizePath('/index');

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
