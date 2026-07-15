/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the "I am looking to" icon-promo grid → icon-cards block.
 * Source: <nwhlit-card-grid> containing <nwhlit-icon-promo> items.
 * Each item: icon-name attribute + slotted title link + description paragraph.
 * Content model per row: [icon label] / [title link + description]
 */
export default function parse(element, { document }) {
  const items = element.querySelectorAll('nwhlit-icon-promo');
  const cells = [];

  items.forEach((item) => {
    // Icon: source uses FontAwesome (icon-name attr). Map the known homepage
    // icons to EDS icon tokens (:name:) that resolve to /icons/<name>.svg; the
    // block CSS renders each inside a colored circle. Unknown icons are omitted.
    const FA_TO_ICON = {
      'laptop-medical': 'book-care',
      'money-check-edit-alt': 'pay-bill',
      'map-marker-alt': 'location',
    };
    const iconName = item.getAttribute('icon-name') || '';
    const mapped = FA_TO_ICON[iconName];
    const iconCell = document.createElement('div');
    const iconP = document.createElement('p');
    iconP.textContent = mapped ? `:${mapped}:` : '';
    iconCell.append(iconP);

    // Body: title (link) + description
    const bodyCell = document.createElement('div');
    const titleLink = item.querySelector('a[href]');
    if (titleLink) {
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = titleLink.getAttribute('href');
      a.textContent = titleLink.textContent.trim();
      h3.append(a);
      bodyCell.append(h3);
    }
    // description = paragraph text not inside the title link
    const paras = item.querySelectorAll('p');
    paras.forEach((para) => {
      const txt = para.textContent.trim();
      if (txt && (!titleLink || txt !== titleLink.textContent.trim())) {
        const p = document.createElement('p');
        p.textContent = txt;
        bodyCell.append(p);
      }
    });

    cells.push([iconCell, bodyCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Icon Cards',
    cells,
  });

  // Section heading ("I am looking to") — hoisted from shadow DOM by onLoad,
  // with a light-DOM fallback for the direct <nwhlit-header slot="header">.
  const header = element.querySelector('[slot="header"]');
  const titleEl = header && header.querySelector('[slot="title"] h1, [slot="title"] h2, [slot="title"] h3, [slot="title"]');
  const title = element.getAttribute('data-nw-title') || (titleEl ? titleEl.textContent.trim() : '');
  if (title) {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-nw-group', '1');
    const h2 = document.createElement('h2');
    h2.textContent = title;
    wrapper.append(h2, block);
    element.replaceWith(wrapper);
  } else {
    element.replaceWith(block);
  }
}
