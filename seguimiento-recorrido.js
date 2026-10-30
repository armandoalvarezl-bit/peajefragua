(function () {
  'use strict';
  const duration = 45 * 60 * 1000;
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function calculate(state, departure, now = Date.now()) {
    const status = normalize(state);
    const start = Date.parse(departure);
    if (status === 'entregado') return {mode:'delivered',progress:100,title:'Entrega confirmada',remaining:'Entregado',elapsed:'Recorrido completado'};
    if (!status.includes('transito')) return {mode:'waiting',progress:0,title:'Preparando el envío',remaining:'Esperando salida',elapsed:'El recorrido empieza al salir'};
    if (!Number.isFinite(start)) return {mode:'unknown',progress:0,title:'El envío está en camino',remaining:'Hora de salida por confirmar',elapsed:'Registra la salida para calcular el avance'};
    if (start > now) return {mode:'waiting',progress:0,title:'Salida programada',remaining:'Esperando la hora de salida',elapsed:'El contador todavía no ha comenzado'};
    const elapsed = Math.max(0, now - start);
    const seconds = Math.max(0, Math.ceil((duration - elapsed) / 1000));
    const minutes = Math.floor(seconds / 60);
    const rest = String(seconds % 60).padStart(2,'0');
    return {
      mode:elapsed >= duration ? 'due' : 'moving',
      progress:Math.min(98,elapsed / duration * 100),
      title:elapsed >= duration ? 'Tiempo estimado cumplido' : elapsed >= 40 * 60 * 1000 ? 'Ya está cerca del destino' : 'Tu envío va en camino',
      remaining:elapsed >= duration ? 'Entrega por confirmar' : minutes + ' min ' + rest + ' s',
      elapsed:Math.floor(elapsed / 60000) + ' min desde la salida'
    };
  }

  const van = `<svg viewBox="0 0 128 76" aria-hidden="true"><ellipse cx="65" cy="66" rx="52" ry="5" fill="#12233e18"/><g class="van-body"><rect x="6" y="14" width="72" height="44" rx="7" fill="#f58220"/><path d="M78 27h20l20 18v13H78Z" fill="#14263e"/><path d="M86 31h10l13 13H86Z" fill="#c7e5ef"/><path d="M6 47h72v11H6Z" fill="#d56a0e"/><rect x="17" y="26" width="44" height="20" rx="4" fill="#fff"/><text x="21" y="39" font-family="Arial,sans-serif" font-size="9" font-style="italic" font-weight="bold" fill="#14263e">FRAGUA</text><rect x="111" y="48" width="9" height="5" rx="2" fill="#ffd180"/><rect x="3" y="49" width="4" height="7" rx="1" fill="#bd4e13"/></g><g class="van-wheel"><circle cx="29" cy="59" r="11" fill="#14263e"/><circle cx="29" cy="59" r="5" fill="#b9c6d8"/><path d="M29 54v10m-5-5h10" stroke="#6d8099" stroke-width="2"/></g><g class="van-wheel"><circle cx="100" cy="59" r="11" fill="#14263e"/><circle cx="100" cy="59" r="5" fill="#b9c6d8"/><path d="M100 54v10m-5-5h10" stroke="#6d8099" stroke-width="2"/></g></svg>`;

  function render(guide) {
    return `<section class="shipment-journey" data-journey-state="${esc(guide.estado)}" data-journey-departure="${esc(guide.departure || '')}" aria-label="Recorrido estimado del envío"><div class="journey-heading"><div><span class="section-eyebrow">UN POCO MÁS CERCA</span><h4 class="journey-title">Preparando recorrido…</h4></div><span class="journey-duration">Trayecto estimado · 45 min</span></div><div class="journey-road"><div class="journey-road-base"></div><div class="journey-road-progress"></div><div class="journey-origin" aria-hidden="true">●</div><div class="journey-destination" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 15 13-11 13 11M7 12v16h18V12M13 28V18h6v10"/></svg></div><div class="journey-van">${van}</div></div><div class="journey-stops"><span>Salida · Fragua</span><span>Destino del envío</span></div><div class="journey-countdown"><div><small>TIEMPO RESTANTE ESTIMADO</small><strong class="journey-remaining" role="timer" aria-live="off">—</strong></div><span class="journey-elapsed"></span></div><p class="journey-note">Avance calculado por tiempo de trayecto. La entrega se confirma con el estado de la guía.</p></section>`;
  }
  function update(root = document) {
    root.querySelectorAll('.shipment-journey').forEach(node => {
      const result = calculate(node.dataset.journeyState,node.dataset.journeyDeparture);
      node.dataset.mode = result.mode;
      node.style.setProperty('--journey-progress',result.progress + '%');
      node.querySelector('.journey-title').textContent = result.title;
      node.querySelector('.journey-remaining').textContent = result.remaining;
      node.querySelector('.journey-elapsed').textContent = result.elapsed;
    });
  }
  window.FraguaJourney = Object.freeze({render,update,calculate});
  setInterval(() => update(),1000);
}());
