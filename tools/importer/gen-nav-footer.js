/* eslint-disable */

/**
 * Generates the EDS nav + footer fragments from the saved Northwell homepage.
 * Reads import-work/cleaned.html, extracts the header and footer content, and
 * writes content/nav.plain.html and content/footer.plain.html in the structure
 * the header.js / footer.js blocks expect.
 *
 * Usage: node tools/importer/gen-nav-footer.js
 */
import { writeFileSync } from 'fs';

const NAV_OUT = new URL('../../content/nav.plain.html', import.meta.url);
const FOOTER_OUT = new URL('../../content/footer.plain.html', import.meta.url);

const esc = (s) => (s || '').replace(/\s+/g, ' ').trim();

/* ----------------------------- NAV ----------------------------- */
// Primary nav items (icon row) and utility links, taken from the source.
// Each item carries an EDS icon token (:name:) that resolves to /icons/name.svg.
const primary = [
  ['find-care', 'Find & book care', 'https://www.northwell.edu/find-care'],
  ['locations', 'Locations', 'https://www.northwell.edu/doctors-and-care/locations'],
  ['areas-of-care', 'Areas of care', 'https://www.northwell.edu/clinical-services'],
  ['pay-bill', 'Pay a bill', 'https://www.northwell.edu/manage-your-care/billpay'],
  ['patient-portal', 'Patient portal', 'https://www.northwell.edu/patient-portal'],
];
const tools = [
  ['globe', 'English', 'https://www.northwell.edu/'],
  ['gift', 'Give a gift', 'https://support.northwell.edu/donate-to-northwell-health'],
  ['login', 'Log in', 'https://www.northwell.edu/login'],
  ['search', 'Search', 'https://www.northwell.edu/search'],
];

const navSections = [];
// Section 1: brand
navSections.push('<div>\n  <p><a href="https://www.northwell.edu/">Northwell Health</a></p>\n</div>');
// Section 2: primary nav list (each link prefixed with its icon token)
const navItems = primary.map(([icon, t, h]) => `    <li><a href="${h}">:nav-${icon}: ${t}</a></li>`).join('\n');
navSections.push(`<div>\n  <ul>\n${navItems}\n  </ul>\n</div>`);
// Section 3: tools (utility links with icon tokens)
const toolItems = tools.map(([icon, t, h]) => `  <p><a href="${h}">:nav-${icon}: ${t}</a></p>`).join('\n');
navSections.push(`<div>\n${toolItems}\n</div>`);

writeFileSync(NAV_OUT, `${navSections.join('\n')}\n`, 'utf-8');
console.log('Wrote content/nav.plain.html');

/* ---------------------------- FOOTER ---------------------------- */
const footerColumns = [
  {
    heading: null, // brand column
    brand: ['Northwell Health', 'https://www.northwell.edu/'],
    phone: ['(888) 321-DOCS', 'tel:+18883213627'],
    text: [
      'Our representatives are available to schedule your appointment Monday through Friday from 9am to 5pm.',
      'For a Northwell ambulance, call (833) 259-2367.',
    ],
  },
  {
    heading: 'Quick links',
    links: [
      ['Pay a bill', 'https://www.northwell.edu/manage-your-care/billpay'],
      ['FollowMyHealth', 'https://www.northwell.edu/patient-portal'],
      ['For professionals', 'https://professionals.northwell.edu/'],
      ['For physicians', 'https://physicians.northwell.edu/'],
      ['Price transparency', 'https://www.northwell.edu/billing-and-insurance/price-estimator'],
    ],
  },
  {
    heading: 'Connect',
    links: [
      ['Contact us', 'https://www.northwell.edu/about-northwell/contact-us'],
      ['Ways to give', 'https://give.northwell.edu/support-us'],
      ['Volunteer', 'https://www.northwell.edu/about-northwell/volunteer'],
      ['The Well by Northwell', 'https://thewell.northwell.edu/'],
      ['Northwell Alumni Network', 'https://alumni.northwell.edu/'],
    ],
  },
  {
    heading: 'About',
    links: [
      ['FAQ', 'https://www.northwell.edu/help'],
      ['Jobs', 'https://jobs.northwell.edu/'],
      ['Newsroom', 'https://www.northwell.edu/news'],
      ['Northwell Health Physician Partners', 'https://www.northwell.edu/physician-partners'],
    ],
  },
  {
    heading: 'Employees',
    text: ['We are Northwell Health—and together, we’re raising the standard of health care.'],
    links: [
      ['For employees', 'https://www.northwell.edu/employees'],
    ],
  },
];

const topParts = [];
footerColumns.forEach((col) => {
  const lines = [];
  if (col.heading) lines.push(`  <h4>${col.heading}</h4>`);
  if (col.brand) lines.push(`  <p><a href="${col.brand[1]}">${col.brand[0]}</a></p>`);
  if (col.phone) lines.push(`  <p><a href="${col.phone[1]}">${col.phone[0]}</a></p>`);
  if (col.text) col.text.forEach((t) => lines.push(`  <p>${esc(t)}</p>`));
  if (col.links) {
    lines.push('  <ul>');
    col.links.forEach(([t, h]) => lines.push(`    <li><a href="${h}">${t}</a></li>`));
    lines.push('  </ul>');
  }
  topParts.push(lines.join('\n'));
});

const footerTop = `<div>\n${topParts.join('\n')}\n</div>`;
const footerBottom = [
  '<div>',
  '  <p>Corporate compliance | Notice of non-discrimination & accessibility | Privacy policies & disclaimers</p>',
  '  <p>© Copyright 2026 Northwell Health. As an official 501(c)(3) nonprofit organization, your gift is tax-deductible as allowed by law.</p>',
  '</div>',
].join('\n');

writeFileSync(FOOTER_OUT, `${footerTop}\n${footerBottom}\n`, 'utf-8');
console.log('Wrote content/footer.plain.html');
