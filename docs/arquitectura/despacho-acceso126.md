# Despacho126 · Continuidad de acceso

Estado: propuesto. 8-oct-2026, Hermosillo (UTC−07).

La lista de residentes y el proyecto seleccionado deben compartir una política explícita de vigencia en memoria. La consulta fallida transitoria no equivale a revocación; durante recuperación no se permiten nuevas operaciones. Una respuesta que niega acceso o una lista vigente que omite el caso retira su autoridad inmediatamente. La expiración se comprueba con reloj y temporizador, sin almacenamiento local ni extensión de permisos por fallos.

Componentes: SYS-YOD-OS, SYS-DESPACHO-3D, GAS-PORTERO. Contratos: listAuthorized y resolveCurrent conservan forma e identificadores. Alcance: cliente, sin alterar permisos del servidor ni configuración OAuth.

Plan: política compartida; catálogo con estado y single-flight, expiración real y respuestas obsoletas rechazadas; residente alineado; conciliación del catálogo y residente; refresco online/visible. Pruebas con reloj sintético, expiración pendiente de red, revocación, cambio de selección y recuperación. Sin endpoints de negocio.

La configuración de orígenes del cliente OAuth Web sólo se cambia en la cuenta administradora de Google Cloud. La disponibilidad de código público no acredita configuración ni acceso a esa consola. Nunca sustituirlo por un cliente de escritorio ni omitir validación.

Reversión: revertir este cambio de cliente. No modifica archivos de negocio, credenciales, trabajos ni permisos en servidor.
