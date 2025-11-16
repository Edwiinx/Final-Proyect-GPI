// admin.js - Panel administrativo (demo, client-side)
// Features:
// - carga demo reports (o desde localStorage)
// - renderiza cards con opciones: editar, eliminar, cambiar estado, comentar
// - edit modal permite editar título/desc/tag/estado y agregar comentarios
// - persistencia en localStorage (demo). Reemplaza por API fácil.

document.addEventListener('DOMContentLoaded', () => {
  // keys
  const STORAGE_KEY = 'wc_admin_reports_v1';

  // elements
  const reportsWrap = document.getElementById('reportsWrap');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const filterStatus = document.getElementById('filterStatus');
  const filterTag = document.getElementById('filterTag');
  const sortBy = document.getElementById('sortBy');
  const adminSearch = document.getElementById('adminSearch');
  const loadMore = document.getElementById('loadMore');
  const createFake = document.getElementById('createFake');
  const clearAll = document.getElementById('clearAll');

  // modal elements
  const reportModalEl = document.getElementById('reportModal');
  const reportModal = new bootstrap.Modal(reportModalEl);
  const editForm = document.getElementById('editForm');
  const editId = document.getElementById('editId');
  const editTitle = document.getElementById('editTitle');
  const editDesc = document.getElementById('editDesc');
  const editTag = document.getElementById('editTag');
  const editStatus = document.getElementById('editStatus');
  const commentsList = document.getElementById('commentsList');
  const newCommentInput = document.getElementById('newCommentInput');
  const addCommentBtn = document.getElementById('addCommentBtn');

  const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
  let deleteTargetId = null;

  // sample data (id incremental)
  const sampleReports = [
    { id: 101, title: "Basura acumulada en la calle 7", description: "Se observa acumulación de bolsas y escombros en la esquina frente al colegio. El flujo peatonal está afectado.", tag: "garbage", author: "juanp", createdAt: Date.now()-3600*1000*5, votes: 128, comments: [{by:'operaciones', text:'Lo hemos reportado al camión recolector.'}], status: "nuevo" },
    { id: 102, title: "Alcantarilla obstruida en avenida principal", description: "El agua no drena tras lluvias; es urgente revisar tapa y canal.", tag: "saneamiento", author: "maria", createdAt: Date.now()-3600*1000*26, votes: 64, comments: [], status: "en_proceso" },
    { id: 103, title: "Foco quemado en parque central", description: "Hace 3 noches que hay un foco apagado en la esquina norte del parque.", tag: "iluminacion", author: "carlos", createdAt: Date.now()-3600*1000*60, votes: 8, comments: [], status: "sin_realizar" },
  ];

  // load from storage or init
  function loadReports() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleReports));
      return sampleReports.slice();
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleReports));
      return sampleReports.slice();
    }
  }

  function saveReports(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  let reports = loadReports();

  // helpers
  function formatTime(ts) {
    const diff = Date.now() - ts;
    const hrs = Math.floor(diff / (3600*1000));
    if (hrs < 1) return 'hace minutos';
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs/24);
    return `hace ${days}d`;
  }

  function statusBadge(status) {
    const map = {
      nuevo: ['badge-nuevo','Nuevo'],
      en_proceso: ['badge-en_proceso','En proceso'],
      hecho: ['badge-hecho','Hecho'],
      sin_realizar: ['badge-sin_realizar','Sin realizar']
    };
    const res = map[status] || ['badge-nuevo','Nuevo'];
    return `<span class="badge ${res[0]}">${res[1]}</span>`;
  }

  // render single card
  function renderReportCard(r) {
    const div = document.createElement('div');
    div.className = 'report-card';
    div.dataset.id = r.id;
    div.innerHTML = `
      <div class="report-meta">
        <button class="btn btn-sm btn-outline-wc vote-btn" data-id="${r.id}" title="Votos">▲</button>
        <div class="vote">${r.votes}</div>
        <button class="btn btn-sm btn-outline-wc downvote-btn" data-id="${r.id}" title="Dislike">▼</button>
      </div>

      <div class="post-main">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="tag-chip">${'#' + r.tag}</div>
            <h4 class="post-title">${escapeHtml(r.title)}</h4>
            <div class="small-muted">por <strong>${escapeHtml(r.author)}</strong> · ${formatTime(r.createdAt)} · ${r.comments.length} comentarios</div>
          </div>

          <div class="text-end">
            <div class="mb-2">${statusBadge(r.status)}</div>
            <div class="actions-group">
              <button class="btn btn-sm btn-outline-wc view-btn" data-id="${r.id}" title="Ver / Editar"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-outline-wc edit-btn" data-id="${r.id}" title="Editar"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-ghost-wc del-btn" data-id="${r.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>

        <p class="post-desc mt-2">${escapeHtml(r.description)}</p>

        <div class="d-flex gap-2 align-items-center small-muted">
          <label class="me-2">Cambiar estado:</label>
          <select class="form-select form-select-sm change-status" data-id="${r.id}" style="width:auto;">
            <option value="nuevo"${r.status==='nuevo'?' selected':''}>Nuevo</option>
            <option value="en_proceso"${r.status==='en_proceso'?' selected':''}>En proceso</option>
            <option value="hecho"${r.status==='hecho'?' selected':''}>Hecho</option>
            <option value="sin_realizar"${r.status==='sin_realizar'?' selected':''}>Sin realizar</option>
          </select>

          <button class="btn btn-sm btn-outline-wc ms-auto comment-open" data-id="${r.id}"><i class="bi bi-chat-left-text"></i> Comentarios (${r.comments.length})</button>
        </div>
      </div>
    `;
    return div;
  }

  // escape helper
  function escapeHtml(s='') {
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  // render all (with filters)
  function renderList(list) {
    reportsWrap.innerHTML = '';
    if (!list.length) {
      reportsWrap.innerHTML = `<div class="card wc-panel p-3 text-center text-muted">No hay reportes (usa "Agregar reporte demo").</div>`;
      return;
    }
    list.forEach(r => {
      reportsWrap.appendChild(renderReportCard(r));
    });
  }

  // filter/sort/search
  function applyFilters() {
    const st = filterStatus.value || 'all';
    const tg = filterTag.value || 'all';
    const so = sortBy.value || 'recent';
    const q = adminSearch.value?.trim().toLowerCase() || '';

    let out = reports.slice();

    if (st !== 'all') out = out.filter(r => r.status === st);
    if (tg !== 'all') out = out.filter(r => r.tag === tg);
    if (q) {
      out = out.filter(r => (r.title + ' ' + r.description + ' ' + r.author + ' ' + r.tag).toLowerCase().includes(q));
    }

    if (so === 'recent') out.sort((a,b)=> b.createdAt - a.createdAt);
    else if (so === 'votes') out.sort((a,b)=> b.votes - a.votes);
    else if (so === 'comments') out.sort((a,b)=> b.comments.length - a.comments.length);

    renderList(out);
  }

  // event delegation for list buttons
  reportsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (!id) return;

    if (btn.classList.contains('view-btn') || btn.classList.contains('edit-btn')) {
      openEditModal(id);
      return;
    }
    if (btn.classList.contains('del-btn')) {
      deleteTargetId = id;
      confirmDeleteModal.show();
      return;
    }
    if (btn.classList.contains('vote-btn')) {
      vote(id, +1);
      return;
    }
    if (btn.classList.contains('downvote-btn')) {
      vote(id, -1);
      return;
    }
    if (btn.classList.contains('comment-open')) {
      openEditModal(id);
      return;
    }
  });

  // status change select
  reportsWrap.addEventListener('change', (e) => {
    const sel = e.target.closest('select.change-status');
    if (!sel) return;
    const id = Number(sel.dataset.id);
    const val = sel.value;
    updateReportStatus(id, val);
  });

  // Update status function
  function updateReportStatus(id, status) {
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return;
    reports[idx].status = status;
    saveReports(reports);
    applyFilters();
  }

  // voting
  function vote(id, delta) {
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return;
    reports[idx].votes = Math.max(0, (reports[idx].votes || 0) + delta);
    saveReports(reports);
    applyFilters();
  }

  // open edit modal (view/edit)
  function openEditModal(id) {
    const r = reports.find(x=>x.id === id);
    if (!r) return;
    editId.value = r.id;
    editTitle.value = r.title;
    editDesc.value = r.description;
    editTag.value = r.tag;
    editStatus.value = r.status;
    renderComments(r.comments);
    reportModal.show();
  }

  // render comments in modal
  function renderComments(list) {
    commentsList.innerHTML = '';
    if (!list || !list.length) {
      commentsList.innerHTML = '<div class="small text-muted">Sin comentarios</div>';
      return;
    }
    list.forEach(c => {
      const d = document.createElement('div');
      d.className = 'comment-item';
      d.innerHTML = `<div><strong>${escapeHtml(c.by)}</strong> <span class="comment-meta">· ${escapeHtml(c.text)}</span></div>`;
      commentsList.appendChild(d);
    });
  }

  // add comment btn
  addCommentBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    const id = Number(editId.value);
    const text = newCommentInput.value.trim();
    if (!text) return;
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return;
    const comment = { by: 'admin', text, at: Date.now() };
    reports[idx].comments.push(comment);
    saveReports(reports);
    renderComments(reports[idx].comments);
    newCommentInput.value = '';
    applyFilters();
  });

  // edit form submit (save changes)
  editForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const id = Number(editId.value);
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return;
    reports[idx].title = editTitle.value.trim();
    reports[idx].description = editDesc.value.trim();
    reports[idx].tag = editTag.value;
    reports[idx].status = editStatus.value;
    saveReports(reports);
    reportModal.hide();
    applyFilters();
  });

  // delete confirm
  document.getElementById('confirmDelete').addEventListener('click', () => {
    if (!deleteTargetId) return;
    reports = reports.filter(r => r.id !== deleteTargetId);
    saveReports(reports);
    deleteTargetId = null;
    confirmDeleteModal.hide();
    applyFilters();
  });

  // filters
  applyFiltersBtn.addEventListener('click', applyFilters);
  adminSearch.addEventListener('keyup', (e) => { if (e.key === 'Enter') applyFilters(); });
  loadMore.addEventListener('click', () => {
    // create fake entries (demo)
    const base = Date.now();
    for (let i=0;i<3;i++){
      const id = Math.floor(Math.random()*900)+200 + i;
      reports.push({ id, title:`Reporte demo ${id}`, description:'Generado desde carga demo.', tag: 'mantenimiento', author:'demo', createdAt: base - i*60000, votes:0, comments:[], status:'nuevo' });
    }
    saveReports(reports);
    applyFilters();
  });

  createFake && createFake.addEventListener('click', () => {
    const id = Math.floor(Math.random()*10000)+200;
    reports.unshift({ id, title:`Reporte demo ${id}`, description:'Reporte creado manualmente por admin (demo).', tag:'garbage', author:'admin', createdAt: Date.now(), votes:0, comments:[], status:'nuevo' });
    saveReports(reports);
    applyFilters();
  });

  clearAll && clearAll.addEventListener('click', () => {
    if (!confirm('Limpiar todos los reportes guardados localmente?')) return;
    localStorage.removeItem(STORAGE_KEY);
    reports = loadReports();
    applyFilters();
  });

  // initial render
  applyFilters();

  // expose small utility (for social login buttons that may try to hide chooser)
  window.WC_admin = { applyFilters, getReports: () => reports };

});
