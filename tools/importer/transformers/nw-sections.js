/* eslint-disable */
/* global WebImporter */

/**
 * Sections transformer for Northwell.
 * Runs at afterTransform (once blocks are parsed & replaced).
 *  - Rewrites saved-page relative image paths to absolute GitHub raw URLs.
 *  - Finds the container that holds the parsed block tables and, among ITS
 *    children, inserts <hr> section breaks + Section Metadata (hero → display,
 *    awarded → accent).
 *  - Removes empty/noise wrapper divs left over from the saved page chrome.
 */
const ASSET_BASE = 'https://raw.githubusercontent.com/EricaYock/northwelledu/main/import-work/Northwell%20Health_files/';

function rewriteImages(root) {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    const m = src.match(/Northwell(?:%20|\s)Health_files\/(.+)$/);
    if (m) {
      const file = m[1].split('?')[0];
      img.setAttribute('src', ASSET_BASE + encodeURIComponent(decodeURIComponent(file)));
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const { document } = payload;

  rewriteImages(element);

  // Each page section is one of:
  //   - a [data-nw-group] wrapper (section heading + block table), or
  //   - a standalone block <table>, or
  //   - a [data-nw-section] marked node (hero / awarded band).
  // Collect them in document order, without double-counting tables that live
  // inside a group wrapper or carry the section marker.
  const candidates = [...element.querySelectorAll('[data-nw-group], table, [data-nw-section]')];
  const seen = new Set();
  const blockEls = [];
  candidates.forEach((el) => {
    if (seen.has(el)) return;
    // Skip tables nested inside a group wrapper (the wrapper represents them).
    if (el.tagName === 'TABLE' && el.closest('[data-nw-group]')) return;
    blockEls.push(el);
    seen.add(el);
    el.querySelectorAll('table, [data-nw-section]').forEach((n) => seen.add(n));
  });
  if (!blockEls.length) return;

  // Detach each block from the DOM first so re-inserting can't nest them.
  const detached = blockEls.map((el) => {
    const style = el.getAttribute && el.getAttribute('data-nw-section');
    if (style) el.removeAttribute('data-nw-section');
    if (el.hasAttribute && el.hasAttribute('data-nw-group')) el.removeAttribute('data-nw-group');
    if (el.parentElement) el.parentElement.removeChild(el);
    return { el, style };
  });

  // Wipe the body of leftover saved-page chrome.
  while (element.firstChild) element.removeChild(element.firstChild);

  // Re-append each section, separated by <hr>. A group wrapper's children
  // (heading + block) are spread into the same section so they render together.
  detached.forEach(({ el, style }, i) => {
    if (i > 0) element.appendChild(document.createElement('hr'));
    if (el.tagName === 'DIV' && !style) {
      // group wrapper: move its children up as section siblings
      while (el.firstChild) element.appendChild(el.firstChild);
    } else {
      element.appendChild(el);
    }
    if (style) {
      const metaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style },
      });
      element.appendChild(metaBlock);
    }
  });
}
