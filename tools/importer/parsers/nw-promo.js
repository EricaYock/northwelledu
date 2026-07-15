/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the MyNorthwell split promo → promo block.
 * Source: <nwhlit-cta-hero color="primary"> — image + title + body + CTA links.
 * Content model (1 row, 2 cols): [content: h2 + body + buttons] [image]
 */
export default function parse(element, { document }) {
  const img = element.querySelector('img');

  const content = document.createElement('div');

  const titleEl = element.querySelector('[variant*="display"], [variant*="heading"], h2, h3');
  const titleText = titleEl ? titleEl.textContent.trim() : '';
  if (titleText) {
    const h2 = document.createElement('h2');
    h2.textContent = titleText;
    content.append(h2);
  }

  // Body copy: the body-lg typography (text is a direct child, not a <p>).
  const bodyEl = element.querySelector('[variant*="body"]') || element.querySelector('p');
  const bodyText = bodyEl ? bodyEl.textContent.trim() : '';
  if (bodyText && bodyText !== titleText) {
    const p = document.createElement('p');
    p.textContent = bodyText;
    content.append(p);
  }

  // CTA links → buttons (first primary, rest secondary via <em>)
  const links = element.querySelectorAll('a[href]');
  links.forEach((link, i) => {
    const btnP = document.createElement('p');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    if (i === 0) {
      const strong = document.createElement('strong');
      strong.append(a);
      btnP.append(strong);
    } else {
      const em = document.createElement('em');
      em.append(a);
      btnP.append(em);
    }
    content.append(btnP);
  });

  const imgCell = document.createElement('div');
  if (img) imgCell.append(img.cloneNode(true));

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Promo',
    cells: [[content, imgCell]],
  });
  element.replaceWith(block);
}
