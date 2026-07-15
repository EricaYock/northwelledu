/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the Northwell XL hero CTA → hero (northwell) variant.
 * Source element: <nwhlit-xl-hero-cta> on https://www.northwell.edu/
 * Content model (2 rows): [image] / [content: h1 + body + button]
 */
export default function parse(element, { document }) {
  // Image (background photo)
  const img = element.querySelector('img');

  // Title: h2.hero-xl-cta__title with a highlighted <span>
  const titleEl = element.querySelector('.hero-xl-cta__title, h1, h2');
  const h1 = document.createElement('h1');
  if (titleEl) {
    const highlight = titleEl.querySelector('.highlight');
    if (highlight) {
      // Rebuild: text before highlight, <em>highlight</em>, text after
      const parts = [];
      titleEl.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          parts.push(node.textContent);
        } else if (node.classList && node.classList.contains('highlight')) {
          parts.push(`<em>${node.textContent.trim()}</em>`);
        } else {
          parts.push(node.textContent);
        }
      });
      h1.innerHTML = parts.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      h1.textContent = titleEl.textContent.trim();
    }
  }

  // Body paragraph (first slotted body-lg paragraph)
  const bodyP = element.querySelector('p');
  const p = document.createElement('p');
  if (bodyP) p.textContent = bodyP.textContent.trim();

  // Primary CTA link
  const cta = element.querySelector('a[href]');
  const content = document.createElement('div');
  content.append(h1);
  if (bodyP) content.append(p);
  if (cta) {
    // Wrap in <strong> so EDS decorates the link as a primary button.
    const btnP = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = cta.textContent.trim();
    strong.append(a);
    btnP.append(strong);
    content.append(btnP);
  }

  const imgCell = document.createElement('div');
  if (img) imgCell.append(img.cloneNode(true));

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Hero (northwell)',
    cells: [[imgCell], [content]],
  });
  block.setAttribute('data-nw-section', 'display');
  element.replaceWith(block);
}
