/**
 * gallery.js v3
 * Dynamic gallery — loads images live from GitHub API.
 * Upload images from browser → straight into GitHub repo.
 */

/* ============================================================
   CONFIG — change only these two if repo changes
   ============================================================ */
const GH_OWNER = 'VINOTH1916';
const GH_REPO  = 'home';
const GH_BRANCH = 'main';

/* ============================================================
   SECTIONS
   ============================================================ */
const SECTIONS = [
  { id: 'surface',       label: 'Floor Surface',  folder: 'images/surface' },
  { id: 'portioSurface', label: 'Portio Surface', folder: 'images/portioSurface' },
  { id: 'bathroom',      label: 'Bathroom',       folder: 'images/bathroom' },
  { id: 'potioWall',     label: 'Patio Wall',     folder: 'images/potioWall' },
  { id: 'outdoor',       label: 'Outdoor',        folder: 'images/outdoor' },
  { id: 'kitchen',       label: 'Kitchen',        folder: 'images/kitchen' },
  { id: 'steps',         label: 'Steps',          folder: 'images/steps' },
];

const IMG_EXTS = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCategoryNav();
  initLightbox();
  initAdminPanel();
  initUploadModal();
  loadAllSections();
});

/* ============================================================
   GITHUB API HELPERS
   ============================================================ */
function getToken() {
  return localStorage.getItem('gh_token') || '';
}

async function ghFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  return res;
}

/* Fetch file list for a folder from GitHub API */
async function fetchFolderImages(folder) {
  const res = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${folder}?ref=${GH_BRANCH}`);
  if (!res.ok) return [];
  const files = await res.json();
  return files.filter(f => f.type === 'file' && IMG_EXTS.test(f.name));
}

/* Upload one file to GitHub */
async function uploadFileToGitHub(folder, filename, base64Content) {
  const path = `${folder}/${filename}`;

  // Check if file already exists (need its SHA to update)
  let sha = null;
  const check = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`);
  if (check.ok) {
    const existing = await check.json();
    sha = existing.sha;
  }

  const body = {
    message: `Upload ${filename} to ${folder}`,
    content: base64Content,
    branch: GH_BRANCH,
  };
  if (sha) body.sha = sha; // required when updating existing file

  const res = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

/* ============================================================
   LOAD ALL SECTIONS
   ============================================================ */
async function loadAllSections() {
  await Promise.all(SECTIONS.map(sec => loadSection(sec)));
}

async function loadSection(sec) {
  const track = document.getElementById('track-' + sec.id);
  if (!track) return;

  // Show loading state
  track.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>`;

  const files = await fetchFolderImages(sec.folder);
  const images = files.filter(f => f.name !== '.gitkeep');

  track.innerHTML = '';

  if (images.length === 0) {
    track.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🖼️</div>
        <p>No images yet.<br/>Click <strong>＋ Upload</strong> to add tiles.</p>
      </div>`;
  } else {
    images.forEach((file, idx) => {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      // Use raw.githubusercontent.com for direct image display (no API rate limit)
      const src  = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${sec.folder}/${file.name}`;
      const card = document.createElement('div');
      card.className = 'tile-card';
      card.innerHTML = `
        <img src="${src}" alt="${name}" loading="lazy" />
        <div class="tile-card-overlay"><span class="tile-card-label">${name}</span></div>
        <div class="tile-zoom-icon">🔍</div>`;
      card.addEventListener('click', () =>
        openLightbox(images.map(f =>
          `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${sec.folder}/${f.name}`
        ), idx, sec.label));
      track.appendChild(card);
    });
  }

  // Wire arrow buttons
  const wrapper = track.closest('.scroll-track-wrapper');
  const btnL = wrapper.querySelector('.arrow-left');
  const btnR = wrapper.querySelector('.arrow-right');
  // Remove old listeners by cloning
  const newL = btnL.cloneNode(true); btnL.replaceWith(newL);
  const newR = btnR.cloneNode(true); btnR.replaceWith(newR);
  newL.addEventListener('click', () => scrollTrack(track, -1));
  newR.addEventListener('click', () => scrollTrack(track,  1));
}

/* ============================================================
   SCROLL HELPER
   ============================================================ */
function scrollTrack(track, dir) {
  const w = track.querySelector('.tile-card')?.offsetWidth || 300;
  track.scrollBy({ left: dir * (w + 20) * 2, behavior: 'smooth' });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
let lbSrcs  = [];
let lbIdx   = 0;
let lbLabel = '';

const lightbox  = document.getElementById('lightbox');
const backdrop  = document.getElementById('lb-backdrop');
const lbImg     = document.getElementById('lb-img');
const lbCaption = document.getElementById('lb-caption');

function openLightbox(srcs, index, label) {
  lbSrcs  = srcs;
  lbIdx   = index;
  lbLabel = label;
  renderLb();
  lightbox.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

function renderLb() {
  lbImg.src = lbSrcs[lbIdx];
  lbImg.alt = lbLabel;
  lbCaption.textContent = `${lbLabel}  (${lbIdx + 1} / ${lbSrcs.length})`;
  lbImg.style.animation = 'none';
  lbImg.offsetHeight;
  lbImg.style.animation = '';
}

function lbNav(dir) {
  lbIdx = (lbIdx + dir + lbSrcs.length) % lbSrcs.length;
  renderLb();
}

function initLightbox() {
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click',  () => lbNav(-1));
  document.getElementById('lb-next').addEventListener('click',  () => lbNav(1));
  backdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
  });
  let tx = 0;
  lightbox.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
  lightbox.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) lbNav(dx < 0 ? 1 : -1);
  });
}

/* ============================================================
   ADMIN PANEL (token setup)
   ============================================================ */
function initAdminPanel() {
  const panel    = document.getElementById('admin-panel');
  const ab       = document.getElementById('admin-backdrop');
  const input    = document.getElementById('gh-token');
  const toggle   = document.getElementById('token-toggle');
  const status   = document.getElementById('token-status');
  const btnOpen  = document.getElementById('btn-admin');
  const btnClose = document.getElementById('admin-close');
  const btnSave  = document.getElementById('btn-save-token');
  const btnClear = document.getElementById('btn-clear-token');

  function open() {
    input.value = localStorage.getItem('gh_token') || '';
    panel.classList.add('open');
    ab.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateStatus();
  }
  function close() {
    panel.classList.remove('open');
    ab.classList.remove('open');
    document.body.style.overflow = '';
  }
  function updateStatus() {
    const t = localStorage.getItem('gh_token');
    if (t) {
      status.textContent = '✅ Token saved — uploads enabled.';
      status.className = 'token-status ok';
    } else {
      status.textContent = '⚠️ No token — uploads disabled.';
      status.className = 'token-status warn';
    }
  }

  btnOpen.addEventListener('click', open);
  btnClose.addEventListener('click', close);
  ab.addEventListener('click', close);

  toggle.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  btnSave.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) { status.textContent = '❌ Please enter a token.'; status.className = 'token-status err'; return; }
    localStorage.setItem('gh_token', val);
    updateStatus();
    setTimeout(close, 800);
  });

  btnClear.addEventListener('click', () => {
    localStorage.removeItem('gh_token');
    input.value = '';
    updateStatus();
  });

  // Show ⚙️ Manage as active if token missing
  if (!getToken()) {
    document.getElementById('btn-admin').classList.add('pill-warn');
  }
}

/* ============================================================
   UPLOAD MODAL
   ============================================================ */
let currentUploadSection = null;

function initUploadModal() {
  const modal    = document.getElementById('upload-modal');
  const ub       = document.getElementById('upload-backdrop');
  const dropZone = document.getElementById('drop-zone');
  const fileInput= document.getElementById('file-input');
  const queue    = document.getElementById('upload-queue');
  const btnAll   = document.getElementById('btn-upload-all');
  const btnClose = document.getElementById('upload-modal-close');
  const title    = document.getElementById('upload-modal-title');

  let pendingFiles = [];

  // Open via ＋ Upload buttons
  document.querySelectorAll('.upload-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!getToken()) {
        alert('⚠️ Please set your GitHub token first.\nClick the ⚙️ Manage button in the nav.');
        return;
      }
      const sec = SECTIONS.find(s => s.id === btn.dataset.section);
      currentUploadSection = sec;
      title.textContent = `Upload — ${sec.label}`;
      pendingFiles = [];
      queue.innerHTML = '';
      btnAll.disabled = true;
      modal.classList.add('open');
      ub.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('open');
    ub.classList.remove('open');
    document.body.style.overflow = '';
    pendingFiles = [];
    queue.innerHTML = '';
    btnAll.disabled = true;
  }

  btnClose.addEventListener('click', closeModal);
  ub.addEventListener('click', closeModal);

  // Drop zone click → file picker
  dropZone.addEventListener('click', () => fileInput.click());

  // Drag & drop
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    addFiles([...e.dataTransfer.files]);
  });

  fileInput.addEventListener('change', () => {
    addFiles([...fileInput.files]);
    fileInput.value = '';
  });

  function addFiles(files) {
    files = files.filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    pendingFiles.push(...files);
    renderQueue();
    btnAll.disabled = false;
  }

  function renderQueue() {
    queue.innerHTML = '';
    pendingFiles.forEach((file, i) => {
      const row = document.createElement('div');
      row.className = 'queue-row';
      row.id = `qrow-${i}`;
      const thumb = URL.createObjectURL(file);
      row.innerHTML = `
        <img src="${thumb}" class="queue-thumb" alt="${file.name}" />
        <span class="queue-name">${file.name}</span>
        <span class="queue-size">${(file.size/1024).toFixed(0)} KB</span>
        <span class="queue-status" id="qstatus-${i}">⏳</span>
        <button class="queue-remove" data-i="${i}">✕</button>`;
      queue.appendChild(row);
    });
    queue.querySelectorAll('.queue-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingFiles.splice(parseInt(btn.dataset.i), 1);
        renderQueue();
        btnAll.disabled = pendingFiles.length === 0;
      });
    });
  }

  // Upload all
  btnAll.addEventListener('click', async () => {
    if (!currentUploadSection) return;
    btnAll.disabled = true;
    btnAll.textContent = '⏳ Uploading…';

    let allOk = true;
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const statusEl = document.getElementById(`qstatus-${i}`);
      statusEl.textContent = '⬆️';
      try {
        const b64 = await fileToBase64(file);
        const res = await uploadFileToGitHub(currentUploadSection.folder, file.name, b64);
        if (res.ok || res.status === 201) {
          statusEl.textContent = '✅';
        } else {
          const err = await res.json();
          statusEl.textContent = '❌';
          statusEl.title = err.message || 'Error';
          allOk = false;
        }
      } catch (e) {
        statusEl.textContent = '❌';
        statusEl.title = e.message;
        allOk = false;
      }
    }

    btnAll.textContent = allOk ? '✅ Done!' : '⚠️ Some failed';

    // Reload the section gallery after upload
    const sec = currentUploadSection;
    setTimeout(async () => {
      closeModal();
      await loadSection(sec);
    }, 1200);
  });
}

/* ============================================================
   FILE → BASE64
   ============================================================ */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   CATEGORY NAV
   ============================================================ */
function initCategoryNav() {
  const pills = document.querySelectorAll('.pill[data-target]');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const el = document.getElementById('section-' + pill.dataset.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      }
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('section-', '');
        pills.forEach(p => p.classList.toggle('active', p.dataset.target === id));
      }
    });
  }, { threshold: 0.3 });

  SECTIONS.forEach(sec => {
    const el = document.getElementById('section-' + sec.id);
    if (el) observer.observe(el);
  });
}
