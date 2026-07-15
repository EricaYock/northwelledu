/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for Northwell.
 * Removes chrome/noise so only the main content custom-elements remain:
 * header, footer, GDPR/cookie banners, alert banners, skip links, hidden
 * template shadow-root markup, and the drupal-admin slots.
 */
const REMOVE_SELECTORS = [
  'nwhlit-footer',
  'nwhlit-gdpr-banner',
  'header',
  'footer',
  'nav',
  'template',
  '[slot="drupal-admin"]',
  '.nwhlit-card-grid__drupal-context',
  '.nwhlit-body-section__drupal-context',
  'nwhlit-notch',
  'script',
  'style',
  'noscript',
  'svg',
  'iframe',
];

export default function transform(hookName, element) {
  if (hookName !== 'beforeTransform') return;

  REMOVE_SELECTORS.forEach((sel) => {
    element.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // Remove the site nav header only — the top-level <nwhlit-header>, NOT the
  // <nwhlit-header slot="header"> section headings nested inside content blocks.
  element.querySelectorAll('nwhlit-header').forEach((el) => {
    if (el.getAttribute('slot') !== 'header') el.remove();
  });

  // Remove the on-page "alert banner" / promo modals (e.g. "This color is on trend!")
  element.querySelectorAll('[class*="alert"], [class*="modal"], [id*="alert"], [id*="modal"]').forEach((el) => {
    el.remove();
  });
}
