/* Plantilla de impresión y PDF. Generación QR local con vendor/qrcode.min.js. */
(function () {
  'use strict';
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const money = value => '$ ' + number(value).toLocaleString('es-CO');
  const date = value => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  };
  function qrMarkup(guide) {
    if (!window.QRCode) throw new Error('Falta cargar vendor/qrcode.min.js para generar el QR.');
    const numero = String(guide.numero || '').trim();
    const url = new URL('consulta_externa.html', document.baseURI);
    url.searchParams.set('numero',numero);
    const online = /^https?:$/.test(url.protocol);
    const text = online ? url.href : 'FRAGUA | GUIA: ' + numero;
    const node = document.createElement('div');
    new QRCode(node,{text,width:256,height:256,correctLevel:QRCode.CorrectLevel.M});
    const source = node.querySelector('canvas');
    if (!source) throw new Error('No se pudo generar el QR de la guía.');
    const canvas = document.createElement('canvas');
    canvas.width=canvas.height=320;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,320,320);ctx.drawImage(source,32,32);
    const image = '<img class="guide-qr-image" src="' + canvas.toDataURL('image/png') + '" alt="QR de la guía ' + escape(numero) + '">';
    return (online ? '<a href="' + escape(url.href) + '" target="_blank" rel="noopener">' + image + '</a>' : image) + '<strong>' + (online ? 'Consultar envío' : 'Identificación del envío') + '</strong>';
  }
  const styles = `
    @page { size:A4; margin:10mm; }
    * { box-sizing:border-box; }
    body { margin:0; color:#111; background:white; font:11px Arial,sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page { width:190mm; break-after:page; }
    .page:last-child { break-after:auto; }
    .slip { min-height:133mm; border:1.5px solid #111; padding:3mm; overflow-wrap:anywhere; display:flex; flex-direction:column; }
    header { display:flex; justify-content:space-between; align-items:center; gap:4mm; border-bottom:3px solid #f58220; padding-bottom:2mm; }
    .brand { font-size:27px; font-weight:900; font-style:italic; letter-spacing:-1px; line-height:1; }
    .brand-mark { color:#e96c00; letter-spacing:-5px; margin-right:3mm; }
    .print-brand-logo { width:170px; height:47px; display:block; object-fit:contain; }
    .print-partner-logo { width:20px; height:20px; object-fit:contain; border-radius:3px; }
    .subtitle, .label { font-size:8px; color:#333; text-transform:uppercase; }
    .subtitle { margin-top:1mm; letter-spacing:2px; font-weight:bold; }
    .guide { text-align:center; width:48%; border:1.5px solid #111; padding:1.5mm; }
    .guide strong { display:block; font-size:19px; margin-top:1mm; letter-spacing:1px; }
    .service { display:flex; justify-content:space-between; align-items:center; gap:2mm; background:#111; color:white; padding:1.5mm 2mm; font-size:9px; font-weight:bold; letter-spacing:.5px; margin-top:2mm; }
    .meta { display:flex; justify-content:space-between; gap:4mm; padding:2mm 0; font-size:9px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid #222; border-left:1px solid #222; }
    .field { min-width:0; padding:2mm; border-right:1px solid #222; border-bottom:1px solid #222; }
    .wide { grid-column:1 / -1; }
    .label { display:block; margin-bottom:1mm; font-weight:bold; }
    .value { white-space:pre-wrap; font-weight:600; }
    .destination .value { font-size:14px; font-weight:800; text-transform:uppercase; }
    table { width:100%; border-collapse:collapse; margin-top:2mm; table-layout:fixed; font-size:10px; }
    th, td { border:1px solid #222; padding:1.5mm; text-align:left; vertical-align:top; }
    th { background:#eee; font-size:8px; text-transform:uppercase; }
    th:first-child { width:6%; } th:nth-child(2) { width:46%; }
    th:nth-child(3), th:nth-child(4) { width:12%; } th:last-child { width:24%; }
    td:last-child, th:last-child { text-align:right; }
    tr { break-inside:avoid; }
    .total { display:flex; justify-content:space-between; gap:2mm; padding:2mm; border:1px solid #222; border-top:0; font-weight:bold; background:#f6f6f6; font-size:10px; }
    .receipt { border:1px solid #222; margin-top:auto; padding:2mm; display:flex; align-items:center; gap:3mm; }
    .receipt-signing { flex:1; min-width:0; }
    .qr-validation { width:27mm; flex:0 0 27mm; border-left:1px solid #bbb; padding-left:3mm; text-align:center; }
    .guide-qr-image { width:23mm; height:23mm; display:block; margin:auto; image-rendering:pixelated; }
    .qr-validation a { display:block; }
    .qr-validation strong { display:block; font-size:7px; margin-top:1mm; text-transform:uppercase; }
    .receipt-title { font-size:8px; font-weight:bold; text-transform:uppercase; }
    .signatures { display:flex; gap:6mm; padding-top:6mm; }
    .signature { flex:1; border-top:1px solid #333; padding-top:1mm; text-align:center; font-size:9px; }
    footer { font-size:7px; margin-top:2mm; color:#333; }
    .cut { height:7mm; display:flex; align-items:center; }
    .cut::after { content:''; width:100%; border-top:1px dashed #999; }
    .measure { position:absolute; left:-10000px; top:0; width:190mm; }
  `;

  function article(guide, rows, page, pages) {
    const items = Array.isArray(guide.pedidos) ? guide.pedidos : [];
    const total = items.reduce((sum, item) => sum + number(item.valor), 0);
    const totalKnown = items.every(item => item.valor != null && item.valor !== '' && Number.isFinite(Number(item.valor)));
    const weight = guide.peso !== '' && guide.peso != null ? escape(guide.peso) : '—';
    const units = items.reduce((sum, item) => sum + number(item.cantidad ?? 1), 0);
    const field = (label, value, wide = false, destination = false) => `<div class="field${wide ? ' wide' : ''}${destination ? ' destination' : ''}"><span class="label">${label}</span><div class="value">${escape(value || '—')}</div></div>`;
    return `<article class="slip">
      <header><div><img class="print-brand-logo" src="fragua-logo.svg" alt="Fragua · Envíos y transporte"></div>
        <div class="guide"><span class="label">Número de guía</span><strong>${escape(guide.numero || '—')}</strong></div></header>
      <div class="service"><span>GUÍA DE TRANSPORTE · CONTROL DE ENVÍO</span><span>Hoja ${page} de ${pages}</span><img class="print-partner-logo" src="OIP.jpeg" alt="Zima"></div>
      <div class="meta"><span>Emisión: ${escape(date(guide.created_at))}</span><span>Estado: ${escape(guide.estado || '—')}</span></div>
      <div class="grid">${field('Datos del remitente', guide.remitente)}${field('Datos del destinatario', guide.destinatario)}${field('Destino / dirección de entrega', guide.direccion, true, true)}${field('Observaciones e instrucciones de entrega', guide.obs, true)}</div>
      <table><thead><tr><th>#</th><th>Descripción</th><th>Cant.</th><th>Kg</th><th>Valor declarado</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Sin pedidos registrados.</td></tr>'}</tbody></table>
      <div class="total"><span>Unidades: ${units}</span><span>Peso total: ${weight} kg</span><span>Total declarado: ${totalKnown ? money(total) : 'No informado'}</span></div>
      <div class="receipt"><div class="receipt-signing"><div class="receipt-title">Constancia de entrega · Recibí a satisfacción</div><div class="signatures"><div class="signature">Firma remitente</div><div class="signature">Firma transportador</div><div class="signature">Nombre, documento y firma de quien recibe</div></div></div><div class="qr-validation">${guide.printQR}</div></div>
      <footer>Verifique cantidades y estado de la mercancía al recibir. Conserve esta guía como comprobante.</footer>
    </article>`;
  }

  function render(doc, guide) {
    guide = {...guide, printQR:qrMarkup(guide)};
    const items = Array.isArray(guide.pedidos) ? guide.pedidos : [];
    const rows = items.map((item, index) => `<tr><td>${index + 1}</td><td>${escape(item.descripcion || '—')}</td><td>${escape(item.cantidad ?? '—')}</td><td>${escape(item.peso ?? '—')}</td><td>${item.valor == null || item.valor === '' ? '—' : money(item.valor)}</td></tr>`);
    doc.open();
    doc.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="${escape(document.baseURI)}"><title>${escape('Guía ' + (guide.numero || 'envío'))}</title><style>${styles}</style></head><body></body></html>`);
    doc.close();
    const measure = doc.createElement('div');
    measure.className = 'measure';
    doc.body.appendChild(measure);
    const groups = [];
    let current = '';
    for (const row of rows) {
      measure.innerHTML = article(guide, current + row, 1, 1);
      // Dos ejemplares de 133 mm y una línea de corte caben en A4.
      if (current && measure.firstElementChild.getBoundingClientRect().height > 133 * 96 / 25.4 + 1) {
        groups.push(current);
        current = row;
      } else {
        current += row;
      }
    }
    groups.push(current);
    measure.remove();
    doc.body.innerHTML = groups.map((group, index) => {
      const copy = article(guide, group, index + 1, groups.length);
      return `<section class="page">${copy}<div class="cut" aria-hidden="true"></div>${copy}</section>`;
    }).join('');
  }

  let frame;
  async function print(guide) {
    if (!guide) return;
    if (frame) frame.remove();
    frame = document.createElement('iframe');
    frame.title = 'Guía lista para imprimir o guardar como PDF';
    frame.style.cssText = 'position:fixed;width:1px;height:1px;bottom:0;left:0;border:0;';
    document.body.appendChild(frame);
    render(frame.contentDocument, guide);
    const target = frame.contentWindow;
    await Promise.all([...frame.contentDocument.images].map(img => img.decode().catch(() => {})));
    target.requestAnimationFrame(() => {
      target.focus();
      target.print();
    });
  }
  window.GuiaImpresion = Object.freeze({ print, render, qrMarkup });
}());
