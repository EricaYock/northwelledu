import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { BRAND_LOGO, getContentRoot } from '../../scripts/scripts.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : `${getContentRoot()}/footer`;
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Label sections
  const sections = footer.querySelectorAll(':scope > .section');
  if (sections.length >= 2) {
    sections[0].classList.add('footer-top');
    sections[sections.length - 1].classList.add('footer-bottom');
  }

  // Restructure footer-top: label columns and inject brand logo
  const footerTop = footer.querySelector('.footer-top');
  if (footerTop) {
    // EDS creates rows as direct children: div > div (row > cell)
    // or a single .default-content-wrapper with all content flat
    const wrapper = footerTop.querySelector('.default-content-wrapper');
    const rows = wrapper
      ? null
      : [...footerTop.querySelectorAll(':scope > div > div')];

    if (wrapper) {
      // Flat structure: group content into columns. Everything before the
      // first <h4> belongs to the brand column (logo, phone, hours, ambulance).
      const children = [...wrapper.children];
      const columns = [];

      const col1 = document.createElement('div');
      col1.className = 'footer-col footer-col-brand';
      columns.push(col1);

      let currentCol = col1;
      children.forEach((el) => {
        if (el.tagName === 'H4') {
          currentCol = document.createElement('div');
          currentCol.className = 'footer-col';
          columns.push(currentCol);
        }
        currentCol.append(el);
      });

      wrapper.remove();
      columns.forEach((col) => footerTop.append(col));
    } else if (rows && rows.length > 0) {
      // Row/cell structure: each row's inner div is a column
      rows.forEach((cell, i) => {
        cell.classList.add('footer-col');
        if (i === 0) cell.classList.add('footer-col-brand');
      });
      // Flatten: move cells directly into footer-top, remove row wrappers
      const rowWrappers = [...footerTop.querySelectorAll(':scope > div')];
      rowWrappers.forEach((row) => {
        const cell = row.querySelector('.footer-col');
        if (cell) {
          footerTop.append(cell);
          row.remove();
        }
      });
    }
  }

  // Restructure brand column: add logo icon + strip button classes
  const brandCol = footer.querySelector('.footer-col-brand') || footer.querySelector('.footer-col:first-child');
  if (brandCol) {
    const brandLink = brandCol.querySelector('a');
    if (brandLink) {
      brandLink.className = 'footer-brand-link';
      brandLink.innerHTML = BRAND_LOGO;
      const btnWrapper = brandLink.closest('.button-wrapper');
      if (btnWrapper) btnWrapper.className = '';
      const btnContainer = brandLink.closest('.button-container');
      if (btnContainer) btnContainer.className = '';
    }
    // Prominent phone number: the first non-logo link in the brand column
    const phoneP = [...brandCol.querySelectorAll(':scope > p')]
      .find((p) => p.querySelector('a[href^="tel:"]'));
    if (phoneP) phoneP.classList.add('footer-phone');
  }

  block.append(footer);
}
