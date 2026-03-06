<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mantenimiento | Envios Zima</title>
  <meta name="description" content="Pagina de mantenimiento de Envios Zima" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg-1:#05143f;
      --bg-2:#0b2a6f;
      --bg-3:#15449f;
      --panel:rgba(255,255,255,.08);
      --panel-border:rgba(255,255,255,.2);
      --text:#e7eefc;
      --muted:#c6d3f8;
      --ok:#34d399;
      --warn:#f59e0b;
      --shadow:0 24px 50px rgba(2,6,23,.42);
    }

    *{ box-sizing:border-box; }
    html,body{
      margin:0;
      min-height:100%;
      color:var(--text);
      font-family:"Manrope","Segoe UI",Tahoma,Geneva,Verdana,sans-serif;
      background:
        radial-gradient(circle at 10% 12%, rgba(94,234,212,.16), transparent 34%),
        radial-gradient(circle at 85% 15%, rgba(59,130,246,.24), transparent 30%),
        radial-gradient(circle at 88% 88%, rgba(37,99,235,.2), transparent 34%),
        linear-gradient(145deg,var(--bg-1) 0%,var(--bg-2) 52%,var(--bg-3) 100%);
    }

    .bg-shape{
      position:fixed;
      inset:auto auto 8% 6%;
      width:260px;
      height:260px;
      border-radius:50%;
      background:radial-gradient(circle, rgba(45,212,191,.22), rgba(45,212,191,0));
      filter:blur(4px);
      pointer-events:none;
      animation:floaty 6s ease-in-out infinite;
    }
    .bg-shape.b{
      inset:8% 10% auto auto;
      width:220px;
      height:220px;
      background:radial-gradient(circle, rgba(96,165,250,.28), rgba(96,165,250,0));
      animation-delay:1.4s;
    }
    @keyframes floaty{
      0%,100%{ transform:translateY(0); }
      50%{ transform:translateY(-10px); }
    }

    .shell{
      width:min(1060px, 92vw);
      margin:clamp(20px, 5vw, 48px) auto;
    }

    .topline{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      margin-bottom:16px;
      color:var(--muted);
      font-size:.9rem;
    }

    .brand{
      display:flex;
      align-items:center;
      gap:.55rem;
      font-weight:800;
      letter-spacing:.01em;
      color:#fff;
    }

    .dot{
      width:10px;
      height:10px;
      border-radius:50%;
      background:var(--warn);
      box-shadow:0 0 0 6px rgba(245,158,11,.18);
      animation:pulse 1.8s infinite;
    }
    @keyframes pulse{
      0%{ transform:scale(.95); box-shadow:0 0 0 0 rgba(245,158,11,.36); }
      70%{ transform:scale(1); box-shadow:0 0 0 11px rgba(245,158,11,0); }
      100%{ transform:scale(.95); box-shadow:0 0 0 0 rgba(245,158,11,0); }
    }

    .panel{
      display:grid;
      grid-template-columns:1.25fr .95fr;
      gap:18px;
      background:var(--panel);
      border:1px solid var(--panel-border);
      border-radius:24px;
      padding:clamp(18px, 2.4vw, 34px);
      box-shadow:var(--shadow);
      backdrop-filter:blur(8px);
    }

    .hero h1{
      margin:.3rem 0 .65rem;
      line-height:1.05;
      font-size:clamp(1.7rem, 3.9vw, 3.2rem);
      letter-spacing:-.02em;
      color:#fff;
    }
    .hero p{
      margin:0 0 .9rem;
      color:var(--muted);
      max-width:60ch;
      font-size:clamp(.97rem, 1.4vw, 1.08rem);
    }
    .tag{
      display:inline-flex;
      align-items:center;
      gap:.45rem;
      border:1px solid rgba(255,255,255,.28);
      background:rgba(255,255,255,.08);
      color:#fff;
      border-radius:999px;
      padding:.34rem .66rem;
      font-size:.78rem;
      font-weight:700;
      letter-spacing:.04em;
      text-transform:uppercase;
    }

    .only-info{
      margin-top:1rem;
      border:1px dashed rgba(255,255,255,.28);
      border-radius:12px;
      padding:.7rem .8rem;
      color:#dbe7ff;
      background:rgba(255,255,255,.05);
      font-size:.93rem;
    }

    .meta{
      margin-top:1rem;
      display:grid;
      grid-template-columns:repeat(2,minmax(140px,1fr));
      gap:.65rem;
    }
    .meta-box{
      background:rgba(255,255,255,.08);
      border:1px solid rgba(255,255,255,.18);
      border-radius:12px;
      padding:.64rem .7rem;
    }
    .meta-k{
      color:var(--muted);
      font-size:.74rem;
      text-transform:uppercase;
      letter-spacing:.04em;
      font-weight:700;
    }
    .meta-v{
      color:#fff;
      margin-top:.22rem;
      font-size:.95rem;
      font-weight:700;
      word-break:break-word;
    }
    .countdown-box{
      grid-column:1 / -1;
    }
    .countdown-time{
      margin-top:.3rem;
      font-size:clamp(1.4rem, 3.5vw, 2.2rem);
      font-weight:800;
      letter-spacing:.08em;
      color:#ffffff;
    }
    .countdown-track{
      margin-top:.55rem;
      height:8px;
      width:100%;
      border-radius:999px;
      overflow:hidden;
      background:rgba(255,255,255,.16);
      border:1px solid rgba(255,255,255,.22);
    }
    .countdown-bar{
      display:block;
      height:100%;
      width:0%;
      border-radius:inherit;
      background:linear-gradient(90deg,#14b8a6,#0ea5e9);
      transition:width .4s ease;
    }
    .countdown-note{
      margin-top:.5rem;
      font-size:.86rem;
      color:#dbe7ff;
    }

    .status{
      background:rgba(4,12,40,.45);
      border:1px solid rgba(255,255,255,.17);
      border-radius:16px;
      padding:1rem .95rem;
    }
    .status h2{
      margin:.1rem 0 .8rem;
      font-size:1rem;
      letter-spacing:.01em;
    }
    .status-list{
      margin:0;
      padding:0;
      list-style:none;
      display:grid;
      gap:.6rem;
    }
    .status-item{
      display:flex;
      align-items:flex-start;
      gap:.58rem;
      line-height:1.35;
      color:var(--muted);
      font-size:.93rem;
    }
    .status-item strong{ color:#fff; }
    .check{
      margin-top:.12rem;
      width:15px;
      height:15px;
      border-radius:50%;
      flex:0 0 15px;
      background:var(--ok);
      box-shadow:0 0 0 5px rgba(52,211,153,.16);
    }
    .check.warn{
      background:var(--warn);
      box-shadow:0 0 0 5px rgba(245,158,11,.2);
    }

    .foot{
      margin-top:12px;
      text-align:center;
      color:var(--muted);
      font-size:.84rem;
    }

    @media (max-width:900px){
      .panel{
        grid-template-columns:1fr;
      }
      .meta{
        grid-template-columns:1fr;
      }
      .topline{
        flex-direction:column;
        align-items:flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="bg-shape"></div>
  <div class="bg-shape b"></div>

  <main class="shell">
    <div class="topline">
      <div class="brand">
        <span class="dot" aria-hidden="true"></span>
        <span>Envios Zima</span>
      </div>
      <div id="now-time">Actualizando hora...</div>
    </div>

    <section class="panel" aria-labelledby="mt-title">
      <div class="hero">
        <span class="tag">Mantenimiento programado</span>
        <h1 id="mt-title">Estamos mejorando la plataforma para volver mas rapido y estable.</h1>
        <p>
          La pagina se encuentra temporalmente en mantenimiento mientras aplicamos ajustes de rendimiento y
          mejoras de experiencia. Gracias por tu paciencia.
        </p>
        <p>
          Si necesitas soporte inmediato, escribe a
          <strong>soporte@envioszima.com</strong> e incluye el numero de guia.
        </p>

        <div class="only-info">
          Esta ventana permanecera en mantenimiento hasta finalizar la actualizacion del sistema.
        </div>

        <div class="meta">
          <div class="meta-box">
            <div class="meta-k">Estado actual</div>
            <div class="meta-v">Mantenimiento activo</div>
          </div>
          <div class="meta-box">
            <div class="meta-k">Retorno estimado</div>
            <div class="meta-v" id="eta-time">Calculando...</div>
          </div>
          <div class="meta-box countdown-box">
            <div class="meta-k">Tiempo restante estimado (4 horas)</div>
            <div class="countdown-time" id="countdown-time">04:00:00</div>
            <div class="countdown-track" aria-hidden="true">
              <span class="countdown-bar" id="countdown-progress"></span>
            </div>
            <div class="countdown-note" id="countdown-note">Mantenimiento en progreso.</div>
          </div>
        </div>
      </div>

      <aside class="status" aria-label="Detalle del mantenimiento">
        <h2>Estado del servicio</h2>
        <ul class="status-list">
          <li class="status-item">
            <span class="check"></span>
            <span><strong>Base de datos:</strong> operativa y sin perdida de informacion.</span>
          </li>
          <li class="status-item">
            <span class="check warn"></span>
            <span><strong>Modulo de consulta:</strong> en actualizacion.</span>
          </li>
          <li class="status-item">
            <span class="check"></span>
            <span><strong>Sincronizacion:</strong> colas y procesos en validacion final.</span>
          </li>
          <li class="status-item">
            <span class="check"></span>
            <span><strong>Seguridad:</strong> controles activos y monitoreo continuo.</span>
          </li>
        </ul>
      </aside>
    </section>

    <div class="foot">
      Envios Zima | Pagina de mantenimiento
    </div>
  </main>

  <script>
    (function(){
      "use strict";
      var MAINTENANCE_HOURS = 4;
      var MAINTENANCE_KEY = "zima_maintenance_end_v1";
      var DURATION_MS = MAINTENANCE_HOURS * 60 * 60 * 1000;
      var maintenanceEnd = resolveMaintenanceEnd();

      function formatDateTime(date){
        return date.toLocaleString("es-CO", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
      }

      function pad2(n){
        return String(n).padStart(2, "0");
      }

      function formatCountdown(ms){
        var total = Math.max(0, Math.floor(ms / 1000));
        var hours = Math.floor(total / 3600);
        var minutes = Math.floor((total % 3600) / 60);
        var seconds = total % 60;
        return pad2(hours) + ":" + pad2(minutes) + ":" + pad2(seconds);
      }

      function resolveMaintenanceEnd(){
        try {
          var saved = Number(localStorage.getItem(MAINTENANCE_KEY));
          if (Number.isFinite(saved) && saved > 0) return saved;
        } catch (err) {}
        var created = Date.now() + DURATION_MS;
        try {
          localStorage.setItem(MAINTENANCE_KEY, String(created));
        } catch (err) {}
        return created;
      }

      function tick(){
        var now = new Date();
        var remaining = Math.max(0, maintenanceEnd - now.getTime());
        var eta = new Date(maintenanceEnd);
        var nowEl = document.getElementById("now-time");
        var etaEl = document.getElementById("eta-time");
        var cdEl = document.getElementById("countdown-time");
        var barEl = document.getElementById("countdown-progress");
        var noteEl = document.getElementById("countdown-note");
        if (nowEl) nowEl.textContent = "Hora local: " + formatDateTime(now);
        if (etaEl) etaEl.textContent = formatDateTime(eta);
        if (cdEl) cdEl.textContent = remaining > 0 ? formatCountdown(remaining) : "00:00:00";
        if (barEl) {
          var progress = ((DURATION_MS - remaining) / DURATION_MS) * 100;
          var safe = Math.min(100, Math.max(0, progress));
          barEl.style.width = safe.toFixed(2) + "%";
        }
        if (noteEl) {
          noteEl.textContent = remaining > 0
            ? "Mantenimiento en progreso."
            : "Tiempo estimado cumplido. Estamos finalizando despliegue.";
        }
      }

      tick();
      setInterval(tick, 1000);
    })();
  </script>
</body>
</html>
