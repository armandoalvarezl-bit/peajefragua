# Activar Fragua en línea

La aplicación consulta y guarda las guías y los pedidos directamente en Apps Script. No utiliza IndexedDB, almacenamiento local de guías ni una cola para trabajar sin conexión. El navegador conserva únicamente un token temporal de acceso en la pestaña; el servidor valida esa sesión.

## 1. Actualizar Apps Script

1. Abre el proyecto de Apps Script asociado al enlace que utiliza la aplicación, vinculado a tu hoja de cálculo.
2. Reemplaza el código por el contenido completo de `apps_script_envios.gs` y guarda.
3. Si todavía no está creada la cuenta inicial, ejecuta `cambiarAdministradorFragua` desde el editor. Crea la pestaña `Usuarios` y configura `Fragua / 2107` con contraseña almacenada como hash. Para agregar personas, crea una fila por cuenta en `Usuarios` con columnas `ID`, `Nombre`, `Usuario`, `Password`, `Rol` y `Estado`; usa `Activo` y asigna el rol correspondiente. La hoja vinculada no está disponible desde los archivos del sitio, así que esas filas se crean en Google Sheets. Ejecuta `configurarUsuariosFragua` desde el editor para crear o actualizar los accesos `AdminGeneral` y `Zaragoza`; conserva los datos de otras cuentas.
4. Con la cuenta de Google que ejecutará el script, ejecuta `autorizarNotificacionesFragua` y concede el permiso de envío de correo. Esta función muestra el remitente real y verifica la cuota disponible, sin enviar correos. No requiere configurar alias.
5. En **Implementar → Gestionar implementaciones**, edita la implementación existente, selecciona una nueva versión y consérvala ejecutándose como la cuenta que acabas de autorizar. Mantén la URL actual. El acceso de la implementación debe permitir las solicitudes del sitio; la aplicación valida sus propias sesiones.
6. Publica juntos los archivos actualizados del sitio, incluidos `apps-script-client.js`, `panel.js`, `login.js`, `fragua-logo.svg`, `OIP.jpeg` y `guia-impresion.js`.
7. Publica la nueva versión de Apps Script para que apliquen el filtro por usuario y la columna UsuarioCreador. AdminGeneral ve todas las guías; cada operador ve y modifica solo las que registró. Las guías antiguas sin usuario asignado quedan visibles para el administrador general.

Si creas otra implementación con una URL distinta, actualiza `apps-script-client.js`, `consulta.html` y `consulta_externa.html`.

## 2. Notificaciones

- Remitente: la cuenta autorizada que ejecuta Apps Script, con el nombre visible **Envíos Fragua**.
- El destinatario se escribe en el formulario de cada guía; no hay un correo de destino predeterminado. Se aceptan hasta cinco direcciones separadas por coma.

- El correo se envía al crear la guía y en cada actualización guardada, incluidos cambios de estado y del detalle de pedidos. El panel emite un sonido breve y un aviso cuando detecta guías nuevas o actualizadas. El navegador requiere una primera interacción para permitir el sonido.
- En la ficha, **Reenviar notificación** envía de nuevo el mensaje con el detalle actual, por ejemplo después de agregar pedidos.
- Si Gmail falla, la guía queda guardada en línea y las columnas `Notificacion` y `NotificacionError` registran el pendiente. El panel muestra el resultado real.
- El envío usa `MailApp` sin establecer un remitente alternativo, así que no depende de alias de Gmail. La dirección de origen será la cuenta de Google que ejecuta Apps Script; las respuestas se dirigen a `peajefragua@zimaseguridad.com.co`. [Referencia oficial de MailApp](https://developers.google.com/apps-script/reference/mail/mail-app).

Abre `vista-previa-notificacion.html` para revisar el diseño con datos de ejemplo. También puedes ejecutar `vistaPreviaCorreoFragua` desde el editor de Apps Script. Ninguna de esas vistas previas envía correo.

## 3. Verificación

Si la vista previa muestra `SpreadsheetApp.dogetUi is not a function`, reemplaza esa llamada por `SpreadsheetApp.getUi()`. La vista previa debe ejecutarse desde el editor vinculado a la hoja abierta. [Referencia oficial de los diálogos](https://developers.google.com/apps-script/reference/base/ui).

El script guarda valores sin cambiar el formato de toda la fila, para admitir tablas con columnas tipadas. Si un correo no sale, el panel mantiene visible el motivo; también queda en `NotificacionError` y en el registro de ejecución, bajo `notificacion_envio`. Después de cambiar el código, publica una nueva versión de la implementación existente y actualiza los archivos del sitio.

Si aparece `Required permissions: https://www.googleapis.com/auth/script.send_mail`, ejecuta `autorizarNotificacionesFragua` desde el editor, usando la cuenta que figura en **Ejecutar como** en la implementación. La función solicita expresamente el consentimiento de envío: en **Revisar permisos**, permite enviar correo. Si Google detiene la ejecución para mostrar la autorización, vuelve a ejecutar la función después de aceptarla. Si el manifiesto `appsscript.json` ya declara una lista `oauthScopes`, añade `https://www.googleapis.com/auth/script.send_mail` a esa lista, conservando los demás permisos. No es necesario crear una nueva URL: actualiza la versión de la implementación existente y usa **Reenviar notificación** en la guía afectada. [Autorización de Apps Script](https://developers.google.com/apps-script/guides/support/troubleshooting#authorization-is).

```powershell
node --test peajefragua-main/tests/online.test.cjs peajefragua-main/tests/journey.test.cjs
```

Las pruebas usan una hoja, sesiones y Gmail simulados; no envían mensajes reales. La autorización de Gmail y la publicación de la nueva versión deben hacerse en Google. Después, ingresa al sitio y registra una guía real para comprobar el flujo completo.

## Seguimiento con carrito

### QR en guías anteriores y nuevas

Publica `home.html`, `consulta.html`, `panel.js`, `guia-impresion.js` y la carpeta `vendor` junto al sitio. El QR se genera al abrir la ficha y al imprimir, también en las guías anteriores, sin modificar la hoja ni enviar correos. Cada copia impresa incluye el QR. Desde el sitio publicado por HTTPS abre `consulta_externa.html?numero=...` con el número de la guía; permite consultar el registro y su estado, sin confirmar automáticamente una entrega. Al trabajar desde archivos locales, el QR identifica el número de guía porque todavía no hay una dirección web pública para consultar.

Publica también `home.html`, `panel.js`, `seguimiento-recorrido.js` y `seguimiento-recorrido.css`. El recorrido estima 45 minutos a partir de `SalidaEn`, una columna que el servidor incorpora a la hoja. Al cambiar una guía a **En tránsito**, registra la salida; editarla mientras conserva ese estado no reinicia el reloj. Las guías anteriores sin esa hora muestran que falta confirmar la salida.

Para **OPER-55511**, copia el script actualizado a Apps Script y ejecuta `registrarSalidaOper55511` desde el editor. Registra la salida aproximada informada: **30/10/2026 a las 13:26:25 de Colombia**, equivalente a 44 minutos antes de la referencia recibida a las 14:10:25. Usa una hora fija para que ejecutar la función más tarde no reinicie el recorrido. Solo ajusta esa guía si está en tránsito; no envía correo ni cambia su estado. Este ajuste está preparado en el código y todavía debe ejecutarse en la hoja real.

Actualiza la versión de la implementación existente para registrar las salidas futuras automáticamente. El contador se actualiza cada segundo, conserva su avance al recargar y, al cumplir los 45 minutos, muestra **Entrega por confirmar**. Solo el estado **Entregado** confirma la entrega. La posición es una estimación por tiempo, sin ubicación GPS.
