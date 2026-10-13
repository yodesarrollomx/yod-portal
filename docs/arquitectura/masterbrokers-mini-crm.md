# Masterbrokers · Mini CRM

Una barra por expediente, varios abiertos para comparar. El detalle combina el PPP real en lectura y el historial con calendario. Reutiliza BROKERS_Actividades y el contrato brokers.v1, sin una segunda base.

```mermaid
flowchart TD
  P["PPP guardado"] --> V["Comparación en Masterbrokers"]
  S["CRM existente"] --> V
  V --> D["Detalle e historial"]
  D --> A["Avance o reunión"]
  A --> S
  S --> C["Calendario por fecha del hecho"]
  C --> D
```

La nota lleva un sobre versionado de metadatos. Se conservan los nueve campos nativos de actividades y todas las notas previas. La fecha del hecho es independiente de la captura del servidor. La programación sólo se cierra con un registro explícito y conserva el historial original.

El resumen del PPP muestra sus inputs/resultados guardados, versión y fecha. Las otras versiones se nombran; no se calcula un rendimiento fuera del PPP. Propietario y participantes requieren evidencia explícita.

Documentos aportados pueden alimentar el historial con clave estable y origen verificable. Una lectura o clic no representa avance comercial; no se presume escucha en WhatsApp, transcripción de nuevas grabaciones ni invitación en Google Calendar.

Verificaciones previstas: codec/legado, días en Hermosillo, duplicados y reemplazos, permiso/sesión, PPP sin motor, varios desplegables y navegador320/390/1440. Revertir sólo frontend; preservar registros operativos.
