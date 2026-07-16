/**
 * gallery.js
 * Handles:
 *  - Loading images from each folder via a manifest (images.json)
 *  - Horizontal scroll with arrow buttons
 *  - Lightbox viewer with keyboard navigation
 *  - Category nav pill highlighting on scroll
 */

/* ============================================================
   IMAGE MANIFEST
   images.json lists all image filenames per folder so the
   static site knows what to load (no server-side directory
   listing needed on GitHub Pages).
   ============================================================ */
const SECTIONS = [
  { id: 'surface',       label: 'Floor Surface',   folder: 'images/surface' },
  { id: 'portioSurface', label: 'Portio Surface',  folder: 'images/portioSurface' },
  { id: 'bathroom',      label: 'Bathroom',        folder: 'images/bathroom' },
  { id: 'potioWall',     label: 'Patio Wall',      folder: 'images/potioWall' },
  { id: 'outdoor',       label: 'Outdoor',         folder: 'images/outdoor' },
  { id: 'kitchen',       label: 'Kitchen',         folder: 'images/kitchen' },
  { id: 'steps',         label: 'Steps',           folder: 'images/steps' },
];

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  fetchManifestAndRender();
  initCategoryNav();
  initLightbox();
});

/* ============================================================
   FETCH MANIFEST → RENDER CARDS
   ============================================================ */
async function fetchManifestAndRender() {
  let manifest = {};

  try {
    const res = await fetch('images.json');
    if (res.ok) manifest = await res.json();
  } catch (_) {
    // images.json not present — shows empty state per section
  }

  SECTIONS.forEach(sec => {
    const track = document.getElementById('track-' + sec.id);
    if (!track) return;

    const images = (manifest[sec.id] || []);

    if (images.length === 0) {
      track.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🖼️</div>
          <p>Add images to <strong>${sec.folder}/</strong><br>and update <strong>images.json</strong> to display them here.</p>
        </div>`;
      return;
    }

    images.forEach((filename, idx) => {
      const src   = `${sec.folder}/${filename}`;
      const name  = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const card  = document.createElement('div');
      card.className     = 'tile-card';
      card.dataset.src   = src;
      card.dataset.label = `${sec.label} — ${name}`;
      card.dataset.section = sec.id;
      card.dataset.index   = idx;
      card.innerHTML = `
        <img src="${src}" alt="${name}" loading="lazy" />
        <div class="tile-card-overlay">
          <span class="tile-card-label">${name}</span>
        </div>
        <div class="tile-zoom-icon">🔍</div>`;
      card.addEventListener('click', () =>
        openLightbox(sec.id, idx, images, sec.folder, sec.label));
      track.appendChild(card);
    });

    // Wire up arrow buttons for this track
    const wrapper = track.closest('.scroll-track-wrapper');
    wrapper.querySelector('.arrow-left').addEventListener('click',  () => scrollTrack(track, -1));
    wrapper.querySelector('.arrow-right').addEventListener('click', () => scrollTrack(track,  1));
  });
}

/* ============================================================
   HORIZONTAL SCROLL HELPER
   ============================================================ */
function scrollTrack(track, dir) {
  const amount = (parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--card-w')) || 300) + 20;
  track.scrollBy({ left: dir * amount * 2, behavior: 'smooth' });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
let lbImages   = [];
let lbFolder   = '';
let lbLabel    = '';
let lbIndex    = 0;

const lightbox  = document.getElementById('lightbox');
const backdrop  = document.getElementById('lb-backdrop');
const lbImg     = document.getElementById('lb-img');
const lbCaption = document.getElementById('lb-caption');

function openLightbox(sectionId, index, images, folder, label) {
  lbImages = images;
  lbFolder = folder;
  lbLabel  = label;
  lbIndex  = index;
  renderLbImage();
  lightbox.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

function renderLbImage() {
  const filename = lbImages[lbIndex];
  const name     = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  lbImg.src          = `${lbFolder}/${filename}`;
  lbImg.alt          = name;
  lbCaption.textContent = `${lbLabel} — ${name}  (${lbIndex + 1} / ${lbImages.length})`;
  // Restart animation
  lbImg.style.animation = 'none';
  lbImg.offsetHeight; // reflow
  lbImg.style.animation = '';
}

function lbNav(dir) {
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  renderLbImage();
}

function initLightbox() {
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click',  () => lbNav(-1));
  document.getElementById('lb-next').addEventListener('click',  () => lbNav(1));
  backdrop.addEventListener('click', closeLightbox);

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   lbNav(-1);
    if (e.key === 'ArrowRight')  lbNav(1);
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
  lightbox.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) lbNav(dx < 0 ? 1 : -1);
  });
}

/* ============================================================
   CATEGORY NAV — pill highlight on scroll + click-scroll
   ============================================================ */
function initCategoryNav() {
  const pills = document.querySelectorAll('.pill');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const id = pill.dataset.target;
      const el = document.getElementById('section-' + id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      }
    });
  });

  // IntersectionObserver to highlight active section while scrolling
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('section-', '');
        pills.forEach(p => {
          p.classList.toggle('active', p.dataset.target === id);
        });
      }
    });
  }, { threshold: 0.35 });

  SECTIONS.forEach(sec => {
    const el = document.getElementById('section-' + sec.id);
    if (el) observer.observe(el);
  });
}
