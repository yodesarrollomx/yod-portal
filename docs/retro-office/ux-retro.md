# Oficina retro · especificación UX propuesta

Estado: propuesta de diseño, no implementación ni verificación en producción. Alcance: representar la misma oficina YOD con estética Game Boy Color, conservar sus 13 lugares de navegación y sus funcionalidades, selección autorizada, permisos y backend existentes. No convertir puestos preparados en tareas activas ni atribuir actividad a un caso sin observación confirmada. La implementación y su impacto arquitectónico se registrarán y verificarán por separado.

## La oficina y sus destinos

La fuente de los 13 lugares es `despacho3d/office-layout.mjs`. Mantener sus identificadores y relación espacial en un plano legible: `editing` Sala de edición; `editorial` Mesa editorial; `funnel` Embudo comercial; `entry` Entrada al Despacho; `library` Biblioteca del proyecto; `reception` Recepción; `patio` Patio central; `potential` Potenciales; `case` Puesto del proyecto; `projects` Proyectos y permisos; `delivery` Obra y ventas; `decisions` Decisiones; `lounge` Sala de encuentro. Trece destinos no significa trece puestos de trabajo ni trece pantallas operativas.

El ala de edición, la recepción, el patio central, los tres estudios, la sala y las circulaciones deben seguir siendo reconocibles como la misma oficina. El puesto del proyecto y sus autónomos siguen asociados al caso autorizado; no asignar nombres ni actividad ficticios a los demás muebles. Usar los datos y geometría vigentes como referencia, no este documento como catálogo duplicado.

## Recorrido y controles

- Al entrar, presentar la oficina completa con orientación visible y una barra DOM con Áreas, proyecto seleccionado, Plano y estado y Ayuda. Ofrecer la grabación de reunión existente donde corresponda; no abrirla automáticamente.
- Áreas enumera los 13 destinos por nombre. Elegir uno sitúa la vista inmediatamente, sin recorrido obligatorio, y ofrece su ficha o acción disponible. Un toque o clic sobre un lugar hace lo mismo. Diferenciar visualmente selección de apertura: navegar no inicia trabajo ni micrófono.
- Tacto: botones de al menos 44 × 44 CSS px; arrastrar para desplazar el plano y pellizcar para acercar, sin interferir con controles ni scroll del panel. Mantener acceso directo por lista cuando un punto sea pequeño o quede fuera de vista. No exigir gesto preciso ni mantener pulsado.
- Teclado: Tab y Shift+Tab recorren controles DOM con foco visible; Enter/Espacio activan; Escape cierra el panel superior y devuelve foco al disparador. Flechas pueden desplazar el plano cuando éste tiene foco, sin capturar teclas dentro de formularios. La lista da acceso a cada destino sin caminar. No depender de E, WASD ni de proximidad para abrirlo.
- Abrir una ficha en panel DOM real, con título, contenido seleccionable, enlaces y cierre explícito. En modalidad de diálogo, confinar foco y dejar inerte el fondo; al cerrar, restaurar foco. El plano y sus controles deben seguir disponibles si falla el render gráfico.

## Fichas y rutas existentes

`office-panels.mjs` define fichas locales de recepción, patio, potenciales, proyectos, entrega, encuentro y edición. Edición enlaza a `sala.html`; mesa editorial a `sala.html#editorial`; embudo a `sala.html#comercial`. Estas rutas son navegación existente, no demostración de datos vivos. Proyectos y permisos y Obra y ventas se describen como áreas preparadas; MOAC no carga tareas en esas fichas. Los demás lugares sin ficha específica conservan la ficha genérica existente.

`office-destination.mjs` requiere selección autorizada vigente para `case`, `computer`, `library` y `decisions`: el puesto abre el menú del caso; computadora, biblioteca y decisiones encaminan respectivamente a PPP, actividad y reunión de ese caso. Revalidar selección al abrir y después de operaciones asíncronas; si cambió o dejó de estar autorizada, no abrir contenido anterior. No sustituir los destinos por pantallas inventadas ni cambiar sus contratos.

## Caso y estados

Mostrar únicamente los perfiles de caso autorizados del catálogo vigente. El selector nombra cada caso, indica el seleccionado sin depender sólo del color y muestra «Validando el proyecto…» durante la selección. Deshabilitar aperturas dependientes mientras se confirma. Sin sesión, invitar a entrar en YOD OS; sin casos, mostrar el estado vacío que corresponda; si falla la validación, ofrecer reintento sin exhibir datos de otro caso. Una selección retirada durante la espera cancela la apertura.

La entrada distingue preparación, reconexión, selección requerida, acceso no autorizado y puesto abriéndose. La actividad y ubicación del autón se muestran sólo desde observaciones vigentes y confirmadas; cuando falten, indicar «Sin actividad confirmada» o «Sin ubicación activa confirmada». Diferenciar preparación, trabajo, bloqueo y preparado para revisión según los estados que realmente entregue el sistema; preparado para revisión no es aprobación. Abrir o cerrar un panel no inicia ni reanuda tareas. Conservar los controles existentes de hablar, escribir, biblioteca y puesto cuando estén disponibles; hablar sólo con permiso y acción correspondientes. Pausar sonido no equivale a colgar.

## Lenguaje visual y pantallas

Crear pixel art original inspirado en la consola, sin copiar personajes, logotipos ni assets comerciales. Cuadrícula y contornos nítidos, paleta limitada de verdes, crema y acentos cálidos con contraste suficiente, muebles y plantas reconocibles, animaciones discretas y sin parpadeos. El arte da contexto; nombres, cifras, estado y acciones se renderizan como texto DOM escalable, no incrustado en sprites. No sacrificar legibilidad por simular resolución baja.

- **Móvil vertical:** oficina encuadrada con acceso a Áreas y caso siempre alcanzable; panel desde abajo o pantalla completa con desplazamiento propio, cierre visible y respeto de zonas seguras. Evitar scroll horizontal de texto.
- **Móvil horizontal:** preservar altura útil; barra compacta y panel lateral desplazable, sin tapar cierre ni acciones. Al girar conservar destino, caso, panel y foco cuando sea posible.
- **Escritorio:** plano centrado y panel lateral o diálogo con ancho de lectura cómodo; lista y navegación por teclado completas. En zoom del navegador y texto ampliado, permitir reflujo en lugar de recortar.

Usar contraste mínimo WCAG AA para texto y controles, etiquetas accesibles, estados anunciados con `role=status`/región viva sin anuncios repetitivos, foco visible y nombres equivalentes para iconos. Con `prefers-reduced-motion: reduce`, cambios de lugar instantáneos, sin desplazamiento automático ni animación decorativa; conservar toda funcionalidad. No depender sólo de color, sonido o movimiento. Las áreas interactivas del arte tienen controles DOM equivalentes.

## Recursos originales por dibujar

Plano modular de suelo, paredes, puertas y circulación; patio con olivo y vegetación; recepción y marca autorizada; seis escritorios de los tres estudios y tres del ala editorial conforme a `scene.js`; mesa editorial y pantallas, mesa de decisiones, biblioteca y sala de encuentro; sillas y monitores; autón y visitantes genéricos con estados mínimos, sin identificar personas reales; indicadores de selección y foco; iconos originales de Áreas, ayuda, caso, cerrar y acciones disponibles. Exportar por capas con escala entera y alternativas textuales; no dibujar datos de clientes ni texto operativo en el arte. La cantidad de muebles se verificará contra la escena vigente al producirlos.

## Aceptación para la implementación futura

1. En móvil vertical, horizontal y escritorio, cada uno de los 13 IDs se localiza por nombre y se selecciona directamente por tacto y teclado sin caminar; la vista conserva una orientación reconocible.
2. Cada ficha y enlace coincide con la ruta y capacidad existente; áreas preparadas no muestran tareas o métricas inventadas. Caso, PPP, actividad y reunión no abren sin selección autorizada y vigente.
3. Probar con catálogo sintético: carga, vacío, selección, validación, fallo, reintento, cambio o retiro de caso durante espera y reconexión. Nunca aparece ni se abre información de una selección anterior.
4. Con teclado y lector de pantalla: orden de foco, nombre de controles, anuncio de estado, diálogo, cierre por Escape y retorno de foco; equivalencia de todas las acciones gráficas. Contraste AA, objetivos táctiles y texto ampliado sin recorte; probar reducción de movimiento.
5. Comprobar giro de dispositivo, scroll y zoom, además de caída del render gráfico: el plano/lista y los paneles DOM siguen operables. Confirmar que abrir una ficha no inicia actividad ni micrófono y que la pausa de sonido no termina la llamada.
6. Usar dobles y datos sintéticos para pruebas; no llamar endpoints de negocio para probar escrituras. Ejecutar las verificaciones requeridas por `AGENTS.md` al cambiar el portal y registrar por separado código, pruebas y publicación.

Fuentes inspeccionadas: `despacho3d/index.html`, `office-layout.mjs`, `office-panels.mjs`, `office-destination.mjs`, `office-accessible.mjs`, `office-entry.mjs`, `office.js`, `scene.js` y `station-ownership.mjs`. Son evidencia del código de este checkout, no del despliegue activo.
