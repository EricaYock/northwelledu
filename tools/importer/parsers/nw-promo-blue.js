/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the full-width feature callout → promo (blue) variant.
 * Source: <nwhlit-full-width-hero> — image + on-primary title + body + "Learn more".
 * Content model (1 row, 2 cols): [image] [content: h2 + body + link]
 */
export default function parse(element, { document }) {
  const img = element.querySelector('img');

  const content = document.createElement('div');

  const titleEl = element.querySelector('.nwhlit-hero__title, [variant*="heading"], h2, h3');
  const titleText = titleEl ? titleEl.textContent.trim() : '';
  if (titleText) {
    const h2 = document.createElement('h2');
    h2.textContent = titleText;
    content.append(h2);
  }

  const summaryEl = element.querySelector('.nwhlit-hero__summary [variant*="body"], .nwhlit-hero__summary p, [variant*="body"], p');
  const summaryText = summaryEl ? summaryEl.textContent.trim() : '';
  if (summaryText && summaryText !== titleText) {
    const p = document.createElement('p');
    p.textContent = summaryText;
    content.append(p);
  }

  const link = element.querySelector('a[href]');
  if (link) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim() || 'Learn more';
    p.append(a);
    content.append(p);
  }

  const imgCell = document.createElement('div');
  if (img) imgCell.append(img.cloneNode(true));

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Promo (blue)',
    cells: [[imgCell, content]],
  });
  element.replaceWith(block);
}
