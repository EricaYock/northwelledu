/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Northwell card collections → cards (cards-areas) or carousel.
 * Source: <nwhlit-card-grid> ("Our areas of care") or <nwhlit-carousel>
 * ("Breakthroughs & news", "The Well") containing <nwhlit-card> items.
 *
 * Variant selection (content-driven):
 *   - cards WITHOUT a description paragraph  → Cards (cards-areas)  [image + title]
 *   - cards WITH a description paragraph      → Carousel            [image + title + desc]
 *
 * Content model per card row: [image] / [title link (+ description)]
 */
export default function parse(element, { document }) {
  const cards = element.querySelectorAll('nwhlit-card');
  if (!cards.length) {
    element.remove();
    return;
  }

  let anyDescription = false;
  const cells = [];
  const seenTitles = new Set();

  cards.forEach((card) => {
    const img = card.querySelector('img');
    const titleLink = card.querySelector('.nwhlit-card__title-heading a, a[href]');

    // Dedupe: the design system renders the same card set across responsive
    // carousel slide-groups; keep the first occurrence of each title.
    const titleKey = titleLink ? titleLink.textContent.trim() : (img ? img.getAttribute('src') : '');
    if (titleKey && seenTitles.has(titleKey)) return;
    if (titleKey) seenTitles.add(titleKey);

    const imgCell = document.createElement('div');
    if (img) imgCell.append(img.cloneNode(true));

    const bodyCell = document.createElement('div');
    if (titleLink) {
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = titleLink.getAttribute('href');
      a.textContent = titleLink.textContent.trim();
      h3.append(a);
      bodyCell.append(h3);
    }

    // description: paragraph text distinct from the title
    const desc = card.querySelector('.nwhlit-card__content p, p');
    if (desc) {
      const txt = desc.textContent.trim();
      if (txt && (!titleLink || txt !== titleLink.textContent.trim())) {
        const p = document.createElement('p');
        p.textContent = txt;
        bodyCell.append(p);
        anyDescription = true;
      }
    }

    cells.push([imgCell, bodyCell]);
  });

  const name = anyDescription ? 'Carousel' : 'Cards (cards-areas)';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });

  // Section heading — hoisted from shadow DOM into data-* attrs by onLoad.
  const nodes = [];
  const title = element.getAttribute('data-nw-title');
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title;
    nodes.push(h2);
  }
  const info = element.getAttribute('data-nw-info');
  if (info) {
    const p = document.createElement('p');
    p.textContent = info;
    nodes.push(p);
  }
  const ctaText = element.getAttribute('data-nw-cta-text');
  const ctaHref = element.getAttribute('data-nw-cta-href');
  if (ctaText && ctaHref) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = ctaHref;
    a.textContent = ctaText;
    p.append(a);
    nodes.push(p);
  }

  if (nodes.length) {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-nw-group', '1');
    nodes.forEach((n) => wrapper.append(n));
    wrapper.append(block);
    element.replaceWith(wrapper);
  } else {
    element.replaceWith(block);
  }
}
