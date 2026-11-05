/* Los datos de envíos viven en el servidor. Solo el token de sesión dura en la pestaña. */
(function () {
  'use strict';
  const endpoint = 'https://script.google.com/macros/s/AKfycbx0ZY48jUrX_3Vu-5X4kOLEEE02rNMNKABChUODw0s8OqjJYld7KnTiMfnakob2PPM19w/exec';
  const key = 'fragua_session_token';
  let sessionToken = sessionStorage.getItem(key) || '';

  async function request(action, params = {}) {
    if (navigator.onLine === false) throw new Error('No hay conexión. Conéctate a internet para continuar; el cambio no se ha guardado.');
    const form = new URLSearchParams({ ...params, action });
    if (sessionToken) form.set('token', sessionToken);
    let response;
    try {
      response = await fetch(endpoint, { method: 'POST', body: form, cache: 'no-store', signal: AbortSignal.timeout(45000) });
    } catch (_) {
      throw new Error('No se recibió confirmación del servidor. Actualiza las guías antes de repetir el cambio.');
    }
    if (!response.ok) throw new Error('El servicio respondió con HTTP ' + response.status + '.');
    let result;
    try { result = await response.json(); } catch (_) { throw new Error('El servicio no devolvió una respuesta válida. Revisa la implementación de Apps Script.'); }
    if (!result || result.ok !== true) {
      if (result && result.code === 'SESSION_EXPIRED') {
        sessionStorage.removeItem(key);
        sessionToken = '';
        window.dispatchEvent(new Event('fragua:session-expired'));
      }
      throw new Error(result && result.msg || 'El servicio no confirmó la operación.');
    }
    return result;
  }

  async function login(username, password) {
    const result = await request('login', { usuario: username, password });
    if (!result.token) throw new Error('Actualiza Apps Script: falta la sesión de acceso en la respuesta.');
    sessionToken = result.token;
    sessionStorage.setItem(key, sessionToken);
    return result;
  }

  async function logout() {
    try { if (sessionToken) await request('logout'); }
    finally { sessionToken = ''; sessionStorage.removeItem(key); }
  }
  window.FraguaAPI = Object.freeze({ request, login, logout, hasSession: () => Boolean(sessionToken) });
}());
