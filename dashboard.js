(function () {
  'use strict';
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const dayKey = value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(date) : '';
  };
  function summarize(guides, now = new Date()) {
    const today = dayKey(now);
    const days = Array.from({length:7},(_,i) => {
      const date = new Date(now.getTime() - (6-i)*86400000);
      return {key:dayKey(date),label:new Intl.DateTimeFormat('es-CO',{timeZone:'America/Bogota',weekday:'short',day:'numeric'}).format(date),count:0};
    });
    const counts = [0,0,0,0];
    let weight=0, pendingMail=0, todayCount=0;
    for (const guide of guides) {
      const state=norm(guide.estado);
      counts[state==='entregado'?2:state.includes('transito')?1:state==='pendiente'?0:3]++;
      const key=dayKey(guide.created_at);
      const day=days.find(item=>item.key===key);
      if (day) day.count++;
      if (key===today) todayCount++;
      const kilos=Number(guide.peso);
      if (Number.isFinite(kilos) && kilos>0) weight+=kilos;
      if (norm(guide.notification)==='pendiente') pendingMail++;
    }
    return {days,counts,weight,pendingMail,todayCount,total:guides.length,week:days.reduce((sum,day)=>sum+day.count,0)};
  }
  function render(guides) {
    const s=summarize(guides);
    const set=(id,value)=>{document.getElementById(id).textContent=value;};
    set('dashboard-today',s.todayCount);
    set('dashboard-weight',s.weight.toLocaleString('es-CO',{maximumFractionDigits:1})+' kg');
    set('dashboard-mail',s.pendingMail);
    set('dashboard-week',s.week);
    set('dashboard-ring-total',s.total);
    const colors=['#efad5c','#f58220','#319777','#a3afbf'];
    let offset=0;
    const slices=s.counts.map((count,i)=>{
      const from=offset; offset+=s.total?count/s.total*100:0;
      return colors[i]+' '+from+'% '+offset+'%';
    });
    const ring=document.getElementById('dashboard-ring');
    ring.style.background=s.total?'conic-gradient('+slices.join(',')+')':'#e8edf2';
    ring.setAttribute('aria-label','Distribución: '+s.counts[0]+' pendientes, '+s.counts[1]+' en tránsito, '+s.counts[2]+' entregadas, '+s.counts[3]+' en otros estados.');
    document.getElementById('dashboard-legend').innerHTML=['Pendientes','En tránsito','Entregadas','Otros estados'].map((label,i)=>`<div><span><i style="background:${colors[i]}"></i>${label}</span><strong>${s.counts[i]}</strong><small>${s.total?Math.round(s.counts[i]/s.total*100):0}%</small></div>`).join('');
    const max=Math.max(1,...s.days.map(day=>day.count));
    document.getElementById('dashboard-bars').innerHTML=s.days.map(day=>`<div class="dashboard-day"><div class="dashboard-bar-track"><span class="dashboard-bar-count">${day.count}</span><div class="dashboard-bar" style="height:${day.count/max*100}%"></div></div><small>${day.label}</small></div>`).join('');
    set('dashboard-chart-note',s.week?'Guías registradas por día · hora de Colombia':'Sin registros en los últimos 7 días');
    set('dashboard-updated','Actualizado '+new Date().toLocaleTimeString('es-CO',{timeZone:'America/Bogota',hour:'2-digit',minute:'2-digit'}));
  }
  window.FraguaDashboard=Object.freeze({summarize,render});
}());
