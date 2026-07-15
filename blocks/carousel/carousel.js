import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'carousel-track';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'carousel-slide';
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      const img = cell.querySelector(':scope > p > img, :scope > img');
      if (cell.children.length === 1 && (pic || img)) {
        cell.className = 'carousel-slide-image';
      } else {
        cell.className = 'carousel-slide-body';
      }
    });

    track.append(li);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimized);
  });

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  viewport.append(track);

  const prev = document.createElement('button');
  prev.className = 'carousel-arrow carousel-arrow-prev';
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous');
  prev.innerHTML = '<span aria-hidden="true">‹</span>';

  const next = document.createElement('button');
  next.className = 'carousel-arrow carousel-arrow-next';
  next.type = 'button';
  next.setAttribute('aria-label', 'Next');
  next.innerHTML = '<span aria-hidden="true">›</span>';

  const scrollByCard = (dir) => {
    const card = track.querySelector('.carousel-slide');
    const amount = card ? card.getBoundingClientRect().width + 24 : viewport.clientWidth;
    viewport.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollByCard(-1));
  next.addEventListener('click', () => scrollByCard(1));

  block.textContent = '';
  block.append(prev, viewport, next);
}
