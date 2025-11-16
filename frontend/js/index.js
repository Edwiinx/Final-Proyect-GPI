// index.js - Bootstrap-aware interactions for the forum page
document.addEventListener('DOMContentLoaded', () => {
  // Bootstrap modal instance
  const createModalEl = document.getElementById('createModal');
  const createModal = createModalEl ? new bootstrap.Modal(createModalEl) : null;

  const createReportBtn = document.getElementById('createReportBtn');
  const quickCreateBtn = document.getElementById('quickCreateBtn');
  const submitCreate = document.getElementById('submitCreate');
  const rPhoto = document.getElementById('r-photo');
  const photoPreview = document.getElementById('photoPreview');
  const createForm = document.getElementById('createForm');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const postsList = document.getElementById('postsList');
  const applyFilters = document.getElementById('applyFilters');
  const searchInput = document.getElementById('searchInput');

  // Open modal handlers
  [createReportBtn, quickCreateBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      createModal && createModal.show();
      // focus first text control
      setTimeout(() => {
        const first = createForm.querySelector('input, textarea, select, button');
        if (first) first.focus();
      }, 200);
    });
  });

  // photo preview
  if (rPhoto) {
    rPhoto.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) { photoPreview.innerHTML = ''; photoPreview.setAttribute('aria-hidden','true'); return; }
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.className = 'img-fluid rounded';
      img.onload = () => URL.revokeObjectURL(img.src);
      photoPreview.innerHTML = '';
      photoPreview.appendChild(img);
      photoPreview.setAttribute('aria-hidden','false');
    });
  }

  // create form submit (demo: append card)
  if (submitCreate) {
    submitCreate.addEventListener('click', () => {
      const title = document.getElementById('r-title').value.trim();
      const desc = document.getElementById('r-desc').value.trim();
      if (!title || !desc) {
        alert('Ingrese título y descripción');
        return;
      }
      // Build new post card (simple)
      const card = document.createElement('article');
      card.className = 'card post-card overflow-hidden bg-wc-panel border-0';
      card.innerHTML = `
        <div class="row g-0 align-items-start">
          <div class="col-auto d-none d-md-flex vote-col p-3 flex-column align-items-center">
            <button class="btn btn-ghost-vote mb-1">▲</button>
            <div class="score fw-semibold">0</div>
            <button class="btn btn-ghost-vote mt-1">▼</button>
          </div>
          <div class="col">
            <div class="card-body">
              <a class="badge bg-wc-green text-dark mb-2" href="#">#${escapeHtml(document.getElementById('r-tag').value)}</a>
              <h5 class="card-title mb-1"><a href="#" class="text-decoration-none text-light">${escapeHtml(title)}</a></h5>
              <div class="text-muted small mb-2">por <strong class="text-light">tú</strong> · ahora</div>
              <p class="card-text text-muted mb-2">${escapeHtml(desc)}</p>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-wc btn-sm"><i class="bi bi-chat-left-text me-1"></i> 0</button>
                <button class="btn btn-outline-wc btn-sm"><i class="bi bi-share-fill me-1"></i> Compartir</button>
              </div>
            </div>
          </div>
        </div>`;
      postsList.prepend(card);
      // reset form
      createForm.reset();
      photoPreview.innerHTML = ''; photoPreview.setAttribute('aria-hidden','true');
      createModal && createModal.hide();
    });
  }

  // load more demo
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Cargando...';
      setTimeout(() => {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Cargar más';
        // In real app: fetch next page and append nodes
        alert('Simulación: carga de más reportes (implementa fetch en backend)');
      }, 800);
    });
  }

  // basic filters (client-side demo)
  if (applyFilters) {
    applyFilters.addEventListener('click', () => {
      const q = (searchInput.value || '').toLowerCase();
      const type = (document.getElementById('filterType') && document.getElementById('filterType').value) || 'all';
      const posts = postsList.querySelectorAll('.post-card');
      posts.forEach(p => {
        const title = (p.querySelector('.card-title')?.innerText || '').toLowerCase();
        const tag = (p.querySelector('.badge')?.innerText || '').toLowerCase();
        const matchQ = !q || title.includes(q) || tag.includes(q);
        const matchType = type === 'all' || tag.includes(type);
        p.style.display = (matchQ && matchType) ? '' : 'none';
      });
    });
  }

  // helper
  function escapeHtml(text){
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
