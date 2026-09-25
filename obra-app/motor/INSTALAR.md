# YOD Obra · instalar el módulo cliente

La app (`obra-app/`) ya funciona para el equipo sin este módulo: portafolio, obra, unidades,
bandeja, alta de obra y vista previa del cliente leen el motor de obra actual.
Este módulo enciende **pagos, documentos, dudas, fotos, gastos y el acceso de clientes**.
Es un Apps Script APARTE: no toca el motor de obra.

1. Crea un Google Sheet nuevo: **«YOD Obra · Cliente»** (en la cuenta de Dirección).
2. Extensiones → Apps Script. Borra lo que trae y pega `ObraCliente.gs` completo. Guarda.
3. Crea una carpeta de Drive **«YOD Obra · Fotos»** y copia su id (lo que va después de `/folders/`).
4. Configuración del proyecto (⚙) → Propiedades del script → agrega:
   - `PORTERO_EXEC` = el valor `original` de `os/yod-acceso.js`
   - `SERVICIO_K` = una credencial del Portero con código **OB** (dala de alta en Accesos como «servicio obra cliente»)
   - `MOTORES` = `{"PRJ-ALYSA":"<el /exec de obra.html>"}` (una entrada por obra de `obras.js`)
   - `FOTOS_CARPETA` = el id del paso 3
5. En el editor, elige la función `prepararHojas` → Ejecutar (autoriza los permisos). Aparecen las pestañas.
6. En la pestaña CONFIG agrega los renglones que apliquen:
   - `AUTORIZA_CORREOS` → correos que confirman pagos y autorizan gastos, fotos y documentos
   - `SPEI_CLABE`, `SPEI_BENEFICIARIO`
   - `modalidad:PRJ-ALYSA` → `administracion` (el cliente ve gastos) o `precio_alzado`
   - `presupuesto:PRJ-ALYSA`, `entrega:PRJ-ALYSA` (fecha), `camara:PRJ-ALYSA` (liga de la cámara, opcional)
7. Implementar → **Nueva implementación** (solo esta primera vez; es un script nuevo) → Aplicación web →
   Ejecutar como: yo · Acceso: cualquier persona. Copia el `/exec`.
8. Pega ese `/exec` en `obra-app/obras.js`, en `var CLIENTE=''`, y publica.
   Cambios futuros al script: siempre **Nueva versión** en la misma implementación.

Para dar acceso a un cliente: su correo va en Accesos del Portero (para que entre con Google)
y en «Clientes con acceso» del módulo cliente (amarrado a su unidad). Sin ambos, no ve nada.
