(function () {
  'use strict';
  const form = document.getElementById('loginForm');
  const user = document.getElementById('usuario');
  const password = document.getElementById('password');
  const button = document.getElementById('btnLogin');
  const error = document.getElementById('errorBox');
  const overlay = document.getElementById('loadingModal');
  const toggle = document.getElementById('togglePass');
  let busy = false;
  function loading(show, message) {
    overlay.hidden = !show;
    document.getElementById('loadingSubtitle').textContent = message || 'Verificando tu acceso con el servicio…';
    document.getElementById('login-shell').inert = show;
    form.setAttribute('aria-busy',String(show));
    button.disabled = show;
  }
  toggle.addEventListener('click',() => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-pressed',String(show));
    toggle.setAttribute('aria-label',show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
  form.addEventListener('submit',async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    error.hidden = true;
    loading(true);
    try {
      await FraguaAPI.login(user.value.trim(),password.value);
      password.value = '';
      window.location.replace('home.html');
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      loading(false);
      password.focus();
    } finally {busy = false;}
  });
  if (FraguaAPI.hasSession()) {
    loading(true,'Verificando tu sesión…');
    FraguaAPI.request('session').then(() => window.location.replace('home.html')).catch(() => loading(false));
  }
}());
