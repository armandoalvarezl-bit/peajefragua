function doGet(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var action = String(p.action || '').toLowerCase();
    if (!action || action === 'search') return handleSearch_(p);
    if (action === 'upsert') return handleUpsert_(p, null);
    if (action === 'delete') return handleDelete_(p);
    return jsonOut_({ ok: false, msg: 'Action no soportada' }, p.callback);
  } catch (err) {
    return jsonOut_({ ok: false, msg: String(err && err.message || err) }, (e && e.parameter && e.parameter.callback) || '');
  }
}

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var bodyObj = parseBody_(e);
    var merged = merge_(p, bodyObj || {});
    var action = String(merged.action || 'upsert').toLowerCase();

    if (action === 'upsert') return handleUpsert_(merged, e);
    if (action === 'delete') return handleDelete_(merged);
    if (action === 'search') return handleSearch_(merged);
    return jsonOut_({ ok: false, msg: 'Action no soportada' }, merged.callback);
  } catch (err) {
    return jsonOut_({ ok: false, msg: String(err && err.message || err) }, '');
  }
}

function handleSearch_(p) {
  var ss = openSpreadsheet_(p.spreadsheetId);
  var sheet = ss.getSheetByName(p.hoja || 'Tabla_1');
  if (!sheet) return jsonOut_({ ok: false, msg: 'No existe hoja' }, p.callback);

  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return jsonOut_({ ok: true, data: [] }, p.callback);

  var headers = values[0].map(function(h){ return String(h || '').trim(); });
  var term = normalize_(p.numero || p.q || '');

  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var obj = rowToObj_(headers, values[r]);
    if (!term) {
      rows.push(obj);
      continue;
    }
    var nGuia = normalize_(obj.Numero || obj.numero || '');
    if (nGuia.indexOf(term) !== -1) rows.push(obj);
  }

  return jsonOut_({ ok: true, data: rows }, p.callback);
}

function handleUpsert_(p) {
  var ss = openSpreadsheet_(p.spreadsheetId);
  var sheetName = p.hoja || 'Tabla_1';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  ensureHeaders_(sheet);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var guia = readGuia_(p);
  var numero = String(guia.Numero || '').trim();
  if (!numero) return jsonOut_({ ok: false, msg: 'Numero vacio' }, p.callback);

  var lastRow = sheet.getLastRow();
  var rowIndex = -1;
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var idxNumero = headers.indexOf('Numero');
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][idxNumero] || '').trim() === numero) {
        rowIndex = i + 2;
        break;
      }
    }
  }

  var row = headers.map(function(h){ return guia[h] != null ? guia[h] : ''; });
  if (rowIndex === -1) {
    sheet.appendRow(row);
    rowIndex = sheet.getLastRow();
  } else {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
  }

  return jsonOut_({ ok: true, row: rowIndex, numero: numero }, p.callback);
}

function handleDelete_(p) {
  var ss = openSpreadsheet_(p.spreadsheetId);
  var sheet = ss.getSheetByName(p.hoja || 'Tabla_1');
  if (!sheet) return jsonOut_({ ok: false, msg: 'No existe hoja' }, p.callback);

  ensureHeaders_(sheet);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var guia = readGuia_(p);
  var numero = String(guia.Numero || p.numero || '').trim();
  if (!numero) return jsonOut_({ ok: false, msg: 'Numero vacio' }, p.callback);

  var idxNumero = headers.indexOf('Numero');
  if (idxNumero === -1) return jsonOut_({ ok: false, msg: 'Columna Numero no encontrada' }, p.callback);

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonOut_({ ok: true, deleted: 0, numero: numero }, p.callback);

  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var rowToDelete = -1;
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][idxNumero] || '').trim() === numero) {
      rowToDelete = i + 2;
      break;
    }
  }

  if (rowToDelete === -1) return jsonOut_({ ok: true, deleted: 0, numero: numero }, p.callback);
  sheet.deleteRow(rowToDelete);
  return jsonOut_({ ok: true, deleted: 1, numero: numero }, p.callback);
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
  var required = ['Numero', 'Estado', 'Remitente', 'Destinatario', 'Direccion', 'Peso', 'Observaciones', 'Fecha', 'Pedidos'];
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
