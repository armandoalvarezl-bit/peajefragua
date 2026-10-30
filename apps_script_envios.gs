var FRAGUA_CONFIG = {
  sheet: 'Tabla_1', usersSheet: 'Usuarios', sessionSeconds: 21600,
  // El remitente es la cuenta que ejecuta Apps Script. No requiere alias.
  replyTo: 'enviosfragua@gmail.com', recipient: 'peajezaragoza@zimaseguridad.com.co'
};

function doGet(e) {
  var p = e && e.parameter || {};
  try {
    var action = String(p.action || 'search').toLowerCase();
    if (action !== 'search') throw new Error('Esta operación requiere POST.');
    return jsonOut_(handleSearch_(p), p.callback);
  } catch (err) { return apiError_(err, p.callback); }
}

function doPost(e) {
  var p = merge_(e && e.parameter || {}, parseBody_(e));
  try {
    var action = String(p.action || '').toLowerCase();
    var result;
    if (action === 'login') result = handleLogin_(p);
    else if (action === 'session') result = { ok: true, user: requireSession_(p) };
    else if (action === 'logout') {
      if (p.token) CacheService.getScriptCache().remove('fragua:' + sha256Hex_(p.token));
      result = { ok: true };
    } else if (action === 'search') result = handleSearch_(p);
    else {
      requireSession_(p);
      if (action === 'upsert') result = withScriptLock_(function(){ return handleUpsert_(p); });
      else if (action === 'delete') result = withScriptLock_(function(){ return handleDelete_(p); });
      else if (action === 'notify') result = withScriptLock_(function(){ return handleNotify_(p); });
      else throw new Error('Operación no soportada.');
    }
    return jsonOut_(result);
  } catch (err) { return apiError_(err); }
}

function apiError_(err, callback) {
  return jsonOut_({ ok: false, msg: String(err && err.message || err), code: err && err.code || '' }, callback);
}

function withScriptLock_(work) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { return work(); } finally { lock.releaseLock(); }
}

function requireSession_(p) {
  var token = String(p.token || '');
  var raw = token && CacheService.getScriptCache().get('fragua:' + sha256Hex_(token));
  if (!raw) {
    var error = new Error('La sesión terminó. Inicia sesión nuevamente.');
    error.code = 'SESSION_EXPIRED';
    throw error;
  }
  return JSON.parse(raw);
}

function handleLogin_(p) {
  var ss = openSpreadsheet_();
  if (!ss) throw new Error('Vincula el script a la hoja de cálculo.');
  var sheet = ss.getSheetByName(FRAGUA_CONFIG.usersSheet);
  if (!sheet) throw new Error('Falta la hoja Usuarios. Ejecuta cambiarAdministradorFragua desde el editor.');
  var username = String(p.usuario || '').trim();
  var password = String(p.password || '');
  if (!username || !password) throw new Error('Completa usuario y contraseña.');
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var u = findHeaderIndex_(headers, ['usuario','user']);
  var c = findHeaderIndex_(headers, ['password','contrasena','clave']);
  var n = findHeaderIndex_(headers, ['nombre']);
  var r = findHeaderIndex_(headers, ['rol','role','perfil']);
  var s = findHeaderIndex_(headers, ['estado','status']);
  if (u < 0 || c < 0) throw new Error('Revisa las columnas de Usuarios.');
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (normalize_(row[u]) !== normalize_(username)) continue;
    if (!passwordMatches_(password, row[c]) || (s >= 0 && normalize_(row[s]) !== 'activo')) break;
    var user = { usuario: String(row[u]), nombre: n >= 0 ? String(row[n]) : '', rol: r >= 0 ? String(row[r]) : '' };
    var token = Utilities.getUuid() + Utilities.getUuid();
    CacheService.getScriptCache().put('fragua:' + sha256Hex_(token), JSON.stringify(user), FRAGUA_CONFIG.sessionSeconds);
    return { ok: true, user: user, token: token };
  }
  throw new Error('Usuario, contraseña o estado de la cuenta incorrectos.');
}

function guidesSheet_(create) {
  var ss = openSpreadsheet_();
  if (!ss) throw new Error('Vincula el script a la hoja de cálculo.');
  var sheet = ss.getSheetByName(FRAGUA_CONFIG.sheet);
  if (!sheet && create) sheet = ss.insertSheet(FRAGUA_CONFIG.sheet);
  return sheet;
}

function handleSearch_(p) {
  var term = normalize_(p.numero || p.q || '');
  if (!term) requireSession_(p);
  var sheet = guidesSheet_(false);
  if (!sheet) return { ok: true, data: [] };
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { ok: true, data: [] };
  var headers = values[0].map(function(h){ return String(h || '').trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var guide = rowToObj_(headers, values[i]);
    if (!guide.Numero) continue;
    if (term && normalize_(guide.Numero).indexOf(term) < 0) continue;
    rows.push(guide);
  }
  return { ok: true, data: rows };
}

function findGuideRow_(sheet, headers, numero) {
  var col = headers.indexOf('Numero');
  var last = sheet.getLastRow();
  if (last < 2 || col < 0) return -1;
  var values = sheet.getRange(2, col + 1, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) if (String(values[i][0]).trim() === numero) return i + 2;
  return -1;
}

function handleUpsert_(p) {
  var guide = readGuia_(p);
  var numero = String(guide.Numero || '').trim();
  if (!numero || !String(guide.Remitente || '').trim() || !String(guide.Destinatario || '').trim()) throw new Error('Número, remitente y destinatario son obligatorios.');
  var sheet = guidesSheet_(true);
  ensureHeaders_(sheet);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowIndex = findGuideRow_(sheet, headers, numero);
  if (p.mode === 'create' && rowIndex > 0) throw new Error('Ya existe una guía con ese número.');
  if (p.mode === 'update' && rowIndex < 0) throw new Error('La guía ya no existe. Actualiza el panel.');
  var existing = rowIndex > 0 ? rowToObj_(headers, sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0]) : {};
  if (p.mode === 'update' && existing.ActualizadoEn && revisionValue_(guide.ActualizadoEn) !== revisionValue_(existing.ActualizadoEn)) {
    throw new Error('Otra sesión actualizó esta guía. Actualiza el panel antes de guardar.');
  }
  var created = rowIndex < 0;
  var merged = merge_(existing, guide);
  merged.Numero = numero;
  merged.Fecha = existing.Fecha || guide.Fecha || new Date().toISOString();
  merged.ActualizadoEn = new Date().toISOString();
  var inTransit = normalizeHeader_(merged.Estado).indexOf('transito') >= 0;
  var wasInTransit = normalizeHeader_(existing.Estado).indexOf('transito') >= 0;
  // La salida se registra una sola vez al pasar a tránsito, no al editar pedidos.
  merged.SalidaEn = existing.SalidaEn || '';
  if (inTransit && !wasInTransit) merged.SalidaEn = new Date().toISOString();
  var notificationFields = ['Notificacion','NotificadoEstado','NotificadoEn','NotificacionError'];
  notificationFields.forEach(function(key){ merged[key] = existing[key] || ''; });
  var row = headers.map(function(h){ return merged[h] != null ? merged[h] : ''; });
  // No cambiar formatos de toda la fila: las tablas de Sheets pueden tener columnas tipadas.
  if (created) rowIndex = sheet.getLastRow() + 1;
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
  SpreadsheetApp.flush();
  var notification = notifyGuide_(sheet, headers, rowIndex, merged, false, created);
  return { ok: true, numero: numero, created: created, notification: notification };
}

function handleDelete_(p) {
  var sheet = guidesSheet_(false);
  var numero = String(p.numero || '').trim();
  if (!numero) throw new Error('Falta el número de guía.');
  if (!sheet) return { ok: true, deleted: 0 };
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = findGuideRow_(sheet, headers, numero);
  if (row > 0) sheet.deleteRow(row);
  return { ok: true, deleted: row > 0 ? 1 : 0 };
}

function handleNotify_(p) {
  var sheet = guidesSheet_(false);
  if (!sheet) throw new Error('No hay guías registradas.');
  ensureHeaders_(sheet);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = findGuideRow_(sheet, headers, String(p.numero || '').trim());
  if (row < 0) throw new Error('Guía no encontrada.');
  var guide = rowToObj_(headers, sheet.getRange(row, 1, 1, headers.length).getValues()[0]);
  return { ok: true, notification: notifyGuide_(sheet, headers, row, guide, p.force === 'true', false) };
}

function notifyGuide_(sheet, headers, row, guide, force, created) {
  if (!force && guide.Notificacion === 'Enviada' && normalize_(guide.NotificadoEstado) === normalize_(guide.Estado)) return { sent: true, alreadySent: true, to: FRAGUA_CONFIG.recipient };
  var result;
  try {
    var options = { name: 'Envíos Fragua', replyTo: FRAGUA_CONFIG.replyTo, htmlBody: buildShipmentEmail_(guide, created) };
    options.inlineImages = { zimaLogo: Utilities.newBlob(Utilities.base64Decode(FRAGUA_ZIMA_LOGO_BASE64), 'image/jpeg', 'zima.jpg') };
    var subject = 'Fragua · ' + (created ? 'Nuevo envío' : 'Actualización de envío') + ' · ' + String(guide.Numero).replace(/[\r\n]/g, '') + ' · ' + String(guide.Estado || '').replace(/[\r\n]/g, '');
    var plain = 'ENVÍOS FRAGUA\nGuía: ' + guide.Numero + '\nEstado: ' + guide.Estado + '\nRemitente: ' + guide.Remitente + '\nDestinatario: ' + guide.Destinatario + '\nDirección: ' + guide.Direccion + '\nObservaciones: ' + (guide.Observaciones || 'Sin observaciones') + '\nContacto: ' + FRAGUA_CONFIG.replyTo;
    MailApp.sendEmail(FRAGUA_CONFIG.recipient, subject, plain, options);
    result = { sent: true, to: FRAGUA_CONFIG.recipient };
    guide.Notificacion = 'Enviada';
    guide.NotificadoEstado = guide.Estado;
    guide.NotificadoEn = new Date().toISOString();
    guide.NotificacionError = '';
  } catch (err) {
    result = { sent: false, to: FRAGUA_CONFIG.recipient, error: String(err.message || err) };
    guide.Notificacion = 'Pendiente';
    guide.NotificacionError = result.error;
  }
  console.log(JSON.stringify({ evento:'notificacion_envio', numero:String(guide.Numero), estado:String(guide.Estado || ''), enviada:result.sent, error:result.error || '' }));
  ['Notificacion','NotificadoEstado','NotificadoEn','NotificacionError'].forEach(function(key){
    sheet.getRange(row, headers.indexOf(key) + 1).setValue(guide[key] || '');
  });
  SpreadsheetApp.flush();
  return result;
}

function escapeEmail_(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; });
}

function revisionValue_(value) {
  if (value == null || value === '') return '';
  var date = Object.prototype.toString.call(value) === '[object Date]' ? value : new Date(String(value));
  return isNaN(date.getTime()) ? String(value) : date.toISOString();
}

/**
 * Ejecutar una vez desde el editor para registrar la salida informada de OPER-55511.
 * Hora fija: 30/10/2026 a las 13:26:25 de Colombia (44 minutos antes de la referencia).
 * No cambia el estado ni envía correos. No se expone como acción pública.
 */
function registrarSalidaOper55511() {
  return withScriptLock_(function() {
    var sheet = guidesSheet_(false);
    if (!sheet) throw new Error('No existe la hoja de guías.');
    ensureHeaders_(sheet);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = findGuideRow_(sheet, headers, 'OPER-55511');
    if (row < 0) throw new Error('No se encontró la guía OPER-55511. No se modificó otra guía.');
    var guide = rowToObj_(headers, sheet.getRange(row, 1, 1, headers.length).getValues()[0]);
    if (normalizeHeader_(guide.Estado).indexOf('transito') < 0) throw new Error('OPER-55511 no está en tránsito. Verifica su estado antes de ajustar la salida.');
    var departure = '2026-10-30T18:26:25.000Z';
    sheet.getRange(row, headers.indexOf('SalidaEn') + 1).setValue(departure);
    sheet.getRange(row, headers.indexOf('ActualizadoEn') + 1).setValue(new Date().toISOString());
    SpreadsheetApp.flush();
    console.log('Salida registrada para OPER-55511: 30/10/2026, 13:26:25, hora de Colombia. El estado se conservó.');
    return { ok:true, numero:'OPER-55511', salida:departure };
  });
}

// Ejecutar desde el editor para conceder permisos de envío, sin enviar correos.
function autorizarNotificacionesFragua() {
  // Ejecutar desde el editor: solicita el consentimiento de envío si falta.
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, [
    'https://www.googleapis.com/auth/script.send_mail'
  ]);
  var quota = MailApp.getRemainingDailyQuota();
  var account = '';
  try { account = String(Session.getEffectiveUser().getEmail() || ''); } catch (_) {}
  if (quota < 1) throw new Error('La cuenta que ejecuta Apps Script no tiene cuota de correo disponible hoy.');
  var sender = account || 'Cuenta autorizada que ejecuta Apps Script';
  console.log('Remitente: ' + sender + '. Respuestas: ' + FRAGUA_CONFIG.replyTo + '. Destinatario: ' + FRAGUA_CONFIG.recipient + '. Cuota disponible: ' + quota + '. No se ha enviado ningún correo.');
  return { sender: sender, replyTo: FRAGUA_CONFIG.replyTo, recipient: FRAGUA_CONFIG.recipient, quota: quota, ready: true };
}

function buildShipmentEmail_(guide, created) {
  var e = escapeEmail_;
  var items;
  try { items = JSON.parse(guide.Pedidos || '[]'); } catch (_) { items = [{ descripcion: guide.Pedidos || 'Sin detalle registrado', cantidad: '' }]; }
  if (!Array.isArray(items)) items = [];
  items = items.filter(function(item){ return item && typeof item === 'object'; });
  var detail = items.map(function(item){ return '<tr><td style="padding:12px 0;border-bottom:1px solid #e5eaf0">' + e(item.descripcion) + '</td><td style="padding:12px;text-align:center;border-bottom:1px solid #e5eaf0">' + e(item.cantidad) + '</td></tr>'; }).join('');
  var field = function(label, value){ return '<tr><td style="padding:14px 0;border-bottom:1px solid #e5eaf0;color:#65748b;width:35%;vertical-align:top">' + label + '</td><td style="padding:14px 0;border-bottom:1px solid #e5eaf0;font-weight:bold;color:#172941">' + e(value || 'No informado') + '</td></tr>'; };
  return '<!doctype html><html lang="es"><body style="margin:0;background:#eef2f6;font-family:Arial,sans-serif;color:#172941"><span style="display:none">Guía ' + e(guide.Numero) + ': ' + e(guide.Estado) + '.</span><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:36px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #dce3eb;border-radius:18px;overflow:hidden"><tr><td style="padding:28px 32px;background:#12233e;border-bottom:4px solid #f58220"><table role="presentation" width="100%"><tr><td><div style="color:#f58220;font-size:12px;letter-spacing:3px;font-weight:bold">ENVÍOS Y TRANSPORTE</div><div style="font-size:32px;color:white;font-weight:bold;font-style:italic;margin-top:8px">❯❯ FRAGUA</div></td><td align="right"><img src="cid:zimaLogo" alt="Zima Seguridad Ltda" width="58" height="58" style="border-radius:12px;display:block"></td></tr></table></td></tr><tr><td style="padding:32px"><p style="font-size:11px;letter-spacing:2px;color:#bd5700;font-weight:bold">NOTIFICACIÓN DE ENVÍO</p><h1 style="font-size:26px;line-height:1.25;margin:12px 0">' + (created ? 'Un nuevo envío está registrado.' : 'Tu envío tiene una actualización.') + '</h1><p style="color:#65748b;line-height:1.6">Hola, equipo de Peaje Zaragoza. Compartimos la información del envío registrado por Fragua.</p><table role="presentation" width="100%" style="margin:24px 0;background:#fff7ee;border:1px solid #f4d5b5;border-radius:12px"><tr><td style="padding:20px"><div style="font-size:10px;letter-spacing:2px;color:#94602f">NÚMERO DE GUÍA</div><div style="font-size:25px;font-weight:bold;margin-top:8px">' + e(guide.Numero) + '</div><div style="font-size:13px;margin-top:10px">Estado: <strong>' + e(guide.Estado) + '</strong></div></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">' + field('Remitente', guide.Remitente) + field('Destinatario', guide.Destinatario) + field('Dirección', guide.Direccion) + field('Peso total', String(guide.Peso == null || guide.Peso === '' ? 'No informado' : guide.Peso + ' kg')) + field('Observaciones', guide.Observaciones) + '</table>' + (detail ? '<h2 style="font-size:15px;margin-top:28px">Contenido del envío</h2><table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px"><tr><th align="left">Descripción</th><th>Cantidad</th></tr>' + detail + '</table>' : '') + '<p style="font-size:12px;line-height:1.7;margin-top:28px;color:#65748b">Conserva este mensaje como referencia. Para cualquier novedad, responde a este correo e incluye el número de guía.</p></td></tr><tr><td style="padding:22px 32px;border-top:1px solid #e5eaf0;background:#f8fafc;font-size:11px;color:#65748b;line-height:1.7"><strong style="color:#172941">Envíos Fragua</strong><br><a href="mailto:' + FRAGUA_CONFIG.replyTo + '" style="color:#bd5700">' + FRAGUA_CONFIG.replyTo + '</a><br>Notificación automática para Peaje Zaragoza · Zima Seguridad Ltda</td></tr></table></td></tr></table></body></html>';
}

// Previsualiza el diseño desde el editor sin enviar ningún correo.
function vistaPreviaCorreoFragua() {
  var html = buildShipmentEmail_({ Numero:'FRG-2026-0001', Estado:'En tránsito', Remitente:'Envíos Fragua', Destinatario:'Peaje Zaragoza', Direccion:'Dirección de entrega registrada', Peso:2.5, Observaciones:'Manipular con cuidado.', Pedidos:'[{"descripcion":"Paquete de ejemplo","cantidad":1}]' }, true);
  var output = HtmlService.createHtmlOutput(html.replace('cid:zimaLogo', 'data:image/jpeg;base64,' + FRAGUA_ZIMA_LOGO_BASE64)).setWidth(650).setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(output, 'Vista previa de notificación');
}


/**
 * Ejecutar una vez desde el editor de Apps Script vinculado a la hoja
 * que utiliza login.html. Crea la hoja Usuarios si falta y configura Fragua / 2107.
 * No se expone mediante doGet ni doPost. No requiere una nueva implementación.
 */
function cambiarAdministradorFragua() {
  var ss = openSpreadsheet_();
  if (!ss) throw new Error('Abre este script desde la hoja de usuarios del acceso.');
  var sheet = ss.getSheetByName('Usuarios');
  if (!sheet) sheet = ss.insertSheet('Usuarios');

  var values = sheet.getDataRange().getValues();
  var isEmpty = values.every(function(row) {
    return row.every(function(value){ return String(value == null ? '' : value).trim() === ''; });
  });
  if (isEmpty) {
    var initialHeaders = ['ID', 'Nombre', 'Usuario', 'Password', 'Rol', 'Estado'];
    sheet.getRange(1, 1, 1, initialHeaders.length).setValues([initialHeaders]);
    sheet.setFrozenRows(1);
    values = [initialHeaders];
  }
  var headers = values[0].map(function(h){ return String(h || '').trim(); });
  var idxUsuario = findHeaderIndex_(headers, ['usuario', 'user']);
  var idxPassword = findHeaderIndex_(headers, ['password', 'contrasena', 'clave']);
  var idxRol = findHeaderIndex_(headers, ['rol', 'role', 'perfil']);
  if (idxUsuario < 0 || idxPassword < 0) {
    throw new Error('Faltan las columnas usuario y password. No se realizaron cambios.');
  }

  var candidates = [];
  for (var r = 1; r < values.length; r++) {
    var usuario = normalize_(values[r][idxUsuario]);
    var rol = idxRol >= 0 ? normalize_(values[r][idxRol]) : '';
    if (usuario === 'admin' || usuario === 'fragua' || rol === 'admin' || rol === 'administrador') {
      candidates.push(r + 1);
    }
  }
  if (candidates.length > 1) {
    throw new Error('Debe existir un único administrador identificable. Revisa la hoja Usuarios; no se realizaron cambios.');
  }

  var row = candidates.length ? candidates[0] : sheet.getLastRow() + 1;
  if (!candidates.length) {
    var newUser = headers.map(function(header) {
      var name = normalizeHeader_(header);
      if (name === 'id') return Utilities.getUuid();
      if (name === 'nombre') return 'Administrador Fragua';
      if (['rol', 'role', 'perfil'].indexOf(name) >= 0) return 'Admin';
      if (['estado', 'status'].indexOf(name) >= 0) return 'Activo';
      return '';
    });
    sheet.getRange(row, 1, 1, headers.length).setValues([newUser]);
  }
  sheet.getRange(row, idxUsuario + 1).setValue('Fragua');
  // La validacion de credenciales se realiza en el servidor.
  sheet.getRange(row, idxPassword + 1).setNumberFormat('@').setValue('sha256:' + sha256Hex_('2107'));
  SpreadsheetApp.flush();
  console.log('Acceso configurado en ' + ss.getUrl() + ', pestaña Usuarios, fila ' + row + '. Usuario: Fragua.');
  return 'Administrador actualizado: Fragua. Los demás datos de la cuenta se conservaron.';
}


function readGuia_(p) {
  var guia = {};
  if (p.guia) {
    try { guia = JSON.parse(p.guia); } catch (_) {}
  }
  if (p.payload) {
    try {
      var payloadObj = JSON.parse(p.payload);
      if (payloadObj && payloadObj.guia && typeof payloadObj.guia === 'object') {
        guia = merge_(guia, payloadObj.guia);
      }
    } catch (_) {}
  }

  if (!guia.Numero) guia.Numero = p.numero || '';
  if (!guia.Estado) guia.Estado = p.estado || '';
  if (!guia.Remitente) guia.Remitente = p.remitente || '';
  if (!guia.Destinatario) guia.Destinatario = p.destinatario || '';
  if (!guia.Direccion) guia.Direccion = p.direccion || '';
  if (guia.Peso == null || guia.Peso === '') guia.Peso = p.peso || '';
  if (!guia.Observaciones) guia.Observaciones = p.observaciones || p.obs || '';
  if (!guia.Fecha) guia.Fecha = p.fecha || new Date().toISOString();
  if (!guia.Pedidos) guia.Pedidos = p.pedidos || '';

  return guia;
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  var c = String(e.postData.contents || '').trim();
  if (!c) return {};
  try {
    var obj = JSON.parse(c);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch (_) {
    return {};
  }
}

function ensureHeaders_(sheet) {
  var required = ['Numero', 'Estado', 'Remitente', 'Destinatario', 'Direccion', 'Peso', 'Observaciones', 'Fecha', 'Pedidos', 'ActualizadoEn', 'Notificacion', 'NotificadoEstado', 'NotificadoEn', 'NotificacionError', 'SalidaEn'];
  var lastCol = sheet.getLastColumn();
  var firstRow = (lastCol > 0) ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

  var hasHeaders = firstRow.some(function(v){ return String(v || '').trim() !== ''; });
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, required.length).setValues([required]);
    return;
  }

  var current = firstRow.map(function(v){ return String(v || '').trim(); });
  var missing = [];
  for (var i = 0; i < required.length; i++) {
    if (current.indexOf(required[i]) === -1) missing.push(required[i]);
  }
  if (!missing.length) return;

  var merged = current.slice();
  for (var m = 0; m < missing.length; m++) merged.push(missing[m]);
  sheet.getRange(1, 1, 1, merged.length).setValues([merged]);
}

function openSpreadsheet_(spreadsheetId) {
  var id = String(spreadsheetId || '').trim();
  if (id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function rowToObj_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) obj[headers[i]] = row[i];
  return obj;
}

function normalize_(v) {
  return String(v || '').toLowerCase().trim();
}

function normalizeHeader_(v) {
  return normalize_(v)
    .replace(/[\u00e1\u00e0\u00e4\u00e2]/g, 'a')
    .replace(/[\u00e9\u00e8\u00eb\u00ea]/g, 'e')
    .replace(/[\u00ed\u00ec\u00ef\u00ee]/g, 'i')
    .replace(/[\u00f3\u00f2\u00f6\u00f4]/g, 'o')
    .replace(/[\u00fa\u00f9\u00fc\u00fb]/g, 'u')
    .replace(/\u00f1/g, 'n');
}

function findHeaderIndex_(headers, aliases) {
  var normalizedAliases = (aliases || []).map(function(a){ return normalizeHeader_(a); });
  for (var i = 0; i < headers.length; i++) {
    var h = normalizeHeader_(headers[i]);
    if (normalizedAliases.indexOf(h) !== -1) return i;
  }
  return -1;
}

function passwordMatches_(plainText, storedValue) {
  var candidate = String(plainText || '');
  var stored = String(storedValue || '').trim();
  if (!stored) return false;

  if (stored.indexOf('sha256:') === 0) {
    var expected = stored.substring(7).toLowerCase();
    return sha256Hex_(candidate) === expected;
  }

  return stored === candidate;
}

function sha256Hex_(text) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text || ''),
    Utilities.Charset.UTF_8
  );
  var out = [];
  for (var i = 0; i < bytes.length; i++) {
    var v = (bytes[i] + 256) % 256;
    var h = v.toString(16);
    out.push(h.length === 1 ? '0' + h : h);
  }
  return out.join('');
}

function merge_(a, b) {
  var out = {};
  var ka = Object.keys(a || {});
  var kb = Object.keys(b || {});
  for (var i = 0; i < ka.length; i++) out[ka[i]] = a[ka[i]];
  for (var j = 0; j < kb.length; j++) out[kb[j]] = b[kb[j]];
  return out;
}

function jsonOut_(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(String(callback) + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}


var FRAGUA_ZIMA_LOGO_BASE64 = "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";
