<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Acceso | Empresa Zima Seguridad Ltda</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />

  <style>
    :root {
      --bg-1: #0b1f2d;
      --bg-2: #123a4a;
      --accent: #00a3a3;
      --accent-2: #0ec9bf;
      --text: #102230;
      --muted: #5c6f7c;
      --danger: #b42318;
      --card: rgba(255, 255, 255, 0.96);
      --ring: rgba(14, 201, 191, 0.35);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: "Sora", sans-serif;
    }

    html,
    body {
      min-height: 100%;
    }

    body {
      display: grid;
      place-items: center;
      padding: 0;
      color: var(--text);
      background:
        radial-gradient(circle at 20% 15%, rgba(14, 201, 191, 0.22), transparent 34%),
        radial-gradient(circle at 85% 90%, rgba(0, 163, 163, 0.25), transparent 35%),
        linear-gradient(145deg, var(--bg-1), var(--bg-2));
    }

    .login-shell {
      width: 100%;
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      border-radius: 0;
      overflow: hidden;
      box-shadow: none;
      background: var(--card);
    }

    .brand-panel {
      padding: 56px;
      background:
        linear-gradient(165deg, rgba(0, 163, 163, 0.18), rgba(18, 58, 74, 0.2)),
        url("img/Dise%C3%B1o%20sin%20t%C3%ADtulo%20(4).png") center/cover no-repeat;
      position: relative;
      isolation: isolate;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-panel::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      background: linear-gradient(150deg, rgba(10, 25, 36, 0.52), rgba(18, 58, 74, 0.62));
    }

    .brand-panel::before {
      content: "";
      position: absolute;
      inset: 24px;
      border-radius: 24px;
      border: 1px solid rgba(226, 251, 249, 0.2);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
      pointer-events: none;
    }

    .brand-copy {
      max-width: 420px;
      color: #f8fffe;
      text-align: center;
    }

    .brand-kicker {
      font-size: 0.9rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #c6f5f2;
      margin-bottom: 14px;
      font-weight: 600;
    }

    .brand-copy h1 {
      font-size: clamp(2rem, 3.2vw, 2.6rem);
      line-height: 1.25;
      margin-bottom: 16px;
      text-wrap: balance;
    }

    .brand-copy p {
      line-height: 1.6;
      color: #d7eeec;
      font-size: 1.05rem;
    }

    .form-panel {
      padding: 52px 46px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 640px;
      width: 100%;
      margin: 0 auto;
      background:
        radial-gradient(circle at 100% 0%, rgba(14, 201, 191, 0.12), transparent 45%),
        linear-gradient(180deg, #ffffff, #f8fcfd);
    }

    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 28px;
    }

    .logo-wrap img {
      width: 70px;
      height: 70px;
      border-radius: 16px;
      object-fit: cover;
      border: 2px solid rgba(0, 163, 163, 0.18);
    }

    .logo-wrap strong {
      display: block;
      font-size: 1.12rem;
      font-weight: 700;
    }

    .logo-wrap span {
      font-size: 0.95rem;
      color: var(--muted);
    }

    .heading {
      margin-bottom: 28px;
    }

    .heading h2 {
      font-size: 1.7rem;
      margin-bottom: 10px;
    }

    .heading p {
      color: var(--muted);
      font-size: 1.02rem;
      line-height: 1.5;
    }

    .field {
      margin-bottom: 18px;
    }

    .field label {
      display: block;
      font-size: 0.95rem;
      color: #203645;
      margin-bottom: 9px;
      font-weight: 600;
    }

    .input-wrap {
      position: relative;
    }

    .input-wrap i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64808f;
      font-size: 1.3rem;
      pointer-events: none;
    }

    .input-wrap input {
      width: 100%;
      border: 1.4px solid #d3e0e8;
      border-radius: 12px;
      outline: none;
      padding: 15px 46px;
      font-size: 1rem;
      transition: 0.2s border-color, 0.2s box-shadow;
      background: #fafdff;
    }

    .input-wrap input:focus {
      border-color: var(--accent-2);
      box-shadow: 0 0 0 4px var(--ring);
    }

    .toggle-pass {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      border: none;
      background: transparent;
      color: #446272;
      cursor: pointer;
      font-size: 1.3rem;
      line-height: 1;
    }

    .row-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin: 10px 0 18px;
      font-size: 0.93rem;
      color: #3e5865;
    }

    .row-actions label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }

    .row-actions a {
      color: #0b6e88;
      text-decoration: none;
      font-weight: 600;
    }

    .row-actions a:hover {
      text-decoration: underline;
    }

    .error-box {
      display: none;
      margin-bottom: 12px;
      font-size: 0.92rem;
      color: var(--danger);
      background: #fff3f2;
      border: 1px solid #f8ceca;
      border-radius: 9px;
      padding: 9px 11px;
    }

    .btn-login {
      width: 100%;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-weight: 700;
      font-size: 1.03rem;
      cursor: pointer;
      color: #ffffff;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      transition: 0.2s transform, 0.2s filter;
    }

    .btn-login:hover {
      transform: translateY(-1px);
      filter: brightness(1.02);
    }

    .btn-login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .support {
      margin-top: 20px;
      font-size: 0.92rem;
      color: var(--muted);
      text-align: center;
    }

    .support strong {
      color: #0a5d6f;
    }

    .loading-modal {
      display: none;
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 20% 20%, rgba(91, 231, 222, 0.16), transparent 36%),
        radial-gradient(circle at 80% 80%, rgba(14, 201, 191, 0.18), transparent 38%),
        rgba(6, 16, 24, 0.72);
      backdrop-filter: blur(9px);
      z-index: 1200;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .loading-card {
      width: min(420px, 100%);
      border-radius: 18px;
      padding: 24px 22px;
      text-align: center;
      color: #ecfeff;
      background: linear-gradient(180deg, rgba(10, 28, 38, 0.82), rgba(10, 28, 38, 0.68));
      border: 1px solid rgba(185, 241, 236, 0.28);
      box-shadow: 0 16px 38px rgba(0, 0, 0, 0.35);
    }

    .loading-modal img {
      width: 78px;
      height: 78px;
      object-fit: cover;
      border-radius: 18px;
      border: 2px solid rgba(236, 254, 255, 0.3);
      margin-bottom: 14px;
    }

    .loader {
      width: 56px;
      height: 56px;
      margin: 0 auto;
      border: 4px solid rgba(255, 255, 255, 0.18);
      border-top-color: #5be7de;
      border-radius: 50%;
      animation: spin 0.85s linear infinite;
    }

    .loading-title {
      margin-top: 14px;
      font-size: 1.06rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }

    .loading-subtitle {
      margin-top: 6px;
      color: #bfeeed;
      font-size: 0.9rem;
    }

    .loading-progress {
      margin-top: 14px;
      height: 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
      overflow: hidden;
    }

    .loading-progress span {
      display: block;
      height: 100%;
      width: 45%;
      background: linear-gradient(90deg, #0ec9bf, #5be7de);
      border-radius: 999px;
      animation: loadingBar 1.2s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes loadingBar {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(260%); }
    }

    @media (max-width: 1100px) {
      .brand-panel {
        padding: 42px;
      }

      .form-panel {
        padding: 40px 28px;
      }
    }

    @media (max-width: 900px) {
      .login-shell {
        grid-template-columns: 1fr;
        min-height: 100vh;
      }

      .brand-panel {
        min-height: 36vh;
        align-items: center;
      }

      .form-panel {
        max-width: 100%;
        padding: 34px 22px 42px;
      }
    }
  </style>
</head>
<body>
  <div class="loading-modal" id="loadingModal" aria-hidden="true">
    <div class="loading-card" role="status" aria-live="polite">
      <img src="img/OIP.jpeg" alt="Logo Envios Zima" />
      <div class="loader" aria-hidden="true"></div>
      <p class="loading-title">Validando acceso</p>
      <p class="loading-subtitle">Preparando el panel de Envios Zima...</p>
      <div class="loading-progress" aria-hidden="true"><span></span></div>
    </div>
  </div>

  <main class="login-shell" aria-label="Acceso al sistema">
    <section class="brand-panel" aria-hidden="true">
      <div class="brand-copy">
        <div class="brand-kicker">EMPRESA ZIMA SEGURIDAD LTDA</div>
        <h1>Area de envio de paquetes y control de guias.</h1>
        <p>
          Plataforma interna para registrar, organizar y dar seguimiento a cada envio
          del equipo de logistica.
        </p>
      </div>
    </section>

    <section class="form-panel">
      <div class="logo-wrap">
        <img src="img/OIP.jpeg" alt="Logo Envios Zima" />
        <div>
          <strong>Empresa Zima Seguridad Ltda</strong>
          <span>Area de Envio de Paquetes</span>
        </div>
      </div>

      <div class="heading">
        <h2>Iniciar sesion</h2>
        <p>Ingresa tus credenciales para continuar.</p>
      </div>

      <form id="loginForm" novalidate>
        <div class="error-box" id="errorBox" role="alert"></div>

        <div class="field">
          <label for="usuario">Usuario</label>
          <div class="input-wrap">
            <i class="bx bxs-user"></i>
            <input id="usuario" name="usuario" type="text" autocomplete="username" placeholder="Tu usuario" required />
          </div>
        </div>

        <div class="field">
          <label for="password">Contrasena</label>
          <div class="input-wrap">
            <i class="bx bxs-lock-alt"></i>
            <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Tu contrasena" required />
            <button type="button" class="toggle-pass" id="togglePass" aria-label="Mostrar u ocultar contrasena">
              <i class="bx bx-show"></i>
            </button>
          </div>
        </div>

        <div class="row-actions">
          <label for="rememberSession">
            <input id="rememberSession" type="checkbox" checked />
            Mantener sesion activa
          </label>
          <a href="#" aria-disabled="true">Recuperar acceso</a>
        </div>

        <button class="btn-login" id="btnLogin" type="submit">Entrar</button>
      </form>

      <p class="support">Soporte: <strong>3145014258</strong></p>
    </section>
  </main>

  <script>
    (function () {
      const USERS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzh1K6G6tpOD6Ofng3cz7g8GxlT09U6rJkHwiRRkr9bvwsA5XvTwbgLMPi1ycrIBX74/exec";

      const form = document.getElementById("loginForm");
      const inputUser = document.getElementById("usuario");
      const inputPass = document.getElementById("password");
      const errorBox = document.getElementById("errorBox");
      const btnLogin = document.getElementById("btnLogin");
      const rememberSession = document.getElementById("rememberSession");
      const loadingModal = document.getElementById("loadingModal");
      const togglePass = document.getElementById("togglePass");

      if (localStorage.getItem("sessionActive") === "1") {
        window.location.replace("home.html");
      }

      togglePass.addEventListener("click", function () {
        const show = inputPass.type === "password";
        inputPass.type = show ? "text" : "password";
        togglePass.innerHTML = show ? '<i class="bx bx-hide"></i>' : '<i class="bx bx-show"></i>';
      });

      form.addEventListener("submit", async function (event) {
        event.preventDefault();

        hideError();
        const user = inputUser.value.trim();
        const pass = inputPass.value.trim();

        if (!user || !pass) {
          showError("Debes completar usuario y contrasena.");
          return;
        }

        btnLogin.disabled = true;

        let authResult;
        try {
          authResult = await authenticateFromSheet(user, pass);
        } catch (err) {
          showError("No se pudo validar el acceso. Revisa internet e intenta de nuevo.");
          btnLogin.disabled = false;
          return;
        }

        if (!authResult.ok) {
          showError(authResult.message || "Credenciales incorrectas. Verifica e intenta de nuevo.");
          inputPass.value = "";
          inputPass.focus();
          btnLogin.disabled = false;
          return;
        }

        loadingModal.style.display = "flex";

        if (rememberSession.checked) {
          localStorage.setItem("sessionActive", "1");
          localStorage.setItem("sessionUser", JSON.stringify(authResult.user));
        } else {
          localStorage.removeItem("sessionActive");
          localStorage.removeItem("sessionUser");
        }

        setTimeout(function () {
          window.location.href = "home.html";
        }, 1400);
      });

      function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = "block";
      }

      function hideError() {
        errorBox.style.display = "none";
        errorBox.textContent = "";
      }

      async function authenticateFromSheet(username, password) {
        const response = await fetch(USERS_ENDPOINT, { method: "GET", cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);

        const raw = await response.json();
        if (!Array.isArray(raw) || raw.length < 2) throw new Error("Formato invalido");

        const rows = raw.slice(1);
        const users = rows
          .filter((row) => Array.isArray(row) && row.length >= 6)
          .map((row) => ({
            nombre: String(row[1] || "").trim(),
            usuario: String(row[2] || "").trim(),
            password: String(row[3] || "").trim(),
            rol: String(row[4] || "").trim(),
            estado: String(row[5] || "").trim()
          }));

        const found = users.find((u) => u.usuario.toLowerCase() === username.toLowerCase());
        if (!found) return { ok: false, message: "Usuario no encontrado." };

        if (found.estado.toLowerCase() !== "activo") {
          return { ok: false, message: "Tu usuario esta inactivo. Contacta al administrador." };
        }

        if (found.password !== password) {
          return { ok: false, message: "Contrasena incorrecta." };
        }

        return {
          ok: true,
          user: {
            nombre: found.nombre,
            usuario: found.usuario,
            rol: found.rol,
            estado: found.estado
          }
        };
      }
    })();
  </script>
</body>
</html>
