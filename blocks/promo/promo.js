export default function decorate(block) {
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const img = col.querySelector(':scope > p > img, :scope > img');
      if (col.children.length === 1 && (pic || img)) {
        col.classList.add('promo-img');
      } else {
        col.classList.add('promo-content');
      }
    });
  });
}
