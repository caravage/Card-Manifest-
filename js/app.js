// Merge all card arrays into one
const cardData = [
  ...cardsEvent,
  ...cardsGW,
  ...cardsHome,
  ...cardsNationalGoal,
];

let currentView = 'table';
let currentPage = 1;
let perPage = 50;
let filteredData = [...cardData];
let sortField = 'number';
let sortDir = 1;
let currentLightboxIndex = 0;
let textSearchTerm = '';

// DOM refs
const filterName = document.getElementById('filter-name');
const filterText = document.getElementById('filter-text');
const filterType = document.getElementById('filter-type');
const perPageSelect = document.getElementById('per-page');
const tableBody = document.getElementById('table-body');
const galleryGrid = document.getElementById('gallery-grid');
const paginationEl = document.getElementById('pagination');
const resultsInfo = document.getElementById('results-info');

function applyFilters() {
  const nameQuery = filterName.value.toLowerCase().trim();
  const textQuery = filterText.value.toLowerCase().trim();
  const typeQuery = filterType.value;

  textSearchTerm = textQuery;

  filteredData = cardData.filter(card => {
    const matchName = !nameQuery || card.name.toLowerCase().includes(nameQuery);
    const matchType = !typeQuery || card.type === typeQuery;
    const matchText = !textQuery || (card.spec && card.spec.toLowerCase().includes(textQuery));
    return matchName && matchType && matchText;
  });

  sortData();
  currentPage = 1;
  render();
}

function sortData() {
  filteredData.sort((a, b) => {
    let va = a[sortField] ?? '';
    let vb = b[sortField] ?? '';
    if (sortField === 'number' || sortField === 'cp') {
      va = Number(va) || 0;
      vb = Number(vb) || 0;
    } else if (typeof va === 'string') {
      va = va.toLowerCase();
      vb = vb.toLowerCase();
    }
    if (va < vb) return -1 * sortDir;
    if (va > vb) return 1 * sortDir;
    return 0;
  });
}

function getSnippet(spec, query) {
  if (!spec || !query) return '';
  const lowerSpec = spec.toLowerCase();
  const idx = lowerSpec.indexOf(query);
  if (idx === -1) return '';
  const start = Math.max(0, idx - 30);
  const end = Math.min(spec.length, idx + query.length + 50);
  let snippet = (start > 0 ? '...' : '') + spec.substring(start, end) + (end < spec.length ? '...' : '');
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  snippet = snippet.replace(re, '<mark>$1</mark>');
  return snippet;
}

function render() {
  const start = (currentPage - 1) * perPage;
  const pageData = filteredData.slice(start, start + perPage);

  resultsInfo.textContent = `Showing ${start + 1}–${Math.min(start + perPage, filteredData.length)} of ${filteredData.length} cards`;

  // Table
  tableBody.innerHTML = '';
  pageData.forEach((card, i) => {
    const tr = document.createElement('tr');
    tr.onclick = () => openLightbox(start + i);

    const typeCls = card.type.toLowerCase().replace(/\s+/g, '-');

    let nameCell = `<span>${card.name}</span>`;
    if (textSearchTerm && card.spec) {
      const snippet = getSnippet(card.spec, textSearchTerm);
      if (snippet) {
        nameCell += `<span class="text-match-snippet">${snippet}</span>`;
      }
    }

    tr.innerHTML = `
      <td class="card-number">${card.number}</td>
      <td class="card-cp">${card.cp ?? '—'}</td>
      <td class="card-name">${nameCell}</td>
      <td><span class="type-badge ${typeCls}">${card.type}</span></td>
    `;
    tableBody.appendChild(tr);
  });

  // Gallery
  galleryGrid.innerHTML = '';
  pageData.forEach((card, i) => {
    const div = document.createElement('div');
    div.className = 'gallery-card';
    div.onclick = () => openLightbox(start + i);
    div.innerHTML = `
      <img src="${card.image}" alt="${card.name}" loading="lazy" onerror="this.style.display='none'">
      <div class="card-info">
        <div class="card-title">${card.name}</div>
        <div class="card-meta">
          <span>#${card.number}</span>
          <span>${card.cp ? card.cp + ' CP' : ''}</span>
        </div>
      </div>
    `;
    galleryGrid.appendChild(div);
  });

  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filteredData.length / perPage);
  paginationEl.innerHTML = '';

  if (total <= 1) return;

  const prev = document.createElement('button');
  prev.textContent = '‹ Prev';
  prev.disabled = currentPage === 1;
  prev.onclick = () => { currentPage--; render(); window.scrollTo(0, 0); };
  paginationEl.appendChild(prev);

  for (let p = 1; p <= total; p++) {
    const btn = document.createElement('button');
    btn.textContent = p;
    if (p === currentPage) btn.className = 'active';
    btn.onclick = () => { currentPage = p; render(); window.scrollTo(0, 0); };
    paginationEl.appendChild(btn);
  }

  const next = document.createElement('button');
  next.textContent = 'Next ›';
  next.disabled = currentPage === total;
  next.onclick = () => { currentPage++; render(); window.scrollTo(0, 0); };
  paginationEl.appendChild(next);
}

function setView(view) {
  currentView = view;
  document.getElementById('table-view').classList.toggle('active', view === 'table');
  document.getElementById('gallery-view').classList.toggle('active', view === 'gallery');
  document.getElementById('btn-table').classList.toggle('active', view === 'table');
  document.getElementById('btn-gallery').classList.toggle('active', view === 'gallery');
}

// Sorting
document.querySelectorAll('thead th[data-sort]').forEach(th => {
  th.onclick = () => {
    const field = th.dataset.sort;
    if (sortField === field) {
      sortDir *= -1;
    } else {
      sortField = field;
      sortDir = 1;
    }
    document.querySelectorAll('thead th').forEach(t => t.classList.remove('sorted'));
    th.classList.add('sorted');
    th.querySelector('.sort-arrow').textContent = sortDir === 1 ? '▲' : '▼';
    sortData();
    render();
  };
});

// Lightbox
function openLightbox(filteredIndex) {
  currentLightboxIndex = filteredIndex;
  const card = filteredData[filteredIndex];
  document.getElementById('lb-img').src = card.image;
  document.getElementById('lb-name').textContent = card.name;
  document.getElementById('lb-type').innerHTML = `<span class="type-badge ${card.type.toLowerCase().replace(/\s+/g, '-')}">${card.type}</span>`;
  document.getElementById('lb-number').textContent = '#' + card.number;
  document.getElementById('lb-cp').textContent = card.cp ? card.cp + ' CP' : '—';

  const specRow = document.getElementById('lb-spec-row');
  const specEl = document.getElementById('lb-spec');
  if (card.spec) {
    specRow.style.display = 'block';
    let specHtml = card.spec;
    if (textSearchTerm) {
      const re = new RegExp(`(${textSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      specHtml = specHtml.replace(re, '<mark>$1</mark>');
    }
    specEl.innerHTML = specHtml;
  } else {
    specRow.style.display = 'none';
  }

  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

function navLightbox(dir) {
  currentLightboxIndex = Math.max(0, Math.min(filteredData.length - 1, currentLightboxIndex + dir));
  openLightbox(currentLightboxIndex);
}

// Event listeners
filterName.addEventListener('input', applyFilters);
filterText.addEventListener('input', applyFilters);
filterType.addEventListener('change', applyFilters);
perPageSelect.addEventListener('change', () => {
  perPage = parseInt(perPageSelect.value);
  currentPage = 1;
  render();
});

// Keyboard nav
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
});

// Click outside lightbox
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});

// Init
applyFilters();
