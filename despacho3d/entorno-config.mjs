// Interruptor del entorno del agente (espacios, permisos y registro de visitas). ENCENDIDO por indicación de Dirección (2026-10-04).
// Encenderlo es un cambio de código que aprueba Dirección. Para verlo antes, con un perfil
// autorizado por el servidor, abrir el Despacho con ?entorno=1.
export const ENTORNO_ACTIVO=true;
// El agente camina entre los espacios (solo movimiento visual de su figura). ENCENDIDO por indicación de Dirección (2026-10-04).
// Para verlo antes: ?entorno=1&camina=1
export const ENTORNO_AGENTE_CAMINA=true;
// Sala de juntas: «Ver entregas por aprobar» lee del OS lo que espera a Dirección (solo lectura, no aprueba nada
// y no avisa a nadie). Apagado por defecto. Para verlo antes: ?entorno=1&juntas=1
export const ENTORNO_JUNTAS=false;
