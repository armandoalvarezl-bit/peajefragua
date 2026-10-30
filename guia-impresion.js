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
    .slip { min-height:133mm; border:1.5px solid #1c252b; border-radius:2mm; padding:2mm; overflow-wrap:anywhere; display:flex; flex-direction:column; background:#fff; box-shadow:inset 0 0 0 1mm #edf0f2; }
    header { display:flex; justify-content:space-between; align-items:center; gap:3mm; position:relative; min-height:15mm; margin-bottom:1.5mm; isolation:isolate; }
    header::before { content:''; position:absolute; inset:0 0 0 23%; background:linear-gradient(110deg,#1e2931,#54616a); z-index:-1; border-radius:1mm; }
    .brand-area { align-self:stretch; display:flex; align-items:center; width:31%; background:#fff; position:relative; clip-path:polygon(0 0,100% 0,83% 100%,0 100%); padding:0 5mm 0 1mm; }
    .brand-area::after { display:none; } header::after { content:''; position:absolute; left:28%; top:0; bottom:0; width:1.5mm; background:#ffba00; transform:skew(-35deg); }
    .brand { font-size:27px; font-weight:900; font-style:italic; letter-spacing:-1px; line-height:1; }
    .brand-mark { color:#e96c00; letter-spacing:-5px; margin-right:3mm; }
    .print-brand-logo { width:100%; max-width:165px; height:12mm; display:block; object-fit:contain; filter:grayscale(1) brightness(.5); }
    .print-partner-logo { width:20px; height:20px; object-fit:contain; border-radius:3px; }
    .subtitle, .label { font-size:8px; color:#333; text-transform:uppercase; }
    .subtitle { margin-top:1mm; letter-spacing:2px; font-weight:bold; }
    .guide { text-align:center; width:32%; border:1px solid #283841; border-bottom:2px solid #ffb900; border-radius:1.5mm; padding:1.5mm; background:linear-gradient(#fff,#e7ecef); align-self:stretch; display:flex; flex-direction:column; justify-content:center; }
    .guide strong { display:block; font-size:19px; margin-top:1mm; letter-spacing:1px; }
    .service { display:flex; justify-content:space-between; align-items:center; gap:2mm; background:linear-gradient(#182126,#0b1115); border-radius:1mm; color:white; padding:1mm 2mm; font-size:9px; font-weight:bold; letter-spacing:.5px; }
    .service-name,.meta span { display:flex; align-items:center; gap:2mm; }.service-name { flex:1; }.service .icon { color:#ffbd00; width:4.5mm; height:4.5mm; }
    .meta { display:flex; justify-content:space-between; gap:4mm; padding:1mm 2mm; font-size:9px; font-weight:bold; }.meta .icon { width:3.5mm; height:3.5mm; }.meta span:last-child { border-left:1px solid #b2bac0; padding-left:2mm; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:1mm .5mm; padding:0 1mm; }
    .field { min-width:0; padding:1mm; border:1px solid #8796a2; border-radius:1.3mm; display:flex; align-items:center; gap:2mm; background:linear-gradient(100deg,#f6f8fa,#eaf0f3); }
    .field-icon { flex:0 0 7mm; border-right:1px solid #b5bec6; padding-right:2mm; }.field-icon .icon { width:4.5mm; height:4.5mm; }.field-copy { min-width:0; }.icon { width:4mm; height:4mm; display:inline-block; flex-shrink:0; color:#253139; }.destination .field-icon { color:#ffb300; }.destination .icon { color:#ffb300; }
    .wide { grid-column:1 / -1; }
    .label { display:block; margin-bottom:.4mm; font-weight:bold; letter-spacing:.3px; color:#374653; font-size:7px; }
    .value { white-space:pre-wrap; font-weight:600; }
    .destination .value { font-size:13px; font-weight:800; text-transform:uppercase; }
    table { width:calc(100% - 2mm); border-collapse:separate; border-spacing:0; border:1px solid #a9b5bf; border-radius:1.5mm; overflow:hidden; margin:1.5mm 1mm 0; table-layout:fixed; font-size:10px; }
    th, td { border-right:1px solid #c0c9d1; padding:.9mm; text-align:left; vertical-align:top; }
    th { background:linear-gradient(#63717e,#4e5d69); color:#fff; font-size:8px; text-transform:uppercase; }td { border-top:1px solid #c0c9d1; background:#f7f9fb; }th:last-child,td:last-child { border-right:0; }th:first-child,td:first-child,th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4) { text-align:center; }
    th:first-child { width:6%; } th:nth-child(2) { width:46%; }
    th:nth-child(3), th:nth-child(4) { width:12%; } th:last-child { width:24%; }
    td:last-child, th:last-child { text-align:right; }
    tr { break-inside:avoid; }
    .total { display:flex; justify-content:space-between; gap:2mm; padding:1.5mm 0; margin:1.5mm 1mm 2mm; border-left:3px solid #ffb900; border-radius:1mm; font-weight:bold; background:linear-gradient(#edf0f3,#e3e8ec); font-size:9px; }.total>span { display:flex; align-items:center; gap:2mm; padding:0 3mm; }.total>span+span { border-left:1.5px solid #ffb900; }
    .receipt { border:1px solid #65737e; border-radius:1.5mm; margin-top:auto; padding:2mm; display:flex; align-items:stretch; gap:3mm; min-height:28mm; }
    .receipt-signing { flex:1; min-width:0; display:flex; flex-direction:column; }
    .qr-validation { width:27mm; flex:0 0 27mm; border-left:1px solid #ffb900; padding-left:3mm; text-align:center; align-self:center; }
    .guide-qr-image { width:21mm; height:21mm; display:block; margin:auto; image-rendering:pixelated; }
    .qr-validation a { display:block; }
    .qr-validation strong { display:block; font-size:7px; margin-top:1mm; text-transform:uppercase; }
    .receipt-title { font-size:8px; font-weight:bold; text-transform:uppercase; display:flex; align-items:center; gap:2mm; color:#263744; }.receipt-title .icon { color:#ffb900; }
    .signatures { display:flex; gap:5mm; padding:6mm 2mm 0; }
    .signature { flex:1; border-top:1px solid #333; padding-top:1mm; text-align:center; font-size:7px; }
    footer { font-size:6.5px; margin-top:auto; padding-top:3mm; color:#46535e; display:flex; align-items:center; gap:1mm; }footer .icon { width:2.5mm; height:2.5mm; }
    .cut { height:7mm; display:flex; align-items:center; }
    .cut::after { content:''; width:100%; border-top:1px dashed #999; }
    .measure { position:absolute; left:-10000px; top:0; width:190mm; }
  `;

  function icon(name) {
    const shapes = {
      user:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3Z"/>',
      pin:'<path d="M12 23S3 14 3 9a9 9 0 0 1 18 0c0 5-9 14-9 14Z"/><circle cx="12" cy="9" r="3" fill="white"/>',
      note:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h8M8 18h5" fill="none" stroke="white" stroke-width="1.5"/>',
      truck:'<path d="M2 5h13v12H2ZM15 10h4l4 5v3h-8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>',
      calendar:'<rect x="3" y="5" width="18" height="17" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 2v6M16 2v6M7 14h3m4 0h3m-10 4h3m4 0h3" stroke="currentColor" stroke-width="2"/>',
      clock:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 3" fill="none" stroke="currentColor" stroke-width="2"/>',
      box:'<path d="m12 2 10 5v11l-10 5-10-5V7Z"/><path d="m2 7 10 5 10-5M12 12v11M7 4l10 5" fill="none" stroke="white" stroke-width="1.2"/>',
      weight:'<path d="M9 6h6l5 16H4Z"/><circle cx="12" cy="4" r="3" fill="none" stroke="currentColor" stroke-width="2"/><text x="8" y="18" fill="white" font-size="8" font-family="Arial">G</text>',
      money:'<ellipse cx="12" cy="5" rx="9" ry="4"/><path d="M3 9c4 4 14 4 18 0v4c-4 4-14 4-18 0Zm0 7c4 4 14 4 18 0v4c-4 4-14 4-18 0Z"/>',
      pen:'<path d="m3 16 13-13 5 5L8 21l-6 1Z"/><path d="m13 6 5 5M3 16l5 5" fill="none" stroke="white"/>',
      info:'<circle cx="12" cy="12" r="11"/><path d="M12 10v8" stroke="white" stroke-width="2"/><circle cx="12" cy="6" r="1.2" fill="white"/>'
    };
    return '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + shapes[name] + '</svg>';
  }

  function article(guide, rows, page, pages) {
    const items = Array.isArray(guide.pedidos) ? guide.pedidos : [];
    const total = items.reduce((sum, item) => sum + number(item.valor), 0);
    const totalKnown = items.every(item => item.valor != null && item.valor !== '' && Number.isFinite(Number(item.valor)));
    const weight = guide.peso !== '' && guide.peso != null ? escape(guide.peso) : '—';
    const units = items.reduce((sum, item) => sum + number(item.cantidad ?? 1), 0);
    const field = (label, value, symbol, wide = false, destination = false) => `<div class="field${wide ? ' wide' : ''}${destination ? ' destination' : ''}"><span class="field-icon">${icon(symbol)}</span><div class="field-copy"><span class="label">${label}</span><div class="value">${escape(value || '—')}</div></div></div>`;
    return `<article class="slip">
      <header><div class="brand-area"><img class="print-brand-logo" src="fragua-logo.svg" alt="Fragua · Envíos y transporte"></div>
        <div class="guide"><span class="label">Número de guía</span><strong>${escape(guide.numero || '—')}</strong></div></header>
      <div class="service"><span class="service-name">${icon('truck')} GUÍA DE TRANSPORTE - CONTROL DE ENVÍO</span><span>Hoja ${page} de ${pages}</span><img class="print-partner-logo" src="OIP.jpeg" alt="Zima"></div>
      <div class="meta"><span>${icon('calendar')} Emisión: ${escape(date(guide.created_at))}</span><span>${icon('clock')} Estado: ${escape(guide.estado || '—')}</span></div>
      <div class="grid">${field('Datos del remitente', guide.remitente,'user')}${field('Datos del destinatario', guide.destinatario,'pin')}${field('Destino / dirección de entrega', guide.direccion,'pin', true, true)}${field('Observaciones e instrucciones de entrega', guide.obs,'note', true)}</div>
      <table><thead><tr><th>#</th><th>Descripción</th><th>Cant.</th><th>Kg</th><th>Valor declarado</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Sin pedidos registrados.</td></tr>'}</tbody></table>
      <div class="total"><span>${icon('box')} Unidades: ${units}</span><span>${icon('weight')} Peso total: ${weight} kg</span><span>${icon('money')} Total declarado: ${totalKnown ? money(total) : 'No informado'}</span></div>
      <div class="receipt"><div class="receipt-signing"><div class="receipt-title">${icon('pen')} Constancia de entrega - Recibí a satisfacción</div><div class="signatures"><div class="signature">Firma remitente</div><div class="signature">Firma transportador</div><div class="signature">Nombre, documento y firma de quien recibe</div></div><footer>${icon('info')} Verifique cantidades y estado de la mercancía al recibir. Conserve esta guía como comprobante.</footer></div><div class="qr-validation">${guide.printQR}</div></div>
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
