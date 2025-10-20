// index.js - interactions for forum page
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const createReportBtn = document.getElementById('createReportBtn');
  const quickCreateBtn = document.getElementById('quickCreateBtn');
  const createModal = document.getElementById('createModal');
  const closeModal = document.getElementById('closeModal');
  const cancelCreate = document.getElementById('cancelCreate');
  const createForm = document.getElementById('createForm');
  const rPhoto = document.getElementById('r-photo');
  const photoPreview = document.getElementById('photoPreview');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const userMenuWrap = document.getElementById('userMenuWrap');
  const userPopup = document.getElementById('userPopup');
  const profileBtn = document.getElementById('profileBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const searchInput = document.getElementById('searchInput');
  const applyFilters = document.getElementById('applyFilters');

  // Open modal
  const openModal = () => {
    createModal.setAttribute('aria-hidden','false');
    // trap focus: focus first input
    const first = createForm.querySelector('input, textarea, select, button');
    if (first) first.focus();
  };
  const close = () => {
    createModal.setAttribute('aria-hidden','true');
  };

  [createReportBtn, quickCreateBtn].forEach(el => {
    if (el) el.addEventListener('click', openModal);
  });
  if (closeModal) closeModal.addEventListener('click', close);
  if (cancelCreate) cancelCreate.addEventListener('click', close);

  // click outside modal closes it
  if (createModal) {
    createModal.addEventListener('click', (e) => {
      if (e.target === createModal) close();
    });
  }

  // Photo preview
  if (rPhoto) {
    rPhoto.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) { photoPreview.innerHTML = ''; photoPreview.setAttribute('aria-hidden','true'); return; }
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      img.style.maxWidth = '100%';
      photoPreview.innerHTML = '';
      photoPreview.appendChild(img);
      photoPreview.setAttribute('aria-hidden','false');
    });
  }

  // Create form submit (client demo)
  if (createForm) {
    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('r-title').value.trim();
      const desc = document.getElementById('r-desc').value.trim();
      if(!title || !desc) return alert('Ingrese título y descripción');
      // In a real app: upload via fetch + FormData
      // For demo: append a new post to posts-col
      const postsCol = document.querySelector('.posts-col');
      const newPost = document.createElement('article');
      newPost.className = 'post-card';
      newPost.innerHTML = `
        <div class="vote-col">
          <button class="vote up">▲</button>
          <div class="score">0</div>
          <button class="vote down">▼</button>
        </div>
        <div class="post-main">
          <header class="post-header">
            <a class="post-tag">#${document.getElementById('r-tag').value}</a>
            <h3 class="post-title"><a href="#">${escapeHtml(title)}</a></h3>
            <div class="post-meta"><span class="muted">por <strong>tú</strong></span> · <span class="muted">ahora</span></div>
          </header>
          <div class="post-body"><p>${escapeHtml(desc)}</p></div>
          <footer class="post-actions"><button class="btn ghost tiny">💬 0</button></footer>
        </div>
      `;
      postsCol.prepend(newPost);
      close();
      createForm.reset();
      photoPreview.innerHTML = ''; photoPreview.setAttribute('aria-hidden','true');
    });
  }

  // load more (demo)
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => {
    // In real app: fetch next page. Here we just notify.
    loadMoreBtn.textContent = 'Cargando...';
    setTimeout(()=>{ loadMoreBtn.textContent = 'Cargar más'; alert('Simulación: carga de más reportes (implementa fetch en backend)'); }, 800);
  });

  // user popup toggle (profile/settings share same popup)
  const toggleUserPopup = (btn) => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    userPopup.setAttribute('aria-hidden', String(expanded));
  };
  if (profileBtn) profileBtn.addEventListener('click', (e)=> { e.stopPropagation(); toggleUserPopup(profileBtn); });
  if (settingsBtn) settingsBtn.addEventListener('click', (e)=> { e.stopPropagation(); toggleUserPopup(settingsBtn); });

  // close popup on outside click
  document.addEventListener('click', ()=> {
    if (userPopup) { userPopup.setAttribute('aria-hidden','true'); profileBtn && profileBtn.setAttribute('aria-expanded','false'); settingsBtn && settingsBtn.setAttribute('aria-expanded','false'); }
  });

  // simple search/filter demo - just highlight matches client-side
  if (applyFilters) applyFilters.addEventListener('click', () => {
    const q = (searchInput.value||'').toLowerCase().trim();
    const type = document.getElementById('filterType').value;
    const posts = document.querySelectorAll('.post-card');
    posts.forEach(p => {
      const title = (p.querySelector('.post-title')?.innerText||'').toLowerCase();
      const tag = (p.querySelector('.post-tag')?.innerText||'').toLowerCase();
      const matchesQ = !q || title.includes(q) || tag.includes(q);
      const matchesType = type === 'all' || tag.includes(type);
      p.style.display = (matchesQ && matchesType) ? '' : 'none';
    });
  });

  // small helper to avoid XSS-like injection in demo
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
