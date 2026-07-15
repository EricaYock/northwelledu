/*
 * Wait times block.
 * Content model (one row per entry):
 *   Row 1:            | Title            |            (single cell = panel title)
 *   Tab header rows:  | tab | <TabName>   |            (first cell literally "tab")
 *   Location rows:    | <TabName> | <min> | <Name> | <Facility> |
 *   Button rows:      handled as default content via links (last rows with a link)
 */
export default function decorate(block) {
  const rows = [...block.children];
  const tabs = [];
  const locationsByTab = new Map();
  let title = 'Wait times';
  const actions = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    const firstText = (cells[0]?.textContent || '').trim();

    if (cells.length === 1) {
      const link = cells[0].querySelector('a');
      if (link) {
        actions.push(link);
      } else if (firstText) {
        title = firstText;
      }
      return;
    }

    if (firstText.toLowerCase() === 'tab') {
      const name = (cells[1]?.textContent || '').trim();
      if (name) {
        tabs.push(name);
        if (!locationsByTab.has(name)) locationsByTab.set(name, []);
      }
      return;
    }

    // location row: tabName | minutes | name | facility
    const tabName = firstText;
    const minutes = (cells[1]?.textContent || '').trim();
    const name = (cells[2]?.textContent || '').trim();
    const facility = (cells[3]?.textContent || '').trim();
    if (!locationsByTab.has(tabName)) {
      locationsByTab.set(tabName, []);
      if (!tabs.includes(tabName)) tabs.push(tabName);
    }
    locationsByTab.get(tabName).push({ minutes, name, facility });
  });

  block.textContent = '';

  const heading = document.createElement('h2');
  heading.className = 'wait-times-title';
  heading.textContent = title;
  block.append(heading);

  // tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'wait-times-tabs';
  tabBar.setAttribute('role', 'tablist');

  const panelsWrap = document.createElement('div');
  panelsWrap.className = 'wait-times-panels';

  tabs.forEach((tabName, i) => {
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'wait-times-tab';
    tabBtn.setAttribute('role', 'tab');
    tabBtn.textContent = tabName;
    tabBtn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');

    const panel = document.createElement('div');
    panel.className = 'wait-times-panel';
    panel.setAttribute('role', 'tabpanel');
    if (i !== 0) panel.hidden = true;

    const list = document.createElement('ul');
    list.className = 'wait-times-locations';
    (locationsByTab.get(tabName) || []).forEach((loc) => {
      const li = document.createElement('li');
      li.className = 'wait-times-location';
      li.innerHTML = `<span class="wait-times-min">${loc.minutes}</span>`
        + '<span class="wait-times-info">'
        + `<span class="wait-times-name">${loc.name}</span>`
        + `<span class="wait-times-facility">${loc.facility}</span>`
        + '</span>';
      list.append(li);
    });

    // Carousel: prev/next arrows around a horizontally scrollable track.
    const carousel = document.createElement('div');
    carousel.className = 'wait-times-carousel';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'wait-times-arrow wait-times-arrow-prev';
    prev.setAttribute('aria-label', 'Previous locations');
    prev.innerHTML = '<span aria-hidden="true">‹</span>';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'wait-times-arrow wait-times-arrow-next';
    next.setAttribute('aria-label', 'Next locations');
    next.innerHTML = '<span aria-hidden="true">›</span>';

    const viewport = document.createElement('div');
    viewport.className = 'wait-times-viewport';
    viewport.append(list);

    const scrollByCards = (dir) => {
      const card = list.querySelector('.wait-times-location');
      const step = card ? card.getBoundingClientRect().width + 24 : viewport.clientWidth;
      viewport.scrollBy({ left: dir * step * 3, behavior: 'smooth' });
    };
    prev.addEventListener('click', () => scrollByCards(-1));
    next.addEventListener('click', () => scrollByCards(1));

    carousel.append(prev, viewport, next);
    panel.append(carousel);

    tabBtn.addEventListener('click', () => {
      tabBar.querySelectorAll('.wait-times-tab').forEach((t) => t.setAttribute('aria-selected', 'false'));
      panelsWrap.querySelectorAll('.wait-times-panel').forEach((p) => { p.hidden = true; });
      tabBtn.setAttribute('aria-selected', 'true');
      panel.hidden = false;
    });

    tabBar.append(tabBtn);
    panelsWrap.append(panel);
  });

  block.append(tabBar, panelsWrap);

  if (actions.length) {
    const actionsRow = document.createElement('div');
    actionsRow.className = 'wait-times-actions';
    actions.forEach((link, i) => {
      link.classList.add('button');
      link.classList.add(i === 0 ? 'primary' : 'secondary');
      const wrap = document.createElement('p');
      wrap.className = 'button-wrapper';
      wrap.append(link);
      actionsRow.append(wrap);
    });
    block.append(actionsRow);
  }
}
