/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the "Most Awarded" gold band → default content in an accent section.
 * Source: <nwhlit-xl-stat-ticker color="accent-3"> — heading + body + "Learn more".
 * Emits plain heading/paragraph/button; the accent section style is applied by
 * the sections transformer (detects this element and tags the section "accent").
 */
export default function parse(element, { document }) {
  const wrapper = document.createElement('div');

  const titleEl = element.querySelector('[variant*="display"], h2, h3');
  if (titleEl) {
    const h2 = document.createElement('h2');
    h2.textContent = titleEl.textContent.trim();
    wrapper.append(h2);
  }

  const bodyP = element.querySelector('p');
  if (bodyP) {
    const p = document.createElement('p');
    p.textContent = bodyP.textContent.trim();
    wrapper.append(p);
  }

  const link = element.querySelector('a[href]');
  if (link) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    strong.append(a);
    p.append(strong);
    wrapper.append(p);
  }

  wrapper.setAttribute('data-nw-section', 'accent');
  element.replaceWith(wrapper);
}
