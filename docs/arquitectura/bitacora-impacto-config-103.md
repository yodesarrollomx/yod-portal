# Paso 1 · Control de impacto de configuración

## 2026-10-07T05:46:11Z · Hallazgo e intención, antes del cambio

La revisión de PR115 confirmó que `render.yaml` y `cloud/render.yaml` tienen responsables de arquitectura, pero `scripts/verificar-impacto.cjs` sólo reconoce código, JSON y workflows como cambios de comportamiento. Un YAML de despliegue fuera de `.github/workflows/` puede pasar sin actualizar `architecture-impact.json`.

Se propone incluir `.yaml` y `.yml` en el mismo filtro existente, manteniendo las exclusiones de documentos de arquitectura. Cada cambio de configuración debe declarar los componentes responsables ya registrados; no se instalan servicios ni se alteran permisos.

La propuesta se registra en `CHG-DESPACHO-COBERTURA-103`, revisión `2026-10-07.103.1-impacto-config`, y se añade propiedad explícita del verificador a `SYS-YOD-OS`. Esto completa el control documental del paso 1, sin comenzar los pasos 2 ni 3.

### Comportamiento previo

```js
/\.(?:[cm]?[jt]sx?|gs|py|html|css|sql|sh|json)$/i
```

### Resultado esperado

- Un cambio de YAML/YML exige actualizar el manifiesto de impacto.
- `render.yaml` y `cloud/render.yaml` requieren `SVC-AUTON-CLOUD` y `EXT-RENDER`.
- El manifiesto correcto permite continuar; uno incompleto se rechaza.
- La documentación y los nombres que no terminan en esas extensiones conservan su clasificación.

### Alcance de comprobación

Pruebas sintéticas del verificador, regeneración exacta del atlas y verificadores requeridos del portal en CI. No se realizan llamadas de negocio ni modificaciones de infraestructura.

## 2026-10-07T05:48:29Z · Ejecución y resultados técnicos

La propuesta quedó registrada antes del código en commit `22f939010d40672862d9276048e7492358c0b398`. Se amplió únicamente el filtro de extensiones a `json|ya?ml`, utilizando las reglas de propiedad ya registradas.

Las regresiones comprueban las dos rutas Render, YAML/YML fuera de workflows, manifiesto ausente, alojamiento omitido y configuración correctamente declarada. Se conservan fuera del filtro los documentos de arquitectura y archivos sin extensión de comportamiento.

La ejecución de las funciones puras exactas en un entorno aislado confirmó los casos positivos y negativos. Las pruebas Node y los verificadores completos quedan a cargo del CI del PR; este resultado aislado no los sustituye. No hubo llamadas de negocio ni cambios de infraestructura.
