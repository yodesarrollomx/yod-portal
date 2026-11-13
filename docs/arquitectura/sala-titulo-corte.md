# Título íntegro del corte

Propuesta CHG-SALA-TITULO-CORTE-20261018, previa a implementación.

La fuente es el nombre de pieza resuelto por la tira vigente; PROPUESTAS conserva la entrega. El productor truncaba al primer separador ` · `: un prefijo de formato sustituía al nombre completo. Conservar el texto completo y agregar el sufijo de revisión. IDs, origen, medios y decisiones permanecen idénticos.

```mermaid
flowchart LR
  T["Nombre íntegro de tira"] --> P["Título del corte"]
  P --> S["PROPUESTAS"]
  S --> U["Mesa de revisión"]
```

La flecha describe el flujo existente; no añade transporte ni contratos. Para un corte ya montado: leer fila por ID único, cotejar origen y video, guardar respaldo privado, reemplazar sólo celda título con coincidencia exacta del valor anterior, releer. Si ya coincide, no escribir; si difiere o hay duplicados, detener. No modificar COLA, DECISIONES o backend, no producir ni volver a proponer. Después refrescar snapshot existente y comprobar UI; editar celda no acredita por sí solo publicación.

Regresión sintética: título con prefijo y separadores internos, título simple, ID/origen/video/opciones idénticos y entradas inmutables. Revertir sólo código; conservar medios e historia.

El lector actual también divide el título. Para cortes, vincular por `corte-de <pid>` al grupo vigente exacto; fuente ausente/ambigua conserva grupo independiente identificado por ID. No arrastrar votos ni alterar tarjetas de fuentes obsoletas.
