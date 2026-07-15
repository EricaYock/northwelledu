export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);

    // First cell is always the icon, remaining cell(s) are the body.
    [...li.children].forEach((cell, i) => {
      cell.className = i === 0 ? 'icon-cards-icon' : 'icon-cards-body';
    });

    // Convert a ":name:" token in the icon cell to an icon image.
    const iconCell = li.querySelector('.icon-cards-icon');
    if (iconCell) {
      const token = iconCell.textContent.trim().match(/^:([a-z0-9-]+):$/i);
      if (token) {
        const name = token[1];
        const span = document.createElement('span');
        span.className = `icon icon-${name}`;
        const img = document.createElement('img');
        img.src = `${window.hlx?.codeBasePath || ''}/icons/${name}.svg`;
        img.alt = '';
        img.loading = 'lazy';
        span.append(img);
        iconCell.replaceChildren(span);
      }
    }

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
