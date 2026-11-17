# Jarvis: grafo del código instalado

Solicitud de Dirección, 16-nov-2026: publicar el grafo actual en el portal de Accesos, conservar anclas a los HTML originales y señalar cambios posteriores. Retirar PPP2 y Mercado Hermosillo como entradas independientes, conservando PPP vigente, sus libros y Mercado en Masterbrokers.

`jarvis/` publica ocho grafos generados con las APIs nativas de Graphify 0.9.99. Los 233 archivos del paquete instalado coinciden byte por byte con el wheel oficial de PyPI, cuya huella aparece en `provenance.json`. La proyección pública conserva IDs, relaciones, fuentes y líneas; excluye comentarios y datos privados. Cada descarga JSON comprimida contiene el grafo íntegro del área; el visor nativo agrupa comunidades. El mapa de archivos deriva sus flechas de esos mismos nodos y aristas.

El corte inventaría 3440 archivos de código en las ocho áreas declaradas. Añade siete archivos virtuales de JavaScript extraído de HTML, con archivo original, línea y SHA256. Hay 101091 nodos y 223859 aristas. De 76 lotes, 73 se reutilizaron tras comprobar que todos sus archivos conservaban exactamente la huella; tres se extrajeron de nuevo sin red. No se publican datos, secretos, sesiones o fuentes de clientes. CSS se inventaría sin atribuirle extracción de símbolos. La resolución entre lotes sigue siendo parcial; no es un trazado exhaustivo de todas las llamadas dinámicas ni una prueba de salud.

`jarvis-status.py` compara las fuentes contra el manifiesto local privado y descubre archivos añadidos en las mismas carpetas de código. Publica únicamente nombres relativos, estados y huellas en `potenciales-yod/grafo-datos/jarvis-estado.json`. El verificador local se ejecuta cada cinco minutos con prioridad baja, sin reiniciar Jarvis. Fuera de esas carpetas, un nuevo subsistema requiere ampliar el inventario. El visor consulta el recibo cada minuto; un recibo ausente, de otro corte o mayor a 15 minutos muestra desconocido. No reconstruye ni aprueba automáticamente un grafo nuevo.

El catálogo conserva IDs, destinos y códigos. `oculto` sólo los retira de la navegación generada para cabina y marco, incluso si llegan de Control Maestro o de una caché. La entrada PPP principal y el destino de la ficha con libro siguen vigentes. No se modificaron fórmulas, permisos ni backends.

Accesos añade una lámina Jarvis desde su generador `grafo-motor/laminas.py`, apuntando al mismo HTML publicado: ambos leen el mismo estado. Las demás láminas conservan su publicación anterior.

Validación: pruebas de navegación y conservación de permisos; hashes de las ocho descargas; modificación/borrado y latidos inválidos; comprobaciones del portal; navegador con datos sintéticos a 1280 y 390 píxeles. Los recibos finales de CI y publicación se registran en el PR. Reversión: revertir los dos PR y desactivar exclusivamente el temporizador de huellas; conservar los datos de negocio.
