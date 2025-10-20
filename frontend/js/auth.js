// auth.js
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('login-form');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const toggle = document.getElementById('togglePassword');
  const pwBar = document.getElementById('pwBar');
  const errEmail = document.getElementById('error-email');
  const errPassword = document.getElementById('error-password');
  const loginBtn = document.getElementById('loginBtn');

  // Toggle password visibility
  toggle && toggle.addEventListener('click', () => {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    toggle.setAttribute('aria-label', type === 'text' ? 'Ocultar contraseña' : 'Mostrar contraseña');
    toggle.title = type === 'text' ? 'Ocultar contraseña' : 'Mostrar contraseña';
  });

  // Simple password strength indicator
  function strengthScore(pw){
    let score = 0;
    if (!pw) return 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score; // 0..4
  }

  function updatePwBar(){
    const s = strengthScore(password.value);
    const pct = (s / 4) * 100;
    pwBar.style.width = pct + '%';
    // optionally change color based on strength
    if (s <= 1) pwBar.style.filter = 'saturate(1) brightness(.9)';
    else if (s === 2) pwBar.style.filter = 'saturate(1.1)';
    else if (s === 3) pwBar.style.filter = 'saturate(1.2)';
    else pwBar.style.filter = 'saturate(1.35)';
  }

  password && password.addEventListener('input', updatePwBar);

  // Basic email validator
  function validEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // Form submit handler (client-side only)
  form && form.addEventListener('submit', function (e){
    e.preventDefault();
    // reset errors
    errEmail.textContent = '';
    errPassword.textContent = '';

    let ok = true;
    if (!validEmail(email.value.trim())){
      errEmail.textContent = 'Introduce un correo válido';
      ok = false;
      email.focus();
    }
    if (password.value.length < 6){
      errPassword.textContent = 'La contraseña debe tener al menos 6 caracteres';
      if (ok) password.focus();
      ok = false;
    }

    if (!ok) return;

    // Visual feedback: disable button & small loading
    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando...';

    // Simulación de llamado al backend (reemplaza con fetch real)
    setTimeout(() => {
      // Aquí sustituye por fetch('/api/auth/login', { method:'POST', body: JSON.stringify(...) })
      // Ejemplo de manejo: si login OK, redirigir; si no, mostrar error.
      const fakeSuccess = true; // <- cambiar por la respuesta real
      if (fakeSuccess) {
        window.location.href = '/dashboard.html'; // ajustar ruta real
      } else {
        errPassword.textContent = 'Credenciales inválidas';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar sesión';
      }
    }, 900);
  });

  // Improve keyboard UX: Enter on password triggers submit
  password && password.addEventListener('keyup', function(e){
    if (e.key === 'Enter') form.requestSubmit();
  });

});
