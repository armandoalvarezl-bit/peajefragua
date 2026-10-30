(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // Vista de la respuesta actual en memoria. No se guarda información de guías en el navegador.
  let guides = new Map();
  let busy = false;
  let connected = false;
  let pendingDelete = '';
  let notifyTimer;
  let modals;
  const views = {home:{hash:'inicio',title:'Inicio',heading:'home-heading'},guides:{hash:'guias',title:'Guías enviadas',heading:'guides-heading'},form:{hash:'nuevo-envio',title:'Formulario de envío',heading:'form-heading'},tracking:{hash:'seguimiento',title:'Seguimiento de guía',heading:'tracking-heading'}};

  function switchView(name, focus = true, updateHash = true) {
    if (!views[name]) name = 'home';
    for (const key of Object.keys(views)) $('#view-' + key).hidden = key !== name;
    document.querySelectorAll('.panel-nav').forEach(button => {
      const selected = button.dataset.panel === name;
      button.classList.toggle('active',selected);
      if (selected) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    $('#view-title').textContent = views[name].title;
    document.title = views[name].title + ' | Fragua';
    if (updateHash && window.location.hash !== '#' + views[name].hash) history.pushState(null,'','#' + views[name].hash);
    closeSidebar();
    if (focus) { $('#' + views[name].heading).focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'}); }
  }
  function routeFromHash() {
    const hash = window.location.hash.slice(1);
    return Object.keys(views).find(key => views[key].hash === hash) || 'home';
  }
  function initNavigation() {
    $('#overview-metrics').appendChild($('#overview-statistics'));
    $('#form-content').appendChild($('#shipping-form-section'));
    $('#guides-content').appendChild($('#guides-section'));
    $('#operations-layout').remove();
    document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click',() => {
      if (button.dataset.new === 'true') resetForm();
      switchView(button.dataset.panel);
    }));
    window.addEventListener('popstate',() => switchView(routeFromHash(),false,false));
    window.addEventListener('hashchange',() => switchView(routeFromHash(),false,false));
    switchView(routeFromHash(),false,false);
  }

  function status(message, state) {
    $('#connection-status').textContent = message;
    $('#connection-status').dataset.state = state;
  }
  function notify(message, error = false) {
    const node = $('#notify-chip');
    node.textContent = message;
    node.className = 'notify-chip show ' + (error ? 'notify-error' : 'notify-success');
    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => node.classList.remove('show'), 6500);
  }
  function loading(show, message = 'Conectando con Fragua…') {
    $('#op-loading-msg').textContent = message;
    $('#op-loading').classList.toggle('d-none', !show);
    $('#op-loading').setAttribute('aria-hidden', String(!show));
    $('#app-root').setAttribute('aria-busy', String(show));
  }
  async function run(message, action) {
    if (busy) return;
    busy = true;
    $('#save-result').hidden = true;
    loading(true, message);
    try { return await action(); }
    catch (err) {
      const outcome = $('#save-result');
      outcome.hidden = false;
      outcome.textContent = err.message;
      outcome.className = 'save-result save-result-warning';
      notify(err.message, true);
    }
    finally { busy = false; loading(false); }
  }
  function guideById(id) {
    const guide = guides.get(String(id));
    if (!guide) throw new Error('La guía ya no está disponible. Actualiza el panel.');
    return structuredClone(guide);
  }
  function parseItems(raw) {
    if (Array.isArray(raw)) return raw.filter(item => item && typeof item === 'object');
    try { const parsed = JSON.parse(raw || '[]'); if (Array.isArray(parsed)) return parsed.filter(item => item && typeof item === 'object'); } catch (_) {}
    return String(raw || '').split('|').map(text => text.trim()).filter(Boolean).map(text => {
      const match = text.match(/^(.*) x(\d+(?:\.\d+)?)$/);
      return { descripcion: match ? match[1] : text, cantidad: match ? Number(match[2]) : 1, peso: null, valor: null };
    });
  }
  function mapGuide(row) {
    return { id:String(row.Numero), numero:String(row.Numero), remitente:row.Remitente || '', destinatario:row.Destinatario || '', direccion:row.Direccion || '', peso:row.Peso ?? '', estado:row.Estado || '', obs:row.Observaciones || '', created_at:row.Fecha || '', pedidos:parseItems(row.Pedidos), notification:row.Notificacion || '', notificationError:row.NotificacionError || '', notifiedAt:row.NotificadoEn || '', updated_at:String(row.ActualizadoEn || ''), departure:row.SalidaEn || '' };
  }
  function serialize(guide) {
    return { Numero:guide.numero, Remitente:guide.remitente, Destinatario:guide.destinatario, Direccion:guide.direccion, Peso:guide.peso, Estado:guide.estado, Observaciones:guide.obs, Fecha:guide.created_at || new Date().toISOString(), Pedidos:JSON.stringify(guide.pedidos || []), ActualizadoEn:guide.updated_at || '' };
  }
  async function reloadGuides() {
    status('Consultando guías…', 'loading');
    try {
      const result = await FraguaAPI.request('search');
      if (!Array.isArray(result.data)) throw new Error('El servicio no devolvió una lista de guías válida.');
      guides = new Map(result.data.filter(row => row.Numero).map(row => { const guide = mapGuide(row); return [guide.id, guide]; }));
      connected = true;
      render();
      status('En línea · ' + new Date().toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'}), 'connected');
      $('#guides-source').textContent = guides.size + ' guía(s) registradas en el servicio. Todos los cambios se guardan en línea.';
    } catch (err) {
      connected = false;
      status('Servicio no disponible', 'offline');
      $('#guides-source').textContent = 'No se puede guardar sin conexión. Actualiza para consultar el servicio nuevamente.';
      throw err;
    }
  }
  function badge(state) {
    const n = normalized(state);
    const cls = n === 'entregado' ? 'status-ent' : n.includes('transito') ? 'status-trans' : 'status-pend';
    return '<span class="badge-status ' + cls + '">' + esc(state || 'Sin estado') + '</span>';
  }
  function render() {
    const q = normalized($('#search').value);
    const state = normalized($('#filter-estado').value);
    const all = [...guides.values()];
    FraguaDashboard.render(all);
    const filtered = all.filter(g => (!q || normalized([g.numero,g.remitente,g.destinatario,g.direccion].join(' ')).includes(q)) && (!state || normalized(g.estado) === state)).reverse();
    $('#count-filtered').textContent = filtered.length;
    $('#body-guias').innerHTML = filtered.length ? filtered.map(g => `<tr><td class="mono">${esc(g.numero)}</td><td>${esc(g.remitente)}</td><td>${esc(g.destinatario)}</td><td>${esc(g.peso || '—')}</td><td>${badge(g.estado)}</td><td class="text-end"><div class="btn-group"><button class="btn btn-sm btn-light" data-action="view" data-id="${esc(g.id)}" aria-label="Ver guía"><i class="bi bi-eye"></i></button><button class="btn btn-sm btn-ghost" data-action="edit" data-id="${esc(g.id)}" aria-label="Editar guía"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger" data-action="delete" data-id="${esc(g.id)}" aria-label="Eliminar guía"><i class="bi bi-trash"></i></button></div></td></tr>`).join('') : '<tr><td colspan="6"><div class="empty-state">No hay guías para mostrar.</div></td></tr>';
    $('#stat-total').textContent = all.length;
    $('#stat-pend').textContent = all.filter(g => normalized(g.estado) === 'pendiente').length;
    $('#stat-trans').textContent = all.filter(g => normalized(g.estado).includes('transito')).length;
    const delivered = all.filter(g => normalized(g.estado) === 'entregado').length;
    $('#stat-ent').textContent = delivered;
    const rate = all.length ? Math.round(delivered / all.length * 100) : 0;
    $('#stat-rate').textContent = rate + '%';
    $('#stat-rate-bar').style.width = rate + '%';
    $('#nav-guides-count').textContent = all.length;
    const recent = [...all].sort((a,b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0)).slice(0,5);
    $('#recent-guides').innerHTML = recent.length ? recent.map(g => `<button type="button" class="recent-row" data-guide="${esc(g.id)}"><span><strong>${esc(g.numero)}</strong><small>${esc(g.destinatario)}</small></span><span class="recent-destination"><i class="bi bi-geo-alt"></i> ${esc(g.direccion || 'Destino por confirmar')}</span>${badge(g.estado)}<i class="bi bi-arrow-up-right" aria-hidden="true"></i></button>`).join('') : '<div class="tracking-empty"><i class="bi bi-box-seam"></i><h3>Tu primera guía empieza con un envío.</h3><p>Usa Crear un envío para registrar tu primera guía.</p></div>';
  }
  function resetForm() {
    $('#form-guia').reset();
    $('#guia-id').value = '';
    $('#guia-num').disabled = false;
    $('#shipping-form-title').textContent = 'Registrar un envío';
  }
  function editGuide(id) {
    const g = guideById(id);
    const fields = {id:g.id,num:g.numero,rem:g.remitente,dest:g.destinatario,dir:g.direccion,peso:g.peso,estado:g.estado,obs:g.obs};
    for (const [field,value] of Object.entries(fields)) $('#guia-' + field).value = value;
    $('#guia-num').disabled = true;
    $('#shipping-form-title').textContent = 'Editar guía ' + g.numero;
    switchView('form');
    closeSidebar();
    window.scrollTo({top:0, behavior:'smooth'});
  }
  function showGuide(id) {
    const g = guideById(id);
    $('#ficha-container').dataset.current = g.id;
    $('#ficha-qr').innerHTML = GuiaImpresion.qrMarkup(g);
    $('#ficha-num').textContent = g.numero;
    $('#ficha-fecha').textContent = 'Creada: ' + (g.created_at ? new Date(g.created_at).toLocaleString('es-CO') : '—');
    for (const [field,value] of Object.entries({rem:g.remitente,dest:g.destinatario,dir:g.direccion,obs:g.obs,peso:g.peso})) $('#ficha-' + field).textContent = value || '—';
    $('#ficha-estado').innerHTML = badge(g.estado);
    $('#email-status').textContent = g.notification === 'Enviada' ? 'Correo enviado a peajezaragoza@zimaseguridad.com.co' : 'Correo pendiente de envío' + (g.notificationError ? ': ' + g.notificationError : '');
    $('#items-list').innerHTML = g.pedidos.length ? g.pedidos.map((item,index) => `<div class="d-flex justify-content-between align-items-center p-2 mb-2 border rounded"><div><strong>${esc(item.descripcion)}</strong> <span class="small-muted">×${esc(item.cantidad)}</span><div class="small-muted">Peso: ${esc(item.peso ?? '—')} kg · Valor: ${item.valor == null ? 'No informado' : '$' + Number(item.valor).toLocaleString('es-CO')}</div></div><div class="btn-group"><button class="btn btn-sm btn-light" data-item-action="edit" data-idx="${index}" aria-label="Editar pedido"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-danger" data-item-action="delete" data-idx="${index}" aria-label="Eliminar pedido"><i class="bi bi-trash"></i></button></div></div>`).join('') : '<div class="small-muted">Sin pedidos registrados.</div>';
  }
  function assertOnline() {
    if (!connected || navigator.onLine === false) throw new Error('Conéctate y actualiza las guías antes de guardar. No se guardan cambios sin conexión.');
  }
  async function saveGuide(g, mode) {
    assertOnline();
    const result = await FraguaAPI.request('upsert', {mode, guia:JSON.stringify(serialize(g))});
    let refreshed = true;
    try { await reloadGuides(); } catch (_) { refreshed = false; }
    let message;
    let warning = false;
    if (!result.notification) {
      message = 'Guía guardada, pero el servicio no informó el resultado del correo. Actualiza la implementación de Apps Script con el código actual.';
      warning = true;
    } else if (!result.notification.sent) {
      message = 'Guía guardada en línea. El correo NO se envió: ' + (result.notification.error || 'Revisa los permisos del remitente en Apps Script.');
      warning = true;
    } else if (result.notification.alreadySent) {
      message = 'Guía guardada. Este estado ya fue notificado por correo.';
    } else {
      message = 'Guía guardada y correo enviado a peajezaragoza@zimaseguridad.com.co.';
    }
    if (!refreshed) { message += ' Actualiza la lista para consultar los cambios.'; warning = true; }
    const outcome = $('#save-result');
    outcome.hidden = false;
    outcome.textContent = message;
    outcome.className = 'save-result ' + (warning ? 'save-result-warning' : 'save-result-success');
    notify(message, warning);
    return refreshed;
  }
  async function saveGuideForm(event) {
    event.preventDefault();
    if (!$('#form-guia').reportValidity()) return;
    await run('Guardando guía y verificando la notificación…', async () => {
      const id = $('#guia-id').value;
      const g = id ? guideById(id) : {pedidos:[]};
      Object.assign(g, {numero:$('#guia-num').value.trim(),remitente:$('#guia-rem').value.trim(),destinatario:$('#guia-dest').value.trim(),direccion:$('#guia-dir').value.trim(),peso:$('#guia-peso').value,estado:$('#guia-estado').value,obs:$('#guia-obs').value});
      await saveGuide(g, id ? 'update' : 'create');
      resetForm();
      switchView('guides');
    });
  }
  function requestDelete(id) {
    pendingDelete = String(id);
    $('#delete-modal-message').textContent = '¿Eliminar la guía ' + id + ' del servicio? Esta acción no se puede deshacer.';
    modals.delete.show();
  }
  async function deleteGuide() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    await run('Eliminando guía en línea…', async () => {
      assertOnline();
      await FraguaAPI.request('delete', {numero:id});
      pendingDelete = '';
      modals.delete.hide();
      modals.ficha.hide();
      try { await reloadGuides(); notify('Guía eliminada del servicio.'); }
      catch (_) { notify('Guía eliminada. Actualiza la lista para ver los cambios.', true); }
    });
  }
  function editItem(index) {
    const g = guideById($('#ficha-container').dataset.current);
    const item = index == null ? null : g.pedidos[index];
    $('#form-item').reset();
    $('#item-id').value = item ? index : '';
    if (item) for (const [field,value] of Object.entries({desc:item.descripcion,cant:item.cantidad,valor:item.valor,peso:item.peso})) $('#item-' + field).value = value ?? '';
    $('#modalItem .modal-title').textContent = item ? 'Editar pedido' : 'Agregar pedido';
    modals.item.show();
  }
  async function saveItem(event) {
    event.preventDefault();
    if (!$('#form-item').reportValidity()) return;
    await run('Guardando detalle del envío…', async () => {
      const g = guideById($('#ficha-container').dataset.current);
      const item = {descripcion:$('#item-desc').value.trim(),cantidad:Number($('#item-cant').value),peso:$('#item-peso').value === '' ? null : Number($('#item-peso').value),valor:$('#item-valor').value === '' ? null : Number($('#item-valor').value)};
      const index = $('#item-id').value;
      if (index === '') g.pedidos.push(item); else g.pedidos[Number(index)] = item;
      const refreshed = await saveGuide(g, 'update');
      modals.item.hide();
      if (refreshed) showGuide(g.id);
    });
  }
  async function removeItem(index) {
    if (!confirm('¿Eliminar este pedido del envío?')) return;
    await run('Actualizando contenido del envío…', async () => {
      const g = guideById($('#ficha-container').dataset.current);
      g.pedidos.splice(index,1);
      if (await saveGuide(g, 'update')) showGuide(g.id);
    });
  }
  async function sendNotification() {
    await run('Enviando notificación a Peaje Zaragoza…', async () => {
      assertOnline();
      const id = $('#ficha-container').dataset.current;
      const result = await FraguaAPI.request('notify', {numero:id, force:'true'});
      await reloadGuides();
      showGuide(id);
      if (!result.notification.sent) throw new Error('El correo quedó pendiente: ' + result.notification.error);
      notify('Notificación enviada a peajezaragoza@zimaseguridad.com.co.');
    });
  }
  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    $('#btn-mobile-menu').setAttribute('aria-expanded','false');
  }
  async function trackGuide(event) {
    event.preventDefault();
    const term = $('#tracking-number').value.trim();
    if (!term) return;
    $('#tracking-result').innerHTML = '';
    await run('Consultando el estado de tu envío…',async () => {
      const result = await FraguaAPI.request('search',{numero:term});
      if (!Array.isArray(result.data)) throw new Error('El servicio no devolvió un resultado válido.');
      if (!result.data.length) {
        $('#tracking-result').innerHTML = '<div class="tracking-empty"><i class="bi bi-search"></i><h3>No encontramos esa guía.</h3><p>Revisa el número e intenta nuevamente.</p></div>';
        return;
      }
      $('#tracking-result').innerHTML = result.data.filter(row => row.Numero).map(row => {
        const g = mapGuide(row);
        const current = normalized(g.estado).trim();
        const stage = current === 'entregado' ? 2 : current.includes('transito') ? 1 : current === 'pendiente' ? 0 : -1;
        const steps = ['Registro','En tránsito','Entregado'].map((label,index) => `<div class="tracking-step${index < stage ? ' completed' : ''}${index === stage ? ' current' : ''}"${index === stage ? ' aria-current="step"' : ''}><i class="bi ${index < stage ? 'bi-check-circle-fill' : index === stage ? 'bi-record-circle' : 'bi-circle'}" aria-hidden="true"></i>${label}</div>`).join('');
        return `<article class="tracking-card"><header><div><span class="section-eyebrow">NÚMERO DE GUÍA</span><h3>${esc(g.numero)}</h3></div>${badge(g.estado)}</header><div class="tracking-steps" aria-label="Estado actual del envío">${steps}</div>${FraguaJourney.render(g)}<div class="tracking-detail"><div><small>REMITENTE</small><p>${esc(g.remitente || 'No informado')}</p></div><div><small>DESTINATARIO</small><p>${esc(g.destinatario || 'No informado')}</p></div><div><small>DIRECCIÓN DE ENTREGA</small><p>${esc(g.direccion || 'No informada')}</p></div><div><small>OBSERVACIONES</small><p>${esc(g.obs || 'Sin observaciones')}</p></div></div></article>`;
      }).join('');
      FraguaJourney.update($('#tracking-result'));
    });
  }
  function bind() {
    const on = (selector,event,handler) => $(selector).addEventListener(event,handler);
    on('#form-guia','submit',saveGuideForm);
    on('#form-item','submit',saveItem);
    on('#btn-reset','click',resetForm);
    on('#btn-new','click',() => {resetForm(); switchView('form');});
    on('#tracking-form','submit',trackGuide);
    on('#recent-guides','click',event => {
      const button = event.target.closest('[data-guide]');
      if (!button) return;
      try { showGuide(button.dataset.guide); modals.ficha.show(); } catch (err) { notify(err.message,true); }
    });
    on('#search','input',render);
    on('#filter-estado','change',render);
    on('#btn-refresh-guides','click',() => run('Consultando guías en línea…',reloadGuides));
    on('#btn-close-ficha','click',() => modals.ficha.hide());
    on('#btn-add-item','click',() => editItem(null));
    on('#btn-delete-guia','click',() => requestDelete($('#ficha-container').dataset.current));
    on('#delete-modal-confirm','click',deleteGuide);
    on('#btn-notify-shipment','click',sendNotification);
    const print = () => run('Preparando tu guía…', async () => {
      assertOnline();
      const id = $('#ficha-container').dataset.current;
      await reloadGuides();
      await GuiaImpresion.print(guideById(id));
    });
    on('#btn-print','click',print);
    on('#btn-export-pdf','click',print);
    on('#btn-logout','click',() => run('Cerrando sesión…',async () => {try {await FraguaAPI.logout();}finally{window.location.replace('login.html');}}));
    on('#body-guias','click',event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      try {
        if (button.dataset.action === 'view') { showGuide(button.dataset.id); modals.ficha.show(); }
        if (button.dataset.action === 'edit') editGuide(button.dataset.id);
        if (button.dataset.action === 'delete') requestDelete(button.dataset.id);
      } catch (err) {notify(err.message,true);}
    });
    on('#items-list','click',event => {
      const button = event.target.closest('[data-item-action]');
      if (!button) return;
      if (button.dataset.itemAction === 'edit') editItem(Number(button.dataset.idx));
      else removeItem(Number(button.dataset.idx));
    });
    on('#btn-mobile-menu','click',() => {document.body.classList.toggle('sidebar-open');$('#btn-mobile-menu').setAttribute('aria-expanded',String(document.body.classList.contains('sidebar-open')));});
    on('#btn-mobile-close','click',closeSidebar);
    on('#mobile-menu-backdrop','click',closeSidebar);
    document.addEventListener('keydown',event => {if(event.key === 'Escape')closeSidebar();});
    window.addEventListener('offline',() => {connected=false;status('Sin conexión · guardado no disponible','offline');});
    window.addEventListener('online',() => run('Restableciendo conexión…',reloadGuides));
    window.addEventListener('fragua:session-expired',() => window.location.replace('login.html'));
  }
  document.addEventListener('DOMContentLoaded',async () => {
    if (!FraguaAPI.hasSession()) {window.location.replace('login.html');return;}
    modals = {item:new bootstrap.Modal($('#modalItem'),{backdrop:'static'}),ficha:new bootstrap.Modal($('#modalFicha')),delete:new bootstrap.Modal($('#modalDelete'),{backdrop:'static'})};
    initNavigation();
    bind();
    const clock = () => {const now=new Date();$('#live-clock').textContent=now.toLocaleTimeString('es-CO');$('#top-date').textContent=now.toLocaleDateString('es-CO');};
    clock();setInterval(clock,1000);
    await run('Verificando tu sesión y consultando envíos…',async () => {
      const session = await FraguaAPI.request('session');
      $('#current-user').textContent = session.user.usuario;
      await reloadGuides();
    });
  });
}());
