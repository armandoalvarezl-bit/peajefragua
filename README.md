
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login Sistema POS</title>

<!-- Google Fonts & Boxicons -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">

<style>
  * {margin:0; padding:0; box-sizing:border-box; font-family: 'Poppins', sans-serif;}

  body, html {height: 100%;}

  body {
    background: url('IMG/Diseño\ sin\ título\ \(4\).png') no-repeat center center fixed;
    background-size: cover;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .login-box {
    background-color: rgba(255, 255, 255, 0.95);
    padding: 40px 35px;
    border-radius: 16px;
    width: 360px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.25);
    text-align: center;
    animation: fadeIn 0.8s ease;
  }

  @keyframes fadeIn {
    from {opacity: 0; transform: translateY(-10px);}
    to {opacity: 1; transform: translateY(0);}
  }

  /* Foto tipo perfil */
  .login-box img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #4cafac;
    margin-bottom: 15px;
    box-shadow: 0 0 8px rgba(0,0,0,0.2);
  }

  .login-box h2 {
    margin-bottom: 25px;
    font-size: 21px;
    color: #333;
    font-weight: 600;
  }

  .input-box {
    position: relative;
    margin-bottom: 18px;
  }

  .input-box input {
    width: 100%;
    padding: 12px 40px 12px 40px;
    border: 1px solid #ccc;
    border-radius: 10px;
    outline: none;
    font-size: 14px;
  }

  .input-box i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
    font-size: 20px;
  }

  .login-box input[type="checkbox"] {
    margin-right: 6px;
  }

  .login-box button {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #4cafac, #3a9b99);
    border: none;
    color: white;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .login-box button:hover {
    transform: scale(1.03);
    background: linear-gradient(135deg, #3a9b99, #4cafac);
  }

  .support {
    margin-top: 18px;
    font-size: 14px;
    color: #555;
  }

  .support span {
    color: #e67e22;
    font-weight: bold;
  }

  a {
    display: inline-block;
    margin-top: 8px;
    color: #4cafac;
    text-decoration: none;
    font-size: 14px;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
</head>
<body>

<div class="login-box">
  <!-- Foto tipo perfil -->
  <img src="IMG/OIP.jpeg" alt="Perfil Peaje Fragua">

  <h2>Bienvenido al Sistema de Facturación</h2>

  <form onsubmit="return validarLogin(event)">
    <div class="input-box">
      <i class='bx bxs-user'></i>
      <input type="text" id="usuario" placeholder="Usuario" required>
    </div>

    <div class="input-box">
      <i class='bx bxs-lock-alt'></i>
      <input type="password" id="password" placeholder="Contraseña" required>
    </div>

    <div style="text-align:left; margin-bottom:16px;">
      <input type="checkbox" id="show-pass" onclick="togglePassword()">
      <label for="show-pass">Mostrar Contraseña</label>
    </div>

    <button type="submit">Iniciar Sesión</button>
  </form>

  <div class="support">
    ¿Tienes problemas para ingresar? Contáctanos al <span>3145014258</span>
  </div>
  <a href="#">¿Has olvidado tu contraseña?</a>
</div>

<script>
function togglePassword() {
  const passField = document.getElementById('password');
  passField.type = passField.type === "password" ? "text" : "password";
}

function validarLogin(event) {
  event.preventDefault();
  const user = document.getElementById('usuario').value.trim();
  const pass = document.getElementById('password').value.trim();

  // Credenciales válidas
  const userValido = "Peaje Fragua";
  const passValido = "Administrador";

  if (user === userValido && pass === passValido) {
    window.location.href = "home.html";
  } else {
    alert("❌ Credenciales incorrectas. Intente de nuevo.");
  }
}
</script>

</body>
</html>
