/* --------- Settings popover (compact, igual que index) --------- */
(function () {
  const cfgBtn = document.getElementById('configBtn');
  const THEME_KEY = 'wc_theme_mode'; // 'dark' | 'light'

  function applyTheme(theme) {
    if (theme === 'light') document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#0b0b0b');
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }
  function getSavedTheme() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }

  let popEl = null;
  function createSettingsPopover() {
    if (popEl) return popEl;
    popEl = document.createElement('div');
    popEl.id = 'wc-settings-pop';
    popEl.className = 'wc-settings-pop bg-wc-panel rounded shadow-sm';
    popEl.setAttribute('role','dialog');
    popEl.setAttribute('aria-modal','false');
    popEl.innerHTML = `
      <div class="pop-title">Configuración</div>
      <div class="pop-row">
        <div>
          <div class="small text-muted">Apariencia</div>
          <div class="fw-semibold">Modo claro / oscuro</div>
        </div>
        <div class="wc-toggle" style="align-items:center">
          <div id="wcThemeSwitch" class="wc-switch" role="switch" tabindex="0" aria-checked="false" aria-label="Alternar tema"></div>
        </div>
      </div>
      <div class="pop-row">
        <div>
          <div class="small text-muted">Preferencias</div>
          <div class="fw-semibold">Restablecer tema</div>
        </div>
        <div>
          <button id="wcResetTheme" class="btn btn-outline-wc btn-sm">Restablecer</button>
        </div>
      </div>
      <div class="mt-2" style="padding-top:.25rem;font-size:.85rem;color:var(--wc-muted)">Tema guardado en este navegador.</div>
    `;
    document.body.appendChild(popEl);

    // wire controls
    const sw = popEl.querySelector('#wcThemeSwitch');
    const resetBtn = popEl.querySelector('#wcResetTheme');

    function setSwitch(theme) {
      const checked = theme === 'light';
      sw.setAttribute('aria-checked', checked ? 'true' : 'false');
      if (checked) sw.classList.add('on'); else sw.classList.remove('on');
    }

    sw.addEventListener('click', () => {
      const cur = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      const next = cur === 'light' ? 'dark' : 'light';
      applyTheme(next);
      setSwitch(next);
    });
    sw.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sw.click(); }
    });

    resetBtn.addEventListener('click', () => {
      applyTheme('dark');
      setSwitch('dark');
    });

    return popEl;
  }

  function togglePopover(show) {
    const pop = createSettingsPopover();
    if (!cfgBtn) return;
    if (show === undefined) show = (pop.style.display !== 'block');
    if (show) {
      // position
      pop.style.display = 'block';
      pop.style.position = 'absolute';
      pop.style.left = '0px'; pop.style.top = '0px'; // reset to compute width
      const r = cfgBtn.getBoundingClientRect();
      const left = Math.max(8, r.left + window.scrollX - (pop.offsetWidth/2) + (r.width/2));
      let top = r.bottom + window.scrollY + 8;
      if (top + pop.offsetHeight > window.innerHeight) top = r.top + window.scrollY - pop.offsetHeight - 8;
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
      cfgBtn.setAttribute('aria-expanded','true');

      // sync switch state
      const curTheme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
      const sw = pop.querySelector('#wcThemeSwitch');
      if (sw) sw.setAttribute('aria-checked', curTheme === 'light' ? 'true' : 'false');
      if (curTheme === 'light') sw.classList.add('on'); else sw.classList.remove('on');

      setTimeout(()=> document.addEventListener('click', onDocClick), 20);
    } else {
      pop.style.display = 'none';
      cfgBtn.setAttribute('aria-expanded','false');
      document.removeEventListener('click', onDocClick);
    }
  }

  function onDocClick(e) {
    const pop = createSettingsPopover();
    if (!pop.contains(e.target) && e.target !== cfgBtn) togglePopover(false);
  }

  if (cfgBtn) {
    cfgBtn.addEventListener('click', (ev) => { ev.stopPropagation(); togglePopover(); });
    cfgBtn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); togglePopover(); }
      else if (ev.key === 'Escape') togglePopover(false);
    });
  }

  // apply saved theme at start
  const saved = getSavedTheme();
  applyTheme(saved === 'light' ? 'light' : 'dark');

  // expose API
  window.WCSettings = { applyTheme, togglePopover: () => togglePopover(true), closePopover: () => togglePopover(false) };
})();
