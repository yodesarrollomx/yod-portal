# Conexiones de YOD OS

> Generado desde modelo.json. No editar a mano. Revisión 2026-10-04.56-despacho-circulo · 2026-10-04.

Línea continua: conexión observada en código o ejecución. Discontinua: manual, declarada, propuesta o pendiente. Una conexión observada en código no acredita el despliegue.

## Operación

```mermaid
flowchart LR
  n_SYS_DESPACHO["El Despacho"]
  n_SYS_TAREAS["MOAC"]
  n_SYS_YOD_OS["YOD OS"]
  n_GAS_PORTERO["Portero y Potenciales"]
  n_GAS_OPERACION["Operación y tareas"]
  n_SHEET_OPERACION["Datos de Operación y tareas"]
  n_EXT_GMAIL["Gmail"]
  n_GAS_MOAC_METAS["Metas y objetivos de MOAC"]
  n_SHEET_MOAC_METAS["Metas, objetivos y acciones"]
  n_STORE_DESPACHO_CORCHO["Mi Corcho · almacén privado de Dirección"]
  n_GAS_OPERACION -->|Lee/escribe registros del dominio| n_SHEET_OPERACION
  n_SYS_DESPACHO -.->|Tareas ordinarias getAll/update en Operación| n_GAS_OPERACION
  n_SYS_TAREAS -.->|Consume contrato del backend| n_GAS_OPERACION
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_DESPACHO
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_TAREAS
  n_SYS_TAREAS -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_DESPACHO -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_GAS_OPERACION -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_SYS_DESPACHO -.->|Aprobación de borradores por protocolo BANDEJA| n_EXT_GMAIL
  n_SYS_TAREAS -->|Enruta moac/moacSet/moacObjetivo a motor separado| n_GAS_MOAC_METAS
  n_GAS_MOAC_METAS -->|Lee y vincula estrategia| n_SHEET_MOAC_METAS
  n_GAS_OPERACION -.->|Futuro Ops: mismo almacén Corcho tras identificar proyecto| n_STORE_DESPACHO_CORCHO
  n_SYS_DESPACHO -.->|Provisional: sólo corchoGet/corchoSave| n_GAS_PORTERO
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_YOD_OS pendiente;
  class n_SHEET_OPERACION pendiente;
  class n_EXT_GMAIL pendiente;
  class n_SHEET_MOAC_METAS pendiente;
  class n_STORE_DESPACHO_CORCHO pendiente;
```

## Ventas

```mermaid
flowchart LR
  n_SYS_POTENCIALES["PPP · Potenciales"]
  n_SYS_INVERSION["Presentación a inversionistas"]
  n_SYS_MARKETING["Embudo comercial"]
  n_SYS_YOD_OS["YOD OS"]
  n_SYS_PLAN_POTENCIAL["Plan de Potencial"]
  n_SYS_CROKISS["CroKiss"]
  n_SYS_CODES_PORTAL["Portal de codesarrolladores"]
  n_SYS_SALA["Sala de Edición"]
  n_SYS_SALA_OPERACION["Herramientas de producción"]
  n_SYS_AURUM_EXPERIENCIA["Experiencia Aurum"]
  n_GAS_PORTERO["Portero y Potenciales"]
  n_SHEET_PORTERO["Datos de Portero y Potenciales"]
  n_GAS_MARKETING["Métricas y CRM de captación"]
  n_SHEET_MARKETING["Datos de Métricas y CRM de captación"]
  n_GAS_PLAN_POTENCIAL["Captación de Plan Potencial"]
  n_SHEET_PLAN_POTENCIAL["Datos de Captación de Plan Potencial"]
  n_GAS_CROKISS["Guardado de planos"]
  n_SHEET_CROKISS["Datos de Guardado de planos"]
  n_GAS_CODES["Portal de codesarrolladores"]
  n_SHEET_CODES["Datos de Portal de codesarrolladores"]
  n_GAS_SALA["Sala de Edición"]
  n_SHEET_SALA["Datos de Sala de Edición"]
  n_EXT_DRIVE["Google Drive"]
  n_EXT_CALENDAR["Google Calendar"]
  n_EXT_META["Meta"]
  n_EXT_ACTIONS["GitHub Actions"]
  n_GAS_CRM["CRM comercial"]
  n_SHEET_CRM["Datos de CRM comercial"]
  n_GAS_INVERSION["Carpeta de inversión"]
  n_SHEET_INVERSION["Contenido de carpeta comercial"]
  n_GAS_PORTERO_RESPALDO["Portero de respaldo"]
  n_EXT_AURUM_WEB["Sitio de Arquitectura de Autor"]
  n_GAS_AUX_METRICAS["Fuente de métricas en utilidades auxiliares"]
  n_SVC_SALA_PRODUCTOR["Productor de Sala"]
  n_SVC_SALA_EJECUTOR["Ejecutor de Sala"]
  n_EXT_MOTORES_MEDIA["Motores de generación de contenido"]
  n_SHEET_PPP_MODELOS["PPP · Libros de cálculo por caso"]
  n_EXT_GITHUB_PUBLISHER_APP["Identidad de publicación GitHub"]
  n_GAS_MARKETING -->|Lee/escribe registros del dominio| n_SHEET_MARKETING
  n_GAS_PLAN_POTENCIAL -.->|Lee/escribe registros del dominio| n_SHEET_PLAN_POTENCIAL
  n_GAS_CROKISS -->|Lee/escribe registros del dominio| n_SHEET_CROKISS
  n_GAS_CODES -->|Lee/escribe registros del dominio| n_SHEET_CODES
  n_GAS_SALA -->|Lee/escribe registros del dominio| n_SHEET_SALA
  n_SYS_POTENCIALES -.->|Consume contrato del backend| n_GAS_PORTERO
  n_SYS_MARKETING -.->|Consume contrato del backend| n_GAS_MARKETING
  n_SYS_MARKETING -.->|Consume contrato del backend| n_GAS_PLAN_POTENCIAL
  n_SYS_PLAN_POTENCIAL -.->|Consume contrato del backend| n_GAS_PLAN_POTENCIAL
  n_SYS_CROKISS -->|Consume contrato del backend| n_GAS_CROKISS
  n_SYS_CODES_PORTAL -->|Consume contrato del backend| n_GAS_CODES
  n_SYS_SALA -.->|Consume contrato del backend| n_GAS_SALA
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_POTENCIALES
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_INVERSION
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_MARKETING
  n_SYS_MARKETING -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_GAS_PLAN_POTENCIAL -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_GAS_CODES -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_GAS_PLAN_POTENCIAL -.->|Confirma cita agendada| n_EXT_CALENDAR
  n_EXT_META -.->|Obtiene métricas mediante Actions| n_SYS_MARKETING
  n_GAS_CODES -->|Almacena archivos y comprobantes| n_EXT_DRIVE
  n_SYS_SALA -.->|Orquesta producción en la nube| n_EXT_ACTIONS
  n_SYS_SALA_OPERACION -.->|Herramientas históricas de producción| n_SYS_SALA
  n_SYS_YOD_OS -->|Consulta leads del CRM| n_GAS_CRM
  n_GAS_CRM -.->|Persistencia comercial lógica| n_SHEET_CRM
  n_SYS_INVERSION -->|Lee presentación y guarda diagnóstico| n_GAS_INVERSION
  n_GAS_INVERSION -.->|Contenido y diagnósticos comerciales| n_SHEET_INVERSION
  n_SYS_INVERSION -->|Acceso compartido del equipo| n_GAS_PORTERO
  n_SYS_AURUM_EXPERIENCIA -->|Redirige conservando atribución y fragmento| n_EXT_AURUM_WEB
  n_SYS_INVERSION -.->|CTA con atribución de presentación| n_SYS_PLAN_POTENCIAL
  n_GAS_PLAN_POTENCIAL -->|Cruza campañas/piezas con leads y citas| n_SYS_MARKETING
  n_SYS_SALA_OPERACION -.->|Genera métricas de campañas en utilidades históricas| n_SYS_MARKETING
  n_SYS_SALA_OPERACION -.->|Referencia literal a fuente de métricas de utilidad auxiliar| n_GAS_AUX_METRICAS
  n_EXT_ACTIONS -->|Programa productor cada veinte minutos| n_SVC_SALA_PRODUCTOR
  n_SVC_SALA_PRODUCTOR -->|Lee decisiones/reglas y escribe cola| n_GAS_SALA
  n_EXT_ACTIONS -->|Programa ejecución de etapas habilitadas| n_SVC_SALA_EJECUTOR
  n_SVC_SALA_EJECUTOR -->|Lee cola y registra resultado| n_GAS_SALA
  n_SVC_SALA_EJECUTOR -->|Selecciona motor según configuración| n_EXT_MOTORES_MEDIA
  n_SVC_SALA_EJECUTOR -->|Sube activos producidos| n_EXT_DRIVE
  n_GAS_SALA -->|Valida credencial del OS desde servidor| n_GAS_PORTERO
  n_GAS_SALA -->|Consulta respaldo de identidad| n_GAS_PORTERO_RESPALDO
  n_GAS_PORTERO -->|Lee resultados nativos; escribe cantidades permitidas| n_SHEET_PPP_MODELOS
  n_SHEET_PORTERO -.->|Registra caso, libro, carpeta y revisión del modelo| n_SHEET_PPP_MODELOS
  n_EXT_GITHUB_PUBLISHER_APP -.->|Crea PR del commit preparado de Sala| n_SYS_SALA
  n_EXT_GITHUB_PUBLISHER_APP -.->|Crea PR del commit preparado de Marketing| n_SYS_MARKETING
  n_GAS_CRM -->|Consulta identidad y alcance de lectura| n_GAS_PORTERO
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_YOD_OS pendiente;
  class n_SYS_PLAN_POTENCIAL pendiente;
  class n_SYS_CROKISS pendiente;
  class n_SYS_SALA_OPERACION pendiente;
  class n_SHEET_PORTERO pendiente;
  class n_SHEET_MARKETING pendiente;
  class n_SHEET_PLAN_POTENCIAL pendiente;
  class n_SHEET_CROKISS pendiente;
  class n_SHEET_CODES pendiente;
  class n_SHEET_SALA pendiente;
  class n_EXT_DRIVE pendiente;
  class n_EXT_CALENDAR pendiente;
  class n_EXT_META pendiente;
  class n_EXT_ACTIONS pendiente;
  class n_SHEET_CRM pendiente;
  class n_GAS_INVERSION pendiente;
  class n_SHEET_INVERSION pendiente;
  class n_GAS_AUX_METRICAS pendiente;
```

## Proyectos

```mermaid
flowchart LR
  n_SYS_TRACK["Tracks de codesarrollo"]
  n_SYS_MIRAMAR["Real de Miramar"]
  n_SYS_INTERIORES["Aurum · Interiores"]
  n_SYS_YOD_OS["YOD OS"]
  n_SYS_ALQUIMIA["Alquimia Urbana"]
  n_GAS_PORTERO["Portero y Potenciales"]
  n_GAS_CATALOGO["Catálogo del OS"]
  n_GAS_MIRAMAR["Miramar"]
  n_SHEET_MIRAMAR["Datos de Miramar"]
  n_GAS_INTERIORES["Interiores"]
  n_SHEET_INTERIORES["Datos de Interiores"]
  n_GAS_ALQUIMIA["Registro del grupo"]
  n_SHEET_ALQUIMIA["Datos de Registro del grupo"]
  n_GAS_MIRAMAR -->|Lee/escribe registros del dominio| n_SHEET_MIRAMAR
  n_GAS_INTERIORES -.->|Lee/escribe registros del dominio| n_SHEET_INTERIORES
  n_GAS_ALQUIMIA -.->|Lee/escribe registros del dominio| n_SHEET_ALQUIMIA
  n_SYS_TRACK -->|Consume contrato del backend| n_GAS_PORTERO
  n_SYS_MIRAMAR -->|Consume contrato del backend| n_GAS_MIRAMAR
  n_SYS_INTERIORES -.->|Consume contrato del backend| n_GAS_INTERIORES
  n_SYS_ALQUIMIA -.->|Consume contrato del backend| n_GAS_ALQUIMIA
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_TRACK
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_MIRAMAR
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_INTERIORES
  n_SYS_INTERIORES -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_MIRAMAR -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_GAS_MIRAMAR -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_SYS_TRACK -->|Consulta resource Track para codesarrollos| n_GAS_CATALOGO
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_YOD_OS pendiente;
  class n_SYS_ALQUIMIA pendiente;
  class n_SHEET_MIRAMAR pendiente;
  class n_GAS_INTERIORES pendiente;
  class n_SHEET_INTERIORES pendiente;
  class n_SHEET_ALQUIMIA pendiente;
```

## Finanzas

```mermaid
flowchart LR
  n_SYS_FLUJO["Tesorería"]
  n_SYS_YOD_OS["YOD OS"]
  n_GAS_PORTERO["Portero y Potenciales"]
  n_GAS_FLUJO["Tesorería"]
  n_SHEET_FLUJO["Datos de Tesorería"]
  n_GAS_FLUJO -->|Lee/escribe registros del dominio| n_SHEET_FLUJO
  n_SYS_FLUJO -->|Consume contrato del backend| n_GAS_FLUJO
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_FLUJO
  n_SYS_FLUJO -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_GAS_FLUJO -->|Verifica credencial y acceso al módulo| n_GAS_PORTERO
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_YOD_OS pendiente;
```

## Obra

```mermaid
flowchart LR
  n_SYS_OBRA["Obra en vivo"]
  n_SYS_YOD_OS["YOD OS"]
  n_SYS_OBRA_CLIENTE["Obra · módulo cliente"]
  n_GAS_PORTERO["Portero y Potenciales"]
  n_GAS_OBRA["Motor de obra"]
  n_SHEET_OBRA["Datos de Motor de obra"]
  n_GAS_OBRA_CLIENTE["Módulo cliente de obra"]
  n_SHEET_OBRA_CLIENTE["Datos de Módulo cliente de obra"]
  n_GAS_OBRA -->|Lee/escribe registros del dominio| n_SHEET_OBRA
  n_GAS_OBRA_CLIENTE -->|Lee/escribe registros del dominio| n_SHEET_OBRA_CLIENTE
  n_SYS_OBRA -->|Consume contrato del backend| n_GAS_OBRA
  n_SYS_OBRA_CLIENTE -->|Consume contrato del backend| n_GAS_OBRA_CLIENTE
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_OBRA
  n_SYS_OBRA -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_GAS_OBRA -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_GAS_OBRA_CLIENTE -->|Consulta avance por folio mediante servicio| n_GAS_OBRA
  n_GAS_OBRA -->|Verifica credencial para operar| n_GAS_PORTERO
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_YOD_OS pendiente;
  class n_SHEET_OBRA pendiente;
  class n_SHEET_OBRA_CLIENTE pendiente;
```

## Gobierno

```mermaid
flowchart LR
  n_SYS_DESPACHO["El Despacho"]
  n_SYS_POTENCIALES["PPP · Potenciales"]
  n_SYS_TRACK["Tracks de codesarrollo"]
  n_SYS_MIRAMAR["Real de Miramar"]
  n_SYS_TAREAS["MOAC"]
  n_SYS_FLUJO["Tesorería"]
  n_SYS_INTERIORES["Aurum · Interiores"]
  n_SYS_INVERSION["Presentación a inversionistas"]
  n_SYS_MARKETING["Embudo comercial"]
  n_SYS_OBRA["Obra en vivo"]
  n_SYS_CONTROL["Control Maestro"]
  n_SYS_YOD_OS["YOD OS"]
  n_SYS_EMD["Evaluación de personas"]
  n_SYS_PINTARRON["Pintarrón"]
  n_GAS_PORTERO["Portero y Potenciales"]
  n_GAS_CATALOGO["Catálogo del OS"]
  n_SHEET_CATALOGO["Datos de Catálogo del OS"]
  n_GAS_OPERACION["Operación y tareas"]
  n_GAS_PLAN_POTENCIAL["Captación de Plan Potencial"]
  n_GAS_CODES["Portal de codesarrolladores"]
  n_GAS_MIRAMAR["Miramar"]
  n_GAS_OBRA["Motor de obra"]
  n_GAS_CRM["CRM comercial"]
  n_GAS_PORTERO_RESPALDO["Portero de respaldo"]
  n_GAS_CATALOGO -.->|Lee/escribe registros del dominio| n_SHEET_CATALOGO
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_DESPACHO
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_POTENCIALES
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_TRACK
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_MIRAMAR
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_TAREAS
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_FLUJO
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_INTERIORES
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_INVERSION
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_MARKETING
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_OBRA
  n_SYS_YOD_OS -->|Navega al sistema autorizado| n_SYS_CONTROL
  n_SYS_YOD_OS -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_GAS_PLAN_POTENCIAL -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_GAS_MIRAMAR -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_GAS_PORTERO -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_GAS_OPERACION -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_GAS_CODES -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_GAS_OBRA -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_SYS_YOD_OS -->|Consulta leads del CRM| n_GAS_CRM
  n_SYS_TRACK -->|Consulta resource Track para codesarrollos| n_GAS_CATALOGO
  n_SYS_YOD_OS -->|Respaldo de identidad| n_GAS_PORTERO_RESPALDO
  n_GAS_PORTERO -->|Registra antes, después, actor y siguiente paso| n_SYS_CONTROL
  n_SYS_YOD_OS -.->|Wrapper EMD en dominio GitHub propio; legado compatible| n_SYS_EMD
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_YOD_OS pendiente;
  class n_SYS_EMD pendiente;
  class n_SYS_PINTARRON pendiente;
```

## Personas

```mermaid
flowchart LR
  n_SYS_YOD_OS["YOD OS"]
  n_SYS_EMD["Evaluación de personas"]
  n_GAS_EMD["Evaluación privada"]
  n_SHEET_EMD["Datos de Evaluación privada"]
  n_EXT_DRIVE["Google Drive"]
  n_STORE_EMD_DRAFTS["Borradores locales cifrados de evaluación"]
  n_GAS_EMD -.->|Lee/escribe registros del dominio| n_SHEET_EMD
  n_SYS_EMD -.->|Consume contrato del backend| n_GAS_EMD
  n_GAS_EMD -.->|Propuesta: fotos privadas de perfil| n_EXT_DRIVE
  n_SYS_EMD -.->|Propuesta: copia cifrada local| n_STORE_EMD_DRAFTS
  n_SYS_YOD_OS -.->|Wrapper EMD en dominio GitHub propio; legado compatible| n_SYS_EMD
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_YOD_OS pendiente;
  class n_SYS_EMD pendiente;
  class n_GAS_EMD pendiente;
  class n_SHEET_EMD pendiente;
  class n_EXT_DRIVE pendiente;
```

## Infraestructura

```mermaid
flowchart LR
  n_SYS_DESPACHO["El Despacho"]
  n_SYS_MARKETING["Embudo comercial"]
  n_SYS_SALA["Sala de Edición"]
  n_SYS_SITIO_ORG["Sitio de organización"]
  n_SYS_PRUEBA_DOMINIO["Prueba de dominio"]
  n_GAS_PORTERO["Portero y Potenciales"]
  n_GAS_PLAN_POTENCIAL["Captación de Plan Potencial"]
  n_GAS_CODES["Portal de codesarrolladores"]
  n_GAS_EMD["Evaluación privada"]
  n_EXT_DRIVE["Google Drive"]
  n_EXT_CALENDAR["Google Calendar"]
  n_EXT_META["Meta"]
  n_EXT_GMAIL["Gmail"]
  n_EXT_ACTIONS["GitHub Actions"]
  n_SVC_SALA_PRODUCTOR["Productor de Sala"]
  n_SVC_SALA_EJECUTOR["Ejecutor de Sala"]
  n_EXT_GITHUB_PUBLISHER_APP["Identidad de publicación GitHub"]
  n_GAS_PLAN_POTENCIAL -.->|Confirma cita agendada| n_EXT_CALENDAR
  n_EXT_META -.->|Obtiene métricas mediante Actions| n_SYS_MARKETING
  n_SYS_DESPACHO -.->|Aprobación de borradores por protocolo BANDEJA| n_EXT_GMAIL
  n_GAS_CODES -->|Almacena archivos y comprobantes| n_EXT_DRIVE
  n_SYS_SALA -.->|Orquesta producción en la nube| n_EXT_ACTIONS
  n_EXT_ACTIONS -->|Programa productor cada veinte minutos| n_SVC_SALA_PRODUCTOR
  n_EXT_ACTIONS -->|Programa ejecución de etapas habilitadas| n_SVC_SALA_EJECUTOR
  n_SVC_SALA_EJECUTOR -->|Sube activos producidos| n_EXT_DRIVE
  n_EXT_ACTIONS -.->|Solicita identidad temporal limitada al repositorio| n_EXT_GITHUB_PUBLISHER_APP
  n_EXT_GITHUB_PUBLISHER_APP -.->|Crea PR del commit preparado de Sala| n_SYS_SALA
  n_EXT_GITHUB_PUBLISHER_APP -.->|Crea PR del commit preparado de Marketing| n_SYS_MARKETING
  n_GAS_EMD -.->|Propuesta: fotos privadas de perfil| n_EXT_DRIVE
  n_GAS_PORTERO -.->|Corcho: principal y ACL completos por GET| n_EXT_DRIVE
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_SITIO_ORG pendiente;
  class n_GAS_EMD pendiente;
  class n_EXT_DRIVE pendiente;
  class n_EXT_CALENDAR pendiente;
  class n_EXT_META pendiente;
  class n_EXT_GMAIL pendiente;
  class n_EXT_ACTIONS pendiente;
```

## Identidad

```mermaid
flowchart LR
  n_SYS_DESPACHO["El Despacho"]
  n_SYS_POTENCIALES["PPP · Potenciales"]
  n_SYS_TRACK["Tracks de codesarrollo"]
  n_SYS_MIRAMAR["Real de Miramar"]
  n_SYS_TAREAS["MOAC"]
  n_SYS_FLUJO["Tesorería"]
  n_SYS_INTERIORES["Aurum · Interiores"]
  n_SYS_INVERSION["Presentación a inversionistas"]
  n_SYS_MARKETING["Embudo comercial"]
  n_SYS_OBRA["Obra en vivo"]
  n_SYS_CONTROL["Control Maestro"]
  n_SYS_YOD_OS["YOD OS"]
  n_GAS_PORTERO["Portero y Potenciales"]
  n_SHEET_PORTERO["Datos de Portero y Potenciales"]
  n_GAS_FLUJO["Tesorería"]
  n_GAS_OBRA["Motor de obra"]
  n_GAS_SALA["Sala de Edición"]
  n_EXT_DRIVE["Google Drive"]
  n_GAS_CRM["CRM comercial"]
  n_GAS_PORTERO_RESPALDO["Portero de respaldo"]
  n_SHEET_PPP_MODELOS["PPP · Libros de cálculo por caso"]
  n_STORE_DESPACHO_CORCHO["Mi Corcho · almacén privado de Dirección"]
  n_GAS_PORTERO -.->|Lee/escribe registros del dominio| n_SHEET_PORTERO
  n_SYS_POTENCIALES -.->|Consume contrato del backend| n_GAS_PORTERO
  n_SYS_TRACK -->|Consume contrato del backend| n_GAS_PORTERO
  n_SYS_YOD_OS -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_TAREAS -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_FLUJO -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_DESPACHO -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_INTERIORES -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_MARKETING -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_MIRAMAR -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_SYS_OBRA -.->|Canje de sesión y permisos| n_GAS_PORTERO
  n_GAS_PORTERO -->|Agrega indicadores en tablero cenital| n_SYS_YOD_OS
  n_SYS_INVERSION -->|Acceso compartido del equipo| n_GAS_PORTERO
  n_SYS_YOD_OS -->|Respaldo de identidad| n_GAS_PORTERO_RESPALDO
  n_GAS_SALA -->|Valida credencial del OS desde servidor| n_GAS_PORTERO
  n_GAS_SALA -->|Consulta respaldo de identidad| n_GAS_PORTERO_RESPALDO
  n_GAS_PORTERO -->|Lee resultados nativos; escribe cantidades permitidas| n_SHEET_PPP_MODELOS
  n_SHEET_PORTERO -.->|Registra caso, libro, carpeta y revisión del modelo| n_SHEET_PPP_MODELOS
  n_GAS_PORTERO -->|Registra antes, después, actor y siguiente paso| n_SYS_CONTROL
  n_GAS_FLUJO -->|Verifica credencial y acceso al módulo| n_GAS_PORTERO
  n_GAS_CRM -->|Consulta identidad y alcance de lectura| n_GAS_PORTERO
  n_GAS_OBRA -->|Verifica credencial para operar| n_GAS_PORTERO
  n_SYS_DESPACHO -.->|Provisional: sólo corchoGet/corchoSave| n_GAS_PORTERO
  n_GAS_PORTERO -.->|Provisional: CAS en Mi Corcho privado| n_STORE_DESPACHO_CORCHO
  n_GAS_PORTERO -.->|Corcho: principal y ACL completos por GET| n_EXT_DRIVE
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SYS_YOD_OS pendiente;
  class n_SHEET_PORTERO pendiente;
  class n_EXT_DRIVE pendiente;
  class n_STORE_DESPACHO_CORCHO pendiente;
```

## Desarrollos

```mermaid
flowchart LR
  n_SYS_AMALAYA["Amalaya"]
  n_GAS_AMALAYA["Motor Amalaya"]
  n_SHEET_AMALAYA["Datos de Amalaya"]
  n_SYS_AMALAYA -->|Consume contrato autenticado del tablero| n_GAS_AMALAYA
  n_GAS_AMALAYA -->|Conserva chinches y su historial| n_SHEET_AMALAYA
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_SHEET_AMALAYA pendiente;
```

## Dirección

```mermaid
flowchart LR
  n_GAS_PORTERO["Portero y Potenciales"]
  n_GAS_OPERACION["Operación y tareas"]
  n_STORE_DESPACHO_CORCHO["Mi Corcho · almacén privado de Dirección"]
  n_GAS_OPERACION -.->|Futuro Ops: mismo almacén Corcho tras identificar proyecto| n_STORE_DESPACHO_CORCHO
  n_GAS_PORTERO -.->|Provisional: CAS en Mi Corcho privado| n_STORE_DESPACHO_CORCHO
  classDef pendiente fill:#fff5da,stroke:#996d16,stroke-dasharray:5 3;
  class n_STORE_DESPACHO_CORCHO pendiente;
```

## Contratos y evidencia de cada conexión

| ID | Origen → destino | Mecanismo y datos | Estado | Evidencia |
|---|---|---|---|---|
| CON-001 | GAS-PORTERO → SHEET-PORTERO | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [potenciales-yod/CLAUDE.md](https://github.com/yodesarrollomx/potenciales-yod/blob/4694f7db9a3de4d5415e711d090140e6a2875f01/CLAUDE.md#L35) — Backend asociado al almacén de su dominio |
| CON-002 | GAS-CATALOGO → SHEET-CATALOGO | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L103) — Backend asociado al almacén de su dominio |
| CON-003 | GAS-OPERACION → SHEET-OPERACION | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [board-aurum/apps-script/portero-auth.gs](https://github.com/yodesarrollomx/board-aurum/blob/096550e5647a63048450b9be848be71901a32a3a/apps-script/portero-auth.gs#L63) — Backend asociado al almacén de su dominio |
| CON-004 | GAS-FLUJO → SHEET-FLUJO | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [board-flujo-yod/apps-script/portero-auth.gs](https://github.com/yodesarrollomx/board-flujo-yod/blob/ef2e6e1fade1b515d10af239bc60519417d906c4/apps-script/portero-auth.gs#L36) — Backend asociado al almacén de su dominio |
| CON-005 | GAS-MARKETING → SHEET-MARKETING | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [aurum-board/apps-script/portero-auth.gs](https://github.com/yodesarrollomx/aurum-board/blob/ed41c34892aa8554b9599f0f50f325bb7b1d4deb/apps-script/portero-auth.gs#L43) — Backend asociado al almacén de su dominio |
| CON-006 | GAS-PLAN-POTENCIAL → SHEET-PLAN-POTENCIAL | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [plan-potencial/CLAUDE.md](https://github.com/yodesarrollomx/plan-potencial/blob/78e616f858ad593f16891d2f5158cd46d5617bc2/CLAUDE.md#L95) — Backend asociado al almacén de su dominio |
| CON-007 | GAS-CROKISS → SHEET-CROKISS | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [crokiss/Code.gs](https://github.com/yodesarrollomx/crokiss/blob/3d440a21a6902fcefe79a124a804963613d5a31f/Code.gs#L234) — Backend asociado al almacén de su dominio |
| CON-008 | GAS-CODES → SHEET-CODES | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [Co-desarrolladores-Yod/apps_script/Código.js](https://github.com/yodesarrollomx/Co-desarrolladores-Yod/blob/f15154f784f204b60946985524e83a2539f40732/apps_script/C%C3%B3digo.js#L517) — Backend asociado al almacén de su dominio |
| CON-009 | GAS-MIRAMAR → SHEET-MIRAMAR | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [real-miramar-board/apps-script/portero-auth.gs](https://github.com/yodesarrollomx/real-miramar-board/blob/a46e513548ceb188fb631bd123ef9f682eff95bf/apps-script/portero-auth.gs#L48) — Backend asociado al almacén de su dominio |
| CON-010 | GAS-INTERIORES → SHEET-INTERIORES | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [interiores-aurum/CLAUDE.md](https://github.com/yodesarrollomx/interiores-aurum/blob/6722c50b504c2f326d29d187605b2ad126e7ce17/CLAUDE.md#L33) — Backend asociado al almacén de su dominio |
| CON-011 | GAS-ALQUIMIA → SHEET-ALQUIMIA | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [alquimia-urbana/CLAUDE.md](https://github.com/yodesarrollomx/alquimia-urbana/blob/bf295e2970ad008e58fa3f216a8cfc14353cf7e8/CLAUDE.md#L63) — Backend asociado al almacén de su dominio |
| CON-012 | GAS-OBRA → SHEET-OBRA | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/obra.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/obra.html#L259) — Backend asociado al almacén de su dominio |
| CON-013 | GAS-OBRA-CLIENTE → SHEET-OBRA-CLIENTE | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/obra-app/motor/ObraCliente.gs](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/obra-app/motor/ObraCliente.gs#L175) — Backend asociado al almacén de su dominio |
| CON-014 | GAS-SALA → SHEET-SALA | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/gas/Code.gs](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/gas/Code.gs#L713) — Backend asociado al almacén de su dominio |
| CON-015 | GAS-EMD → SHEET-EMD | persistencia: Lee/escribe registros del dominio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | pendiente | Integración pendiente de verificar |
| CON-016 | SYS-DESPACHO → GAS-OPERACION | api: Tareas ordinarias getAll/update en Operación. getAll/update siguen en GAS-OPERACION, con contrato y autorización existentes. CHG-DESPACHO-CORCHO-PROVISIONAL-035 propone separar exclusivamente corchoGet/corchoSave hacia GAS-PORTERO; ninguna otra acción cambia de endpoint. | declarado | [yod-despacho/README.md](https://github.com/yodesarrollomx/yod-despacho/blob/5ad406a6b8584ee49466b15e03a9a3bf8a9ca4b9/README.md#L13) — Conexión cliente/backend; [yod-despacho/app.js](https://github.com/yodesarrollomx/yod-despacho/blob/32330badba66dd9b23a7413498f421aeb628c9cb/app.js) — Cliente existente de tareas; separación de Corcho preparada por coordinador, todavía no integrada en el frontend publicado. |
| CON-017 | SYS-TAREAS → GAS-OPERACION | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [board-aurum/README.md](https://github.com/yodesarrollomx/board-aurum/blob/096550e5647a63048450b9be848be71901a32a3a/README.md#L11) — Conexión cliente/backend |
| CON-018 | SYS-FLUJO → GAS-FLUJO | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [board-flujo-yod/index.html](https://github.com/yodesarrollomx/board-flujo-yod/blob/ef2e6e1fade1b515d10af239bc60519417d906c4/index.html#L379) — Conexión cliente/backend |
| CON-019 | SYS-POTENCIALES → GAS-PORTERO | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [potenciales-yod/CLAUDE.md](https://github.com/yodesarrollomx/potenciales-yod/blob/4694f7db9a3de4d5415e711d090140e6a2875f01/CLAUDE.md#L47) — Conexión cliente/backend |
| CON-020 | SYS-TRACK → GAS-PORTERO | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1683) — Conexión cliente/backend |
| CON-021 | SYS-MARKETING → GAS-MARKETING | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [aurum-board/CLAUDE.md](https://github.com/yodesarrollomx/aurum-board/blob/ed41c34892aa8554b9599f0f50f325bb7b1d4deb/CLAUDE.md#L95) — Conexión cliente/backend |
| CON-022 | SYS-MARKETING → GAS-PLAN-POTENCIAL | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [aurum-board/CLAUDE.md](https://github.com/yodesarrollomx/aurum-board/blob/ed41c34892aa8554b9599f0f50f325bb7b1d4deb/CLAUDE.md#L99) — Conexión cliente/backend |
| CON-023 | SYS-PLAN-POTENCIAL → GAS-PLAN-POTENCIAL | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [plan-potencial/CLAUDE.md](https://github.com/yodesarrollomx/plan-potencial/blob/78e616f858ad593f16891d2f5158cd46d5617bc2/CLAUDE.md#L131) — Conexión cliente/backend |
| CON-024 | SYS-CROKISS → GAS-CROKISS | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [crokiss/Code.gs](https://github.com/yodesarrollomx/crokiss/blob/3d440a21a6902fcefe79a124a804963613d5a31f/Code.gs#L234) — Conexión cliente/backend |
| CON-025 | SYS-CODES-PORTAL → GAS-CODES | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [Co-desarrolladores-Yod/src/App.jsx](https://github.com/yodesarrollomx/Co-desarrolladores-Yod/blob/f15154f784f204b60946985524e83a2539f40732/src/App.jsx#L775) — Conexión cliente/backend |
| CON-026 | SYS-MIRAMAR → GAS-MIRAMAR | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [real-miramar-board/assets/board.js](https://github.com/yodesarrollomx/real-miramar-board/blob/a46e513548ceb188fb631bd123ef9f682eff95bf/assets/board.js#L34) — Conexión cliente/backend |
| CON-027 | SYS-INTERIORES → GAS-INTERIORES | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [interiores-aurum/CLAUDE.md](https://github.com/yodesarrollomx/interiores-aurum/blob/6722c50b504c2f326d29d187605b2ad126e7ce17/CLAUDE.md#L51) — Conexión cliente/backend |
| CON-028 | SYS-ALQUIMIA → GAS-ALQUIMIA | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [alquimia-urbana/CLAUDE.md](https://github.com/yodesarrollomx/alquimia-urbana/blob/bf295e2970ad008e58fa3f216a8cfc14353cf7e8/CLAUDE.md#L48) — Conexión cliente/backend |
| CON-029 | SYS-OBRA → GAS-OBRA | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/obra.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/obra.html#L259) — Conexión cliente/backend |
| CON-030 | SYS-OBRA-CLIENTE → GAS-OBRA-CLIENTE | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/obra-app/obras.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/obra-app/obras.js#L13) — Conexión cliente/backend |
| CON-031 | SYS-SALA → GAS-SALA | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [sala-edicion/CLAUDE.md](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/CLAUDE.md#L24) — Conexión cliente/backend |
| CON-032 | SYS-EMD → GAS-EMD | api: Consume contrato del backend. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | pendiente | Integración pendiente de verificar |
| CON-033 | SYS-YOD-OS → SYS-DESPACHO | navegacion: Navega al sistema autorizado. Navegación existente al Despacho autorizado. CTR-DESPACHO-3D-SECTION: sección inmersiva bajo sesión confirmada y DP; frontend neutro alojado en GitHub, sin autenticación ChatGPT. Chinches geométricas por origen/ventana exactos. Datos operativos y motor autónomo requieren transportes autorizados comprobados. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L16) — Destino del catálogo |
| CON-034 | SYS-YOD-OS → SYS-POTENCIALES | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L17) — Destino del catálogo |
| CON-035 | SYS-YOD-OS → SYS-TRACK | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L18) — Destino del catálogo |
| CON-036 | SYS-YOD-OS → SYS-MIRAMAR | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L19) — Destino del catálogo |
| CON-037 | SYS-YOD-OS → SYS-TAREAS | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L20) — Destino del catálogo |
| CON-038 | SYS-YOD-OS → SYS-FLUJO | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L21) — Destino del catálogo |
| CON-039 | SYS-YOD-OS → SYS-INTERIORES | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L22) — Destino del catálogo |
| CON-040 | SYS-YOD-OS → SYS-INVERSION | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L23) — Destino del catálogo |
| CON-041 | SYS-YOD-OS → SYS-MARKETING | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L24) — Destino del catálogo |
| CON-042 | SYS-YOD-OS → SYS-OBRA | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L25) — Destino del catálogo |
| CON-043 | SYS-YOD-OS → SYS-CONTROL | navegacion: Navega al sistema autorizado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/catalogo.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/catalogo.js#L26) — Destino del catálogo |
| CON-044 | SYS-YOD-OS → GAS-PORTERO | autenticacion: Canje de sesión y permisos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L48) — Cada backend valida su acceso |
| CON-045 | SYS-TAREAS → GAS-PORTERO | autenticacion: Canje de sesión y permisos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L48) — Cada backend valida su acceso |
| CON-046 | SYS-FLUJO → GAS-PORTERO | autenticacion: Canje de sesión y permisos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L48) — Cada backend valida su acceso |
| CON-047 | SYS-DESPACHO → GAS-PORTERO | autenticacion: Canje de sesión y permisos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L48) — Cada backend valida su acceso |
| CON-048 | SYS-INTERIORES → GAS-PORTERO | autenticacion: Canje de sesión y permisos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L48) — Cada backend valida su acceso |
| CON-049 | SYS-MARKETING → GAS-PORTERO | autenticacion: Canje de sesión y permisos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L48) — Cada backend valida su acceso |
| CON-050 | SYS-MIRAMAR → GAS-PORTERO | autenticacion: Canje de sesión y permisos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L48) — Cada backend valida su acceso |
| CON-051 | SYS-OBRA → GAS-PORTERO | autenticacion: Canje de sesión y permisos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-portal/CLAUDE.md](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/CLAUDE.md#L48) — Cada backend valida su acceso |
| CON-052 | GAS-PLAN-POTENCIAL → SYS-YOD-OS | lectura_agregada: Agrega indicadores en tablero cenital. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1505) — Conector de resumen |
| CON-053 | GAS-MIRAMAR → SYS-YOD-OS | lectura_agregada: Agrega indicadores en tablero cenital. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1543) — Conector de resumen |
| CON-054 | GAS-PORTERO → SYS-YOD-OS | lectura_agregada: Agrega indicadores en tablero cenital. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1683) — Conector de resumen |
| CON-055 | GAS-OPERACION → SYS-YOD-OS | lectura_agregada: Agrega indicadores en tablero cenital. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1717) — Conector de resumen |
| CON-056 | GAS-CODES → SYS-YOD-OS | lectura_agregada: Agrega indicadores en tablero cenital. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1755) — Conector de resumen |
| CON-057 | GAS-OBRA → SYS-YOD-OS | lectura_agregada: Agrega indicadores en tablero cenital. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1605) — Conector de resumen |
| CON-058 | GAS-OBRA-CLIENTE → GAS-OBRA | lectura: Consulta avance por folio mediante servicio. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/obra-app/motor/ObraCliente.gs](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/obra-app/motor/ObraCliente.gs#L107) — Lectura del motor de obra |
| CON-059 | GAS-PLAN-POTENCIAL → EXT-CALENDAR | integracion: Confirma cita agendada. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [plan-potencial/CLAUDE.md](https://github.com/yodesarrollomx/plan-potencial/blob/78e616f858ad593f16891d2f5158cd46d5617bc2/CLAUDE.md#L101) — Cruce declarado con Calendar |
| CON-060 | EXT-META → SYS-MARKETING | integracion: Obtiene métricas mediante Actions. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [aurum-board/CLAUDE.md](https://github.com/yodesarrollomx/aurum-board/blob/ed41c34892aa8554b9599f0f50f325bb7b1d4deb/CLAUDE.md#L30) — Generación periódica de métricas |
| CON-061 | SYS-DESPACHO → EXT-GMAIL | accion_humana_y_rutina: Aprobación de borradores por protocolo BANDEJA. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yod-despacho/EJECUTOR.md](https://github.com/yodesarrollomx/yod-despacho/blob/5ad406a6b8584ee49466b15e03a9a3bf8a9ca4b9/EJECUTOR.md#L14) — Rutina externa declarada con aprobación humana |
| CON-062 | GAS-CODES → EXT-DRIVE | documentos: Almacena archivos y comprobantes. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [Co-desarrolladores-Yod/apps_script/Código.js](https://github.com/yodesarrollomx/Co-desarrolladores-Yod/blob/f15154f784f204b60946985524e83a2539f40732/apps_script/C%C3%B3digo.js#L1139) — Subida de archivos de portal |
| CON-063 | SYS-SALA → EXT-ACTIONS | automatizacion: Orquesta producción en la nube. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [sala-edicion/CLAUDE.md](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/CLAUDE.md#L85) — Ciclo de producción en nube |
| CON-064 | SYS-SALA-OPERACION → SYS-SALA | automatizacion: Herramientas históricas de producción. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [sala-edicion/CLAUDE.md](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/CLAUDE.md#L69) — Migración de herramientas a nube |
| CON-065 | SYS-YOD-OS → GAS-CRM | lectura_agregada: Consulta leads del CRM. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/tablero.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/tablero.html#L1800) — Conector de CRM |
| CON-066 | GAS-CRM → SHEET-CRM | persistencia: Persistencia comercial lógica. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | pendiente | Integración pendiente de verificar |
| CON-067 | SYS-TAREAS → GAS-MOAC-METAS | api: Enruta moac/moacSet/moacObjetivo a motor separado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [board-aurum/src/App.jsx](https://github.com/yodesarrollomx/board-aurum/blob/096550e5647a63048450b9be848be71901a32a3a/src/App.jsx#L468) — Selección de motor por prefijo |
| CON-068 | GAS-MOAC-METAS → SHEET-MOAC-METAS | persistencia: Lee y vincula estrategia. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [board-aurum/src/App.jsx](https://github.com/yodesarrollomx/board-aurum/blob/096550e5647a63048450b9be848be71901a32a3a/src/App.jsx#L1957) — Libro fuente declarado en código |
| CON-069 | SYS-INVERSION → GAS-INVERSION | api: Lee presentación y guarda diagnóstico. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yodesarrollo-board/data-loader.jsx](https://github.com/yodesarrollomx/yodesarrollo-board/blob/4774888ede9caf53684ed7509d36ef7ffe1e126e/data-loader.jsx#L360) — Capa de datos de presentación; [yodesarrollo-board/CLAUDE.md](https://github.com/yodesarrollomx/yodesarrollo-board/blob/4774888ede9caf53684ed7509d36ef7ffe1e126e/CLAUDE.md#L66) — Acción de diagnóstico |
| CON-070 | GAS-INVERSION → SHEET-INVERSION | persistencia: Contenido y diagnósticos comerciales. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yodesarrollo-board/CLAUDE.md](https://github.com/yodesarrollomx/yodesarrollo-board/blob/4774888ede9caf53684ed7509d36ef7ffe1e126e/CLAUDE.md#L21) — Almacén canónico comercial |
| CON-071 | SYS-INVERSION → GAS-PORTERO | autenticacion: Acceso compartido del equipo. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yodesarrollo-board/index.html](https://github.com/yodesarrollomx/yodesarrollo-board/blob/4774888ede9caf53684ed7509d36ef7ffe1e126e/index.html#L66) — Carga del Portero |
| CON-072 | SYS-TRACK → GAS-CATALOGO | api: Consulta resource Track para codesarrollos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/track-codesarrollos.html](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/track-codesarrollos.html#L76) — Recurso Track del backend del catálogo |
| CON-073 | SYS-YOD-OS → GAS-PORTERO-RESPALDO | autenticacion: Respaldo de identidad. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [yod-portal/os/yod-acceso.js](https://github.com/yodesarrollomx/yod-portal/blob/82f597bee316c942e4f631a507c7f8277178fcd3/os/yod-acceso.js#L16) — Configuración del respaldo |
| CON-074 | SYS-AURUM-EXPERIENCIA → EXT-AURUM-WEB | navegacion: Redirige conservando atribución y fragmento. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [aurum-experiencia/index.html](https://github.com/yodesarrollomx/aurum-experiencia/blob/b67d48a8935c6747caf146cb0b69d25ea5a7ad21/index.html#L23) — Redirect al sitio activo |
| CON-075 | SYS-INVERSION → SYS-PLAN-POTENCIAL | captacion: CTA con atribución de presentación. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | declarado | [yodesarrollo-board/CLAUDE.md](https://github.com/yodesarrollomx/yodesarrollo-board/blob/4774888ede9caf53684ed7509d36ef7ffe1e126e/CLAUDE.md#L80) — CTA comercial con campaña |
| CON-076 | GAS-PLAN-POTENCIAL → SYS-MARKETING | atribucion: Cruza campañas/piezas con leads y citas. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [aurum-board/scripts/pull_metrics.py](https://github.com/yodesarrollomx/aurum-board/blob/ed41c34892aa8554b9599f0f50f325bb7b1d4deb/scripts/pull_metrics.py#L98) — Atribución implementada a nivel campaña y pieza |
| CON-077 | SYS-SALA-OPERACION → SYS-MARKETING | automatizacion: Genera métricas de campañas en utilidades históricas. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | pendiente | Integración pendiente de verificar |
| CON-078 | SYS-SALA-OPERACION → GAS-AUX-METRICAS | lectura: Referencia literal a fuente de métricas de utilidad auxiliar. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | pendiente | Integración pendiente de verificar |
| CON-079 | EXT-ACTIONS → SVC-SALA-PRODUCTOR | automatizacion: Programa productor cada veinte minutos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/.github/workflows/sala-cada-hora.yml](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/.github/workflows/sala-cada-hora.yml#L9) — Frecuencia configurada en workflow, no evidencia de corridas |
| CON-080 | SVC-SALA-PRODUCTOR → GAS-SALA | api: Lee decisiones/reglas y escribe cola. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/nube/sala_productor.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_productor.py#L130) — Planificador de compuertas |
| CON-081 | EXT-ACTIONS → SVC-SALA-EJECUTOR | automatizacion: Programa ejecución de etapas habilitadas. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/.github/workflows/sala-cada-hora.yml](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/.github/workflows/sala-cada-hora.yml#L8) — Disparador declarado cada dos horas |
| CON-082 | SVC-SALA-EJECUTOR → GAS-SALA | api: Lee cola y registra resultado. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/nube/sala_ejecutor.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_ejecutor.py#L88) — Procesamiento de trabajo |
| CON-083 | SVC-SALA-EJECUTOR → EXT-MOTORES-MEDIA | integracion: Selecciona motor según configuración. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/nube/sala_motores.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_motores.py#L37) — Registro de motores de producción |
| CON-084 | SVC-SALA-EJECUTOR → EXT-DRIVE | documentos: Sube activos producidos. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/nube/sala_ejecutor.py](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/nube/sala_ejecutor.py#L67) — Publicación de resultado en Drive |
| CON-085 | GAS-SALA → GAS-PORTERO | autenticacion: Valida credencial del OS desde servidor. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/gas/Code.gs](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/gas/Code.gs#L193) — Valida credencial del OS desde servidor |
| CON-086 | GAS-SALA → GAS-PORTERO-RESPALDO | autenticacion: Consulta respaldo de identidad. Ver contrato en las fuentes citadas; versión desplegada, frecuencia, errores y recuperación pendientes de verificar. | codigo | [sala-edicion/gas/Code.gs](https://github.com/yodesarrollomx/sala-edicion/blob/dd62430eda613b73b703a3b9052214cbdd432ea7/gas/Code.gs#L191) — Consulta respaldo de identidad |
| CON-PPP-MODELO | GAS-PORTERO → SHEET-PPP-MODELOS | persistencia: Lee resultados nativos; escribe cantidades permitidas. Resolver libro por caso y versión; autorizar en servidor; validar campo, tipo, límites y revisión esperada; escribir cantidades y releer cálculo. Rechazar fórmulas o rangos arbitrarios; conservar URL existente. | ejecucion | Versión53 publicada; lectura HTTP de caso y lista conciliada con el libro piloto. Escritura permitida desplegada y probada con dobles; recorrido público de edición pendiente. |
| CON-PPP-REGISTRO | SHEET-PORTERO → SHEET-PPP-MODELOS | registro: Registra caso, libro, carpeta y revisión del modelo. IDs estables; un libro por caso y hoja por versión; no sustituir historial ni compartir archivos por efecto de registrar un enlace. | propuesto | Registro del piloto creado; organización y generación para todos los casos pendientes. |
| CON-PPP-AUDITORIA | GAS-PORTERO → SYS-CONTROL | auditoria: Registra antes, después, actor y siguiente paso. Auditoría en libro y Control Maestro con actor autenticado, entidad, versión, revisión, campo/rango, fuente y validación. No inventar valores previos ausentes ni declarar publicada una operación no confirmada. | codigo | Registro operativo privado actualizado; auditoría de transporte desplegada y activador de edición directa instalado. Primer evento real y recorrido de edición todavía sin observar. |
| CON-PUBLICADOR-IDENTIDAD | EXT-ACTIONS → EXT-GITHUB-PUBLISHER-APP | autenticacion: Solicita identidad temporal limitada al repositorio. CTR-PUBLICADOR-GITHUB. App con contents:read y pull_requests:write, exclusivamente para crear el PR. Las revisiones requeridas deben pasar antes del merge normal. | propuesto | Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB_TOKEN; requiere registro e instalación personal de una App privada de la organización. |
| CON-PUBLICADOR-SALA | EXT-GITHUB-PUBLISHER-APP → SYS-SALA | automatizacion: Crea PR del commit preparado de Sala. CTR-PUBLICADOR-GITHUB. App con contents:read y pull_requests:write, exclusivamente para crear el PR. Las revisiones requeridas deben pasar antes del merge normal. | propuesto | Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB_TOKEN; requiere registro e instalación personal de una App privada de la organización. |
| CON-PUBLICADOR-MARKETING | EXT-GITHUB-PUBLISHER-APP → SYS-MARKETING | automatizacion: Crea PR del commit preparado de Marketing. CTR-PUBLICADOR-GITHUB. App con contents:read y pull_requests:write, exclusivamente para crear el PR. Las revisiones requeridas deben pasar antes del merge normal. | propuesto | Diseño registrado para corregir el bloqueo observado de los workflows de PR creados por GITHUB_TOKEN; requiere registro e instalación personal de una App privada de la organización. |
| CON-AUTH-FLUJO | GAS-FLUJO → GAS-PORTERO | autenticacion: Verifica credencial y acceso al módulo. CTR-AUTORIZACION-OPERACIONES. La fuente acredita la consulta; revisar identidad, recurso, caché y rol por operación. Los vacíos funcionales permanecen en la matriz privada. | codigo | Revisión de fuente activa GAS-FLUJO, versión 15; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. |
| CON-AUTH-CRM | GAS-CRM → GAS-PORTERO | autenticacion: Consulta identidad y alcance de lectura. CTR-AUTORIZACION-OPERACIONES. La fuente acredita la consulta; revisar identidad, recurso, caché y rol por operación. Los vacíos funcionales permanecen en la matriz privada. | codigo | Revisión de fuente activa GAS-CRM, versión 20; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. |
| CON-AUTH-OBRA | GAS-OBRA → GAS-PORTERO | autenticacion: Verifica credencial para operar. CTR-AUTORIZACION-OPERACIONES. La fuente acredita la consulta; revisar identidad, recurso, caché y rol por operación. Los vacíos funcionales permanecen en la matriz privada. | codigo | Revisión de fuente activa GAS-OBRA, versión 16; dependencia de Portero contrastada en código y mediante dobles. No acredita recorrido completo de un usuario real. |
| CON-EMD-PROFILES-DRIVE | GAS-EMD → EXT-DRIVE | persistencia: Propuesta: fotos privadas de perfil. CTR-EMD-PROFILES: carpeta dedicada privada, carga y retirada propias, lectura autorizada y confirmación por revisión/mutación; sin nuevas autorizaciones OAuth. | propuesto | Propuesta registrada; implementación y despliegue privados pendientes de pruebas |
| CON-EMD-DRAFTS-LOCAL | SYS-EMD → STORE-EMD-DRAFTS | persistencia_local: Propuesta: copia cifrada local. CTR-EMD-DRAFTS: cifrado por enlace vigente, aislamiento de pestañas, confirmación transaccional local y recuperación explícita; el servidor mantiene revisión y cierre. | propuesto | Diseño propuesto de persistencia local; sin evidencia de publicación |
| CON-AMALAYA-CLIENT | SYS-AMALAYA → GAS-AMALAYA | api: Consume contrato autenticado del tablero. CTR-AMALAYA-CHINCHES-ESTADO registra la extensión propuesta. Identidad, token, roles, implementación y URL actuales se conservan. | codigo | [amalaya-board/apps-script/Code.gs](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/apps-script/Code.gs) — Contratos de chinches existentes y extensión de estado propuesta. |
| CON-AMALAYA-STORE | GAS-AMALAYA → SHEET-AMALAYA | persistencia: Conserva chinches y su historial. CTR-AMALAYA-CHINCHES-ESTADO registra la extensión propuesta. Identidad, token, roles, implementación y URL actuales se conservan. | codigo | [amalaya-board/apps-script/Code.gs](https://github.com/yodesarrollo/amalaya-board/blob/a3cf36f508015d288a04288fef040130f30ec3b7/apps-script/Code.gs) — Contratos de chinches existentes y extensión de estado propuesta. |
| CON-DESPACHO-CORCHO-STORE | GAS-OPERACION → STORE-DESPACHO-CORCHO | persistencia: Futuro Ops: mismo almacén Corcho tras identificar proyecto. CTR-DESPACHO-CORCHO; futuro adapter en GAS-OPERACION. Sólo cambiar endpoint/adapter, sin mover ni recrear Sheet, notas, ejes o versiones; nunca dos escritores con locks independientes. | propuesto | CHG-DESPACHO-CORCHO-PROVISIONAL-035: Migración futura condicionada a identificar editor/implementación Ops y validar el mismo principal, ACL y contrato; conservar archivo e IDs. |
| CON-EMD-GITHUB-EMBED | SYS-YOD-OS → SYS-EMD | embed: Wrapper EMD en dominio GitHub propio; legado compatible. CTR-EMD-GITHUB-EMBED: wrapper top GitHub y handshake nonce/ready con origen exacto antes de arranque; RPC y datos permanecen en Google. | propuesto | Propietario confirma Pages main/raíz y ruta canónica /yod-portal/emd/; wrapper pendiente en PR separado, no evidencia de despliegue. |
| CON-DESPACHO-CORCHO-PORTERO | SYS-DESPACHO → GAS-PORTERO | api: Provisional: sólo corchoGet/corchoSave. POST text/plain; {action,k} para corchoGet y {action,k,version,data} para corchoSave. CTR-DESPACHO-CORCHO; URL Portero conocida actual, sin fallback de servidor ni desvío de getAll/update. | propuesto | CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. |
| CON-PORTERO-CORCHO-STORE | GAS-PORTERO → STORE-DESPACHO-CORCHO | persistencia: Provisional: CAS en Mi Corcho privado. CTR-DESPACHO-CORCHO; canjearLigaLento_(key,'DP') local fresco, owner exacto, principal efectivo y ACL Drive exhaustiva, LockService, CAS global y ACK con snapshot; no renovar/cache ni publicar notas. | propuesto | CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. |
| CON-PORTERO-CORCHO-DRIVE | GAS-PORTERO → EXT-DRIVE | autorizacion: Corcho: principal y ACL completos por GET. Drive full guard en cada operación: about.user del token de ejecución, propietario único exacto, archivo y todos los ancestros hasta raíz, permissions.list paginado incluidos permisos publicados; scopes Drive existentes completos, fail-closed sin fallback. | propuesto | CHG-DESPACHO-CORCHO-PROVISIONAL-035: Integración provisional autorizada, pendiente en PR consumidores; preflight V57 no acredita despliegue del adapter. |
