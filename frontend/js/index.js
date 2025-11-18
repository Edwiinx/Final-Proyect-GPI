// index.js - versión simplificada y lista para conectar con backend
document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const postsList = document.getElementById('postsList');
  const postTemplate = document.getElementById('postTemplate');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const quickCreateBtn = document.getElementById('quickCreateBtn');
  const createModalEl = document.getElementById('createModal');
  const createModal = createModalEl ? new bootstrap.Modal(createModalEl) : null;
  const createForm = document.getElementById('createForm');
  const submitCreate = document.getElementById('submitCreate');
  const rPhoto = document.getElementById('r-photo');
  const photoPreview = document.getElementById('photoPreview');
  const searchInput = document.getElementById('searchInput');
  const tagsWrap = document.getElementById('tagsWrap');
  const configBtn = document.getElementById('configBtn');

  // Pagination state
  let page = 1;
  const pageSize = 10;
  let loading = false;
  let hasMore = true;

  // API endpoints (ajusta a tu backend)
  const API = {
    list: (p = 1, size = pageSize) => `/api/posts?page=${p}&size=${size}`, // GET
    create: () => '/api/posts' // POST (multipart/form-data)
  };

  // Utility: escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Render one post object (expects fields: id, title, excerpt, tag, author, createdAt, photoUrl, score, commentsCount)
  function renderPost(post, prepend = false) {
    if (!postTemplate) return;
    const node = postTemplate.content.cloneNode(true);
    const article = node.querySelector('article');
    article.dataset.id = post.id;

    const tagEl = node.querySelector('.tag');
    tagEl.textContent = `#${post.tag || 'general'}`;

    const titleLink = node.querySelector('.post-link');
    titleLink.textContent = post.title || 'Sin título';
    titleLink.href = `post.html?id=${encodeURIComponent(post.id)}`;

    const meta = node.querySelector('.meta');
    const when = post.createdAt ? new Date(post.createdAt).toLocaleString() : 'ahora';
    meta.textContent = `por ${post.author || 'anon'} · ${when} · ${post.commentsCount || 0} comentarios`;

    const excerpt = node.querySelector('.excerpt');
    excerpt.textContent = post.excerpt || (post.description ? post.description.slice(0, 180) : '');

    const score = node.querySelector('.score');
    score.textContent = post.score != null ? String(post.score) : '0';

    // image
    const media = node.querySelector('.post-media');
    if (post.photoUrl) {
      const img = node.querySelector('img');
      img.src = post.photoUrl;
      img.alt = post.title || 'Imagen del reporte';
      media.style.display = '';
    } else {
      media.style.display = 'none';
    }

    // comments count on button
    const commentBtn = node.querySelector('.btn-comment');
    commentBtn.innerHTML = `<i class="bi bi-chat-left-text me-1"></i>${post.commentsCount || 0}`;

    // actions: delegate events
    if (prepend) postsList.prepend(node);
    else postsList.append(node);
  }

  // Load posts from API (append)
  async function loadPosts(p = 1) {
    if (loading || !hasMore) return;
    loading = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Cargando...';

    try {
      const res = await fetch(API.list(p), { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Error al obtener posts');
      const data = await res.json();
      // Expect data: { items: [...], hasMore: true/false }
      const items = data.items || [];
      items.forEach(item => renderPost(item, false));
      hasMore = data.hasMore !== false && items.length === pageSize; // simple heuristic
      page = p;
    } catch (err) {
      console.error(err);
      alert('No se pudieron cargar reportes.');
    } finally {
      loading = false;
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = hasMore ? 'Cargar más' : 'No hay más';
    }
  }

  // Create report (POST). Uses FormData to support images.
  async function createReport() {
    const form = createForm;
    const title = (form.querySelector('[name="title"]').value || '').trim();
    const description = (form.querySelector('[name="description"]').value || '').trim();
    const tag = (form.querySelector('[name="tag"]').value || 'garbage');
    const photo = rPhoto && rPhoto.files && rPhoto.files[0];

    if (!title || !description) {
      alert('Ingrese título y descripción.');
      return;
    }

    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    fd.append('tag', tag);
    if (photo) fd.append('photo', photo);

    submitCreate.disabled = true;
    submitCreate.textContent = 'Publicando...';

    try {
      const res = await fetch(API.create(), { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al publicar');
      }
      const saved = await res.json();
      // saved should be the created post object
      renderPost(saved, true); // prepend new post
      // reset form & close modal
      form.reset();
      photoPreview.innerHTML = '';
      createModal && createModal.hide();
    } catch (err) {
      console.error(err);
      alert('No se pudo publicar el reporte.');
    } finally {
      submitCreate.disabled = false;
      submitCreate.textContent = 'Publicar';
    }
  }

  // Delegated handler for post actions (vote, comment, share)
  postsList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const article = btn.closest('article');
    const postId = article && article.dataset.id;
    if (!postId) return;

    if (action === 'vote-up' || action === 'vote-down') {
      // TODO: call API to register vote
      // For demo: increment/decrement UI
      const scoreEl = article.querySelector('.score');
      let score = parseInt(scoreEl.textContent || '0', 10);
      score = action === 'vote-up' ? score + 1 : score - 1;
      scoreEl.textContent = String(score);
      // call fetch(`/api/posts/${postId}/vote`, {method:'POST', body: JSON.stringify({vote: action})})
    } else if (action === 'comment') {
      // open post page
      window.location.href = `post.html?id=${encodeURIComponent(postId)}`;
    } else if (action === 'share') {
      // navigator.share where available
      const link = location.origin + `/post.html?id=${encodeURIComponent(postId)}`;
      if (navigator.share) navigator.share({ title: 'Reporte', url: link }).catch(()=>{});
      else prompt('Copiar enlace:', link);
    }
  });

  // Photo preview
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

// Quick create button usando SweetAlert2 moderno
if (quickCreateBtn) {
  quickCreateBtn.addEventListener('click', async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Crear reporte',
      html: `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <input id="sw-title" class="swal2-input" placeholder="Título">
          <textarea id="sw-desc" class="swal2-textarea" placeholder="Descripción" style="height:80px;"></textarea>
          <select id="sw-tag" class="swal2-select">
            <option value="garbage">#garbage</option>
            <option value="saneamiento">#saneamiento</option>
            <option value="mantenimiento">#mantenimiento</option>
          </select>
          <input type="file" id="sw-photo" class="swal2-file" accept="image/*">
          <div id="sw-photo-preview" style="display:none; text-align:center;">
            <img id="sw-photo-img" style="max-width:100%; border-radius:8px; margin-top:8px;" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Publicar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'swal2-rounded',
        title: 'fw-bold',
        confirmButton: 'btn btn-wc-primary',
        cancelButton: 'btn btn-outline-wc'
      },
      backdrop: `
        rgba(0,0,0,0.5)
        url("https://i.gifer.com/YCZH.gif")
        left top
        no-repeat
      `,
      didOpen: () => {
        const photoInput = document.getElementById('sw-photo');
        const previewDiv = document.getElementById('sw-photo-preview');
        const previewImg = document.getElementById('sw-photo-img');
        photoInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) { previewDiv.style.display = 'none'; return; }
          previewImg.src = URL.createObjectURL(file);
          previewDiv.style.display = 'block';
        });
      },
      preConfirm: () => {
        const title = document.getElementById('sw-title').value.trim();
        const desc = document.getElementById('sw-desc').value.trim();
        const tag = document.getElementById('sw-tag').value;
        const photoInput = document.getElementById('sw-photo');
        const photo = photoInput.files && photoInput.files[0];
        if (!title || !desc) {
          Swal.showValidationMessage('Debes ingresar título y descripción');
          return false;
        }
        return { title, desc, tag, photo };
      }
    });

    if (!formValues) return; // Cancelado

    // Enviar reporte al backend
    const fd = new FormData();
    fd.append('title', formValues.title);
    fd.append('description', formValues.desc);
    fd.append('tag', formValues.tag);
    if (formValues.photo) fd.append('photo', formValues.photo);

    try {
      const res = await fetch(API.create(), { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error al publicar');
      const saved = await res.json();
      renderPost(saved, true); // agregar al feed
      Swal.fire({
        icon: 'success',
        title: 'Publicado',
        text: 'Tu reporte ha sido creado',
        timer: 1500,
        showConfirmButton: false,
        backdrop: 'rgba(0,0,0,0.3)'
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo publicar el reporte', 'error');
    }
  });
}



  // THEME: simple toggle stored in localStorage
  (function themeToggle() {
    const THEME_KEY = 'wc_theme_mode'; // 'dark' | 'light'
    function applyTheme(t) {
      if (t === 'light') document.body.classList.add('theme-light');
      else document.body.classList.remove('theme-light');
      try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t === 'light' ? '#ffffff' : '#0b0b0b');
    }
    // Load saved or default to dark
    const saved = (function(){ try { return localStorage.getItem(THEME_KEY); } catch(e){ return null; }})();
    applyTheme(saved === 'light' ? 'light' : 'dark');

    // simple popover on configBtn: toggle theme on click (you can replace with full popover)
    if (configBtn) {
      configBtn.addEventListener('click', () => {
        const isLight = document.body.classList.contains('theme-light');
        applyTheme(isLight ? 'dark' : 'light');
      });
    }
    // expose API
    window.WCSettings = { applyTheme };
  })();

  // Initial load
  loadPosts(1);
});
