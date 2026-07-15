/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the Northwell wait-times widget → wait-times block.
 * Source: <nwhlit-wait-times-tabs-async> (canonical; carries config attributes)
 * wrapping a render copy with <nwhlit-wait-times-unit> children.
 *
 * Block content model (one row per entry, matching blocks/wait-times):
 *   [Title]
 *   [tab | <TabName>]
 *   [<TabName> | <min> | <Location> | <Facility>]
 *   [<action link>]
 */
export default function parse(element, { document }) {
  const rows = [];

  const title = element.getAttribute('headline') || 'Wait times';
  rows.push([title]);

  // Tabs: the async widget statically renders the Urgent Care list; the
  // Emergency department tab loads client-side. Emit both tab labels.
  const tabNames = ['Urgent Care', 'Emergency department'];
  const defaultTab = tabNames[0];
  tabNames.forEach((name) => rows.push(['tab', name]));

  // Location units — dedupe by name (the widget renders the list twice).
  const limit = parseInt(element.getAttribute('items-limit') || '30', 10);
  const seen = new Set();
  const units = element.querySelectorAll('nwhlit-wait-times-unit');
  units.forEach((unit) => {
    const numeric = unit.querySelector('.nwhlit-wait-time__numeric');
    const unitLabel = unit.querySelector('.nwhlit-wait-time-unit__unit');
    const minutes = `${numeric ? numeric.textContent.trim() : '0'} ${unitLabel ? unitLabel.textContent.trim() : 'min'}`.trim();
    const locLink = unit.querySelector('.nwhlit-location-link a, a[href]');
    const name = locLink ? locLink.textContent.trim() : '';
    const facility = unit.querySelector('.nwhlit-subtitle');
    const fac = facility ? facility.textContent.trim() : '';
    if (name && !seen.has(name) && seen.size < limit) {
      seen.add(name);
      rows.push([defaultTab, minutes, name, fac]);
    }
  });

  // "See all wait times" action from the widget attributes.
  const seeAllText = element.getAttribute('see-all-button-text');
  const seeAllUrl = element.getAttribute('see-all-button-url');
  if (seeAllText && seeAllUrl) {
    const a = document.createElement('a');
    a.href = seeAllUrl.startsWith('http') ? seeAllUrl : `https://www.northwell.edu${seeAllUrl}`;
    a.textContent = seeAllText;
    rows.push([a]);
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Wait Times',
    cells: rows.map((r) => (r.length === 1 ? [r[0]] : r)),
  });
  element.replaceWith(block);
}
