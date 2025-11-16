/* auth.js — Versión corregida y limpia
   Funcionalidad:
   - Mostrar panel signin/register (usa triggers Bootstrap si existen)
   - Animaciones repetibles (fade, pane-enter, shake)
   - Oculta botones sociales en signin si existe contenedor
   - Validación básica cliente para signin/register (muestra errores inline)
   - Overlay invitado
   Requisitos HTML: ids referenciados en el script (ver notas al final)
*/

document.addEventListener('DOMContentLoaded', function () {
  // ---------- elementos principales ----------
  var hero = document.querySelector('.wc-hero');
  var authPanel = document.getElementById('authPanel');
  var chooserInline = document.getElementById('chooserInline');
  var placeholder = document.getElementById('authPlaceholder');
  var tabsContent = document.getElementById('authTabsContent');

  // botones (desktop + mobile)
  var inlineSignIn = document.getElementById('inlineSignIn');
  var inlineRegister = document.getElementById('inlineRegister');
  var inlineGuest = document.getElementById('inlineGuest');
  var mobileSignIn = document.getElementById('mobileSignIn');
  var mobileRegister = document.getElementById('mobileRegister');
  var mobileGuest = document.getElementById('mobileGuest');

  // triggers ocultos (Bootstrap)
  var signinTabBtn = document.getElementById('signin-tab');
  var registerTabBtn = document.getElementById('register-tab');

  // forms
  var signinForm = document.getElementById('signinForm');
  var registerForm = document.getElementById('registerForm');

  // contenedor botones sociales (opcional)
  var socialButtons = document.getElementById('socialButtons') || document.querySelector('.social-auth');

  // ---------- utilidades ----------
  function forceReflow(el) {
    if (!el) return;
    void el.offsetWidth;
  }

  function runFade(el) {
    if (!el) return;
    el.classList.remove('wc-fade-in');
    forceReflow(el);
    el.classList.add('wc-fade-in');
  }

  function runPaneAnim(pane) {
    if (!pane) return;
    pane.classList.remove('pane-enter');
    forceReflow(pane);
    pane.classList.add('pane-enter');
  }

  function runShake(el) {
    if (!el) return;
    el.classList.remove('wc-shake');
    forceReflow(el);
    el.classList.add('wc-shake');
    window.setTimeout(function () {
      el.classList.remove('wc-shake');
    }, 600);
  }

  // ---------- control area auth ----------
  function unlockAuthArea() {
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    if (tabsContent) {
      tabsContent.classList.remove('auth-locked');
      tabsContent.classList.add('auth-unlocked');
      tabsContent.setAttribute('aria-hidden', 'false');
    }
    if (chooserInline && chooserInline.parentNode) {
      chooserInline.parentNode.removeChild(chooserInline);
    }
    if (authPanel) {
      authPanel.style.boxShadow = '0 18px 48px rgba(0,0,0,0.55)';
    }
    runFade(authPanel);
    runFade(hero);
  }

  // ---------- social buttons control ----------
  function hideSocialButtons(hide) {
    if (!socialButtons) return;
    if (hide) {
      socialButtons.dataset.prevDisplay = socialButtons.style.display || '';
      socialButtons.style.display = 'none';
    } else {
      socialButtons.style.display = socialButtons.dataset.prevDisplay || '';
      delete socialButtons.dataset.prevDisplay;
    }
  }

  // ---------- mostrar pestaña ----------
  function manualShowPane(selector) {
    if (!tabsContent) unlockAuthArea();
    var panes = document.querySelectorAll('#authTabsContent .tab-pane');
    Array.prototype.forEach.call(panes, function (p) {
      p.classList.remove('show', 'active');
    });
    var pane = document.querySelector(selector);
    if (!pane) return;
    pane.classList.add('show', 'active');
    runPaneAnim(pane);
    runFade(authPanel);
    runFade(hero);
  }

  function showAuthPane(targetTabId) {
    unlockAuthArea();

    if (targetTabId === 'signin-tab') {
      hideSocialButtons(true);
    } else {
      hideSocialButtons(false);
    }

    var tabBtn = document.getElementById(targetTabId);
    if (tabBtn && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
      try {
        var tab = new bootstrap.Tab(tabBtn);
        tab.show();
        var sel = tabBtn.getAttribute('data-bs-target') || tabBtn.dataset && tabBtn.dataset.bsTarget;
        var pane = sel ? document.querySelector(sel) : null;
        window.setTimeout(function () { runPaneAnim(pane); }, 80);
      } catch (e) {
        // fallback manual
        manualShowPane(targetTabId === 'signin-tab' ? '#signin' : '#register');
      }
      runFade(authPanel);
      runFade(hero);
      return;
    }

    // fallback
    manualShowPane(targetTabId === 'signin-tab' ? '#signin' : '#register');
  }

// ---------- overlay invitado (mejorado: persiste hasta que index.html termine de cargar) ----------
// ---------- overlay invitado (mejorado) ----------
// usage: showGuestOverlayAndGo(ms, allowBack)
// ms = tiempo visual de la barra (ej. 3000)
// allowBack = true -> navegación con history (se podrá volver atrás)
// allowBack = false -> navigation.replace (no se podrá volver atrás)

function showGuestOverlayAndGo(ms, allowBack) {
  ms = typeof ms === 'number' ? ms : 2000;
  allowBack = typeof allowBack === 'boolean' ? allowBack : true;

  // si ya existe overlay, no crear otro
  if (document.querySelector('.wc-loading-overlay')) return;

  // crear overlay bloqueante (no tocamos el DOM del authPanel)
  var overlay = document.createElement('div');
  overlay.className = 'wc-loading-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-busy', 'true');
  overlay.innerHTML = '\
    <div class="wc-loading-panel">\
      <div class="wc-spinner" aria-hidden="true"></div>\
      <div class="wc-loading-text">Entrando como invitado…</div>\
      <div class="wc-progress" aria-hidden="true"><i></i></div>\
    </div>';

  // estilos mínimos inline para asegurar bloqueo y el fondo difuminado (puedes moverlos a CSS)
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.zIndex = '999999';
  overlay.style.background = 'rgba(0,0,0,0.72)';
  overlay.style.backdropFilter = 'blur(8px)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.pointerEvents = 'auto';
  overlay.style.transition = 'opacity .28s ease';
  document.body.appendChild(overlay);

  // animar barra progresiva (visual)
  var bar = overlay.querySelector('.wc-progress > i');
  if (bar) {
    bar.style.display = 'block';
    bar.style.width = '0%';
    bar.style.height = '4px';
    bar.style.background = 'rgba(255,255,255,0.95)';
    bar.style.borderRadius = '2px';
    forceReflow(bar);
    bar.style.transition = 'width ' + ms + 'ms linear';
    window.requestAnimationFrame(function () { bar.style.width = '100%'; });
  }

  // marcamos en sessionStorage para que index.html pueda continuar mostrando overlay hasta finish
  try { sessionStorage.setItem('wc_guest_loading', Date.now().toString()); } catch (e) { /* ignore */ }

  // listeners para permitir remover overlay si el usuario presiona Back/ESC ANTES de navegar
  function removeOverlayNow() {
    try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (e) {}
    try { sessionStorage.removeItem('wc_guest_loading'); } catch (e) {}
    window.removeEventListener('popstate', onPop);
    window.removeEventListener('keydown', onKey);
  }
  function onPop() { removeOverlayNow(); }
  function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') removeOverlayNow(); }

  // registramos si permitimos volver atrás (solo tiene efecto en la navegación que viene)
  if (allowBack) {
    // Si permitimos Back, no usamos replace para la navegación.
    // En este caso no añadimos lógica extra aquí: la navegación con href permitirá volver.
    // Pero en la pantalla de auth detectamos popstate para quitar overlay si el usuario presiona atrás ANTES de navegar.
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
  } else {
    // si NO permitimos Back, igualmente queremos escuchar ESC/pop antes de navegar por si el usuario cancela.
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
  }

  // Retardo mínimo (por ejemplo para que el overlay sea visible al menos 3s)
  var minDelay = Math.max(ms, 2000); // garantiza al menos 3000ms aunque ms sea menor
  setTimeout(function () {
    // limpiamos listeners de la página actual (no queremos que queden colgando)
    window.removeEventListener('popstate', onPop);
    window.removeEventListener('keydown', onKey);

    // navegamos al index
    try {
      // Si allowBack=true -> usamos href (permite volver). Si false -> replace (no permite volver).
      if (allowBack) {
        window.location.href = 'index.html';
      } else {
        window.location.replace('index.html');
      }
    } catch (e) {
      // fallback
      window.location.href = 'index.html';
    }
  }, minDelay);
}


  // ---------- validación y errores UI ----------
  function createOrGetFeedback(input) {
    if (!input || !input.parentNode) return null;
    var fb = input.parentNode.querySelector('.invalid-feedback');
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      fb.setAttribute('aria-live', 'polite');
      input.parentNode.appendChild(fb);
    }
    return fb;
  }

  function showFieldError(input, message) {
    if (!input) return;
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    var fb = createOrGetFeedback(input);
    if (fb) fb.textContent = message;
    var pane = input.closest && input.closest('.tab-pane') ? input.closest('.tab-pane') : authPanel;
    runShake(pane);
  }

  function clearFieldError(input) {
    if (!input) return;
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    var fb = input.parentNode.querySelector('.invalid-feedback');
    if (fb) fb.textContent = '';
  }

  function clearFormErrors(form) {
    if (!form) return;
    var invalids = form.querySelectorAll('.is-invalid');
    Array.prototype.forEach.call(invalids, function (i) { clearFieldError(i); });
  }

  function isValidEmail(val) {
    if (!val) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  // crea announcer accesible si no existe
  function createAnnouncer() {
    var ann = document.getElementById('authAnnounce');
    if (!ann) {
      ann = document.createElement('div');
      ann.id = 'authAnnounce';
      ann.setAttribute('aria-live', 'polite');
      ann.setAttribute('aria-atomic', 'true');
      ann.style.position = 'absolute';
      ann.style.left = '-9999px';
      ann.style.width = '1px';
      ann.style.height = '1px';
      ann.style.overflow = 'hidden';
      document.body.appendChild(ann);
    }
    return ann;
  }

  // ---------- simuladores (placeholder) ----------
  function simulateServerSignIn(form) {
    var submit = form ? form.querySelector('button[type="submit"]') : null;
    if (submit) {
      submit.disabled = true;
      var prev = submit.innerHTML;
      submit.innerHTML = 'Entrando…';
      window.setTimeout(function () {
        submit.disabled = false;
        submit.innerHTML = prev;
        window.location.href = 'index.html';
      }, 1100);
    } else {
      window.setTimeout(function () { window.location.href = 'index.html'; }, 1100);
    }
  }

  function simulateServerRegister(form) {
    var submit = form ? form.querySelector('button[type="submit"]') : null;
    if (submit) {
      submit.disabled = true;
      var prev = submit.innerHTML;
      submit.innerHTML = 'Registrando…';
      window.setTimeout(function () {
        submit.disabled = false;
        submit.innerHTML = prev;
        window.alert('Registro completado (simulado). Ahora puedes iniciar sesión.');
        showAuthPane('signin-tab');
      }, 1200);
    } else {
      window.setTimeout(function () {
        window.alert('Registro completado (simulado).');
        showAuthPane('signin-tab');
      }, 1200);
    }
  }

  // ---------- handlers submit ----------
  if (signinForm) {
    signinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFormErrors(signinForm);
      var email = signinForm.querySelector('input[name="email"]');
      var pass = signinForm.querySelector('input[name="password"]');
      var ok = true;
      if (!email || !isValidEmail(email.value)) {
        showFieldError(email, 'Introduce un correo válido.');
        ok = false;
      }
      if (!pass || pass.value.trim().length < 6) {
        showFieldError(pass, 'La contraseña debe tener al menos 6 caracteres.');
        ok = false;
      }
      if (!ok) {
        var ann = document.getElementById('authAnnounce') || createAnnouncer();
        if (ann) ann.textContent = 'Hay errores en el formulario. Revisa los campos marcados.';
        return;
      }
      simulateServerSignIn(signinForm);
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFormErrors(registerForm);
      var name = registerForm.querySelector('input[name="name"]');
      var email = registerForm.querySelector('input[name="email"]');
      var pass = registerForm.querySelector('input[name="password"]');
      var pass2 = registerForm.querySelector('input[name="password_confirm"], input[name="confirm_password"]');
      var ok = true;
      if (!name || name.value.trim().length < 2) {
        showFieldError(name, 'Introduce tu nombre completo.');
        ok = false;
      }
      if (!email || !isValidEmail(email.value)) {
        showFieldError(email, 'Introduce un correo válido.');
        ok = false;
      }
      if (!pass || pass.value.length < 6) {
        showFieldError(pass, 'La contraseña debe tener al menos 6 caracteres.');
        ok = false;
      }
      if (pass && pass2 && pass.value !== pass2.value) {
        showFieldError(pass2, 'Las contraseñas no coinciden.');
        ok = false;
      }
      if (!ok) {
        var ann2 = document.getElementById('authAnnounce') || createAnnouncer();
        if (ann2) ann2.textContent = 'Hay errores en el formulario de registro. Corrígelos para continuar.';
        return;
      }
      simulateServerRegister(registerForm);
    });
  }

  // ---------- MutationObserver para animar al cambiar tabs ----------
  if (tabsContent && window.MutationObserver) {
    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          runFade(authPanel);
          runFade(hero);
        } else if (m.addedNodes && m.addedNodes.length) {
          runFade(authPanel);
          runFade(hero);
        }
      });
    });
    mo.observe(tabsContent, { attributes: true, childList: true, subtree: false });
  }

  // ---------- animación inicial ----------
  window.setTimeout(function () {
    runFade(hero);
    runFade(authPanel);
    if (chooserInline) runFade(chooserInline);
  }, 60);

  // ---------- wiring eventos botones ----------
  if (inlineSignIn) inlineSignIn.addEventListener('click', function (e) { e.preventDefault(); showAuthPane('signin-tab'); });
  if (inlineRegister) inlineRegister.addEventListener('click', function (e) { e.preventDefault(); showAuthPane('register-tab'); });
  if (inlineGuest) inlineGuest.addEventListener('click', function (e) {
    e.preventDefault();
    if (chooserInline && chooserInline.parentNode) chooserInline.parentNode.removeChild(chooserInline);
    showGuestOverlayAndGo(3000);
  });

  if (mobileSignIn) mobileSignIn.addEventListener('click', function (e) { e.preventDefault(); showAuthPane('signin-tab'); });
  if (mobileRegister) mobileRegister.addEventListener('click', function (e) { e.preventDefault(); showAuthPane('register-tab'); });
  if (mobileGuest) mobileGuest.addEventListener('click', function (e) { e.preventDefault(); showGuestOverlayAndGo(3000); });

  // ---------- exponer WCAuth para debug ----------
  window.WCAuth = {
    showAuthPane: showAuthPane,
    manualShowPane: manualShowPane,
    showGuestOverlayAndGo: showGuestOverlayAndGo,
    hideSocialButtons: hideSocialButtons
  };
}); // DOMContentLoaded end
