# YOD OS · Portal y mapa del negocio

YOD OS reúne los tableros de YoDesarrollo/Aurum, sus accesos y resúmenes de operación. La cabina vive en `os/`; el tablero cenital, avances de obra y tracks se integran desde este repositorio.

- [Abrir YOD OS](https://yodesarrollomx.github.io/yod-portal/).
- [Entender la arquitectura antes de cambiar código](docs/arquitectura/README.md).
- [Atlas visual de procesos y conexiones](docs/arquitectura/index.html).
- [Propuestas de mejora por letras](docs/arquitectura/propuestas.md).

## Fuentes y límites

El catálogo técnico se mantiene en `os/catalogo.js`; sus copias se generan con `node scripts/catalogo.cjs`. El Control Maestro aporta la proyección del menú. Portero resuelve la sesión y los códigos de acceso; cada backend debe autorizar sus operaciones. Un enlace oculto en el menú no protege un recurso.

GitHub contiene los frontends y algunas fuentes/fragmentos de Apps Script. El código publicado en un repositorio no demuestra qué versión ejecuta un deployment. El atlas distingue código, documentación, lectura de datos y ejecución comprobada.

`board-aurum` es operación/MOAC y `aurum-board` es marketing. Despacho comparte el motor de tareas; Obra Cliente tiene motor propio. Consultar las fichas y conexiones para el resto del ecosistema.

## Verificar un cambio

Leer `AGENTS.md` y registrar primero la propuesta/impacto. Después ejecutar:

```sh
node scripts/arquitectura.cjs --check
node --test tests/*.cjs
node verify-os.cjs
node verify-portal.cjs
node verify-accesos.cjs
node verify-obra-app.cjs
```

`verify-accesos.cjs` compara con la matriz del repositorio Potenciales; admite `ACCESOS_REF` para fijar el commit. Las pruebas de datos usan ejemplos sintéticos. No probar escrituras financieras en producción.

## Evolución

Las correcciones, propuestas, límites y resultados viven en `docs/arquitectura/`. El expediente anterior se conserva en [EXPEDIENTE.md](docs/EXPEDIENTE.md) como evidencia histórica fechada; no asumir vigentes sus afirmaciones de «hoy funciona».

Este repositorio es público: no contiene exportaciones privadas, credenciales ni registros reales del negocio en la documentación nueva.
