# Documento de Requisitos

## Introducción

Este documento define las mejoras interactivas y visuales de la landing de Kandace/Kanny. Las mejoras formalizan el despertar inicial de Kanny y su continuidad visual hacia el companion flotante, amplían la narrativa de las tarjetas, diferencian visualmente Methodology y FAQ, reorganizan “Una experiencia, dos perspectivas” y refuerzan Our Promise con señales de confianza verificables. La experiencia debe conservar la filosofía Calm Tech, el rol de Kanny como companion, las animaciones GSAP y el sistema de partículas existentes, sin comprometer accesibilidad, adaptabilidad, estabilidad ni rendimiento.

## Glosario

- **Landing_Interactiva**: Landing pública de Kandace/Kanny que integra contenido, navegación, animaciones, partículas y el companion Kanny.
- **Calm_Tech**: Principio de diseño que reduce estímulos agresivos y favorece interacciones visuales discretas, comprensibles y no intrusivas.
- **Tarjeta_Interactiva**: Superficie de contenido que responde al foco de teclado o a un dispositivo apuntador mediante elevación y realce visual.
- **Realce_Visual**: Combinación perceptible de borde iluminado y sombra alrededor de una Tarjeta_Interactiva.
- **Methodology**: Sección que explica cómo Kanny interpreta señales de interacción y ofrece intervenciones de bienestar digital.
- **FAQ**: Sección de preguntas frecuentes con controles expandibles.
- **Seccion_Dos_Perspectivas**: Sección titulada “Una experiencia, dos perspectivas”, compuesta por una narrativa para empleados y otra para RRHH.
- **Tarjeta_Empleados**: Tarjeta de la Seccion_Dos_Perspectivas que presenta beneficios para empleados.
- **Tarjeta_RRHH**: Tarjeta de la Seccion_Dos_Perspectivas que presenta información para responsables de recursos humanos.
- **Representacion_Kanny**: Elemento visual de Kanny usado como contrapunto narrativo dentro de una fila.
- **Our_Promise**: Sección que comunica compromisos de privacidad, tratamiento de datos y marcos normativos aplicables.
- **Collage_de_Confianza**: Composición visual de señales genéricas, marcos de referencia u organizaciones cuya relación con Kandace/Kanny puede comunicarse con evidencia verificable.
- **Afirmacion_Verificable**: Mensaje sobre privacidad, cumplimiento, relación comercial o certificación respaldado por evidencia documental disponible.
- **Particulas_Ambientales**: Elementos visuales animados de fondo que aportan profundidad sin constituir controles interactivos.
- **Companion_Kanny**: Representación flotante de Kanny que acompaña el recorrido de la Landing_Interactiva.
- **Overlay_de_Despertar**: Capa inicial de pantalla completa que presenta a Kanny antes de habilitar visualmente la Landing_Interactiva.
- **Kanny_Inicial**: Representación grande de Kanny dentro del Overlay_de_Despertar y único propietario visual y semántico del personaje durante el despertar.
- **Estado_Dormido**: Estado inicial del Kanny_Inicial con ojos cerrados y sin halo cian activo.
- **Estado_Despierto**: Estado del Kanny_Inicial con ojos abiertos y halo cian perceptible.
- **Transicion_de_Acoplamiento**: Handoff visual coordinado en el que el Kanny_Inicial se desplaza y reduce hacia la posición del Companion_Kanny mientras desaparece el Overlay_de_Despertar, sin salto ni duplicación visible.
- **GSAP**: Sistema de animación existente que coordina movimientos vinculados al desplazamiento.
- **Animacion_de_Entrada**: Transición de aparición activada cuando un bloque entra en el área visible durante el desplazamiento.
- **Movimiento_Reducido**: Preferencia del sistema operativo `prefers-reduced-motion: reduce` que solicita minimizar animaciones no esenciales.
- **Vista_Amplia**: Área de visualización con ancho igual o superior a 768 píxeles.
- **Vista_Estrecha**: Área de visualización con ancho inferior a 768 píxeles.
- **Contenido_Interactivo**: Enlaces, botones, controles expandibles y cualquier elemento que recibe interacción del usuario.
- **LCP**: Métrica Largest Contentful Paint medida por Lighthouse para el contenido principal visible.
- **CLS**: Métrica Cumulative Layout Shift medida por Lighthouse para cambios inesperados de diseño.

## Requisitos

### Requisito 1: Interacción enriquecida de tarjetas

**Historia de usuario:** Como visitante, quiero recibir una respuesta visual clara al explorar las tarjetas, para reconocer el contenido activo sin romper la sensación de calma.

#### Criterios de aceptación

1. WHEN un dispositivo apuntador activa una Tarjeta_Interactiva, THE Landing_Interactiva SHALL aplicar elevación y Realce_Visual a la Tarjeta_Interactiva activa.
2. WHEN una Tarjeta_Interactiva recibe foco de teclado, THE Landing_Interactiva SHALL presentar un Realce_Visual perceptible equivalente al estado activado por dispositivo apuntador.
3. WHEN una Tarjeta_Interactiva pierde foco o deja de estar activada por un dispositivo apuntador, THE Landing_Interactiva SHALL restaurar el estado visual base de la Tarjeta_Interactiva.
4. WHILE una Tarjeta_Interactiva presenta Realce_Visual, THE Landing_Interactiva SHALL mantener legibles el texto y los iconos de la Tarjeta_Interactiva con una relación de contraste mínima de 4.5:1 para texto normal y 3:1 para texto grande o componentes gráficos esenciales.
5. WHILE una Tarjeta_Interactiva cambia de estado visual, THE Landing_Interactiva SHALL conservar la posición de las Tarjetas_Interactivas adyacentes sin desplazamientos de diseño.

### Requisito 2: Separación visual de Methodology

**Historia de usuario:** Como visitante, quiero distinguir Methodology del resto del recorrido, para comprender el cambio de contexto narrativo.

#### Criterios de aceptación

1. THE Landing_Interactiva SHALL presentar Methodology sobre un fondo negro visualmente diferenciable de las secciones adyacentes.
2. WHILE Methodology está visible, THE Landing_Interactiva SHALL mostrar Particulas_Ambientales dentro de los límites visuales de Methodology.
3. WHILE Methodology está visible, THE Landing_Interactiva SHALL mantener una relación de contraste mínima de 4.5:1 para texto normal y 3:1 para texto grande.
4. WHILE las Particulas_Ambientales de Methodology están activas, THE Landing_Interactiva SHALL mantener accesible todo el Contenido_Interactivo de Methodology mediante dispositivo apuntador y teclado.
5. WHEN Methodology entra en el área visible, THE Landing_Interactiva SHALL conservar el contenido y la función explicativa existentes de Methodology.

### Requisito 3: Narrativa alternada de dos perspectivas

**Historia de usuario:** Como visitante, quiero recorrer las perspectivas de empleados y RRHH en una composición alternada, para relacionar cada audiencia con el acompañamiento de Kanny.

#### Criterios de aceptación

1. WHILE la Seccion_Dos_Perspectivas se muestra en Vista_Amplia, THE Landing_Interactiva SHALL presentar la Tarjeta_Empleados a la izquierda y una Representacion_Kanny a la derecha en la primera fila.
2. WHILE la Seccion_Dos_Perspectivas se muestra en Vista_Amplia, THE Landing_Interactiva SHALL presentar una Representacion_Kanny a la izquierda y la Tarjeta_RRHH a la derecha en la segunda fila.
3. WHILE la Seccion_Dos_Perspectivas se muestra en Vista_Estrecha, THE Landing_Interactiva SHALL apilar cada tarjeta y la Representacion_Kanny asociada en una sola columna sin desplazamiento horizontal de la página.
4. WHEN una fila de la Seccion_Dos_Perspectivas entra por primera vez en el área visible, THE Landing_Interactiva SHALL ejecutar una Animacion_de_Entrada para la tarjeta y la Representacion_Kanny de la fila.
5. WHILE la Seccion_Dos_Perspectivas se muestra en Vista_Estrecha, THE Landing_Interactiva SHALL conservar el orden narrativo Tarjeta_Empleados, Representacion_Kanny asociada, Representacion_Kanny asociada a RRHH y Tarjeta_RRHH.
6. THE Landing_Interactiva SHALL identificar mediante texto visible las audiencias “Para empleados” y “Para RRHH”.

### Requisito 4: Our Promise y señales de confianza

**Historia de usuario:** Como visitante, quiero comprender los compromisos de privacidad y sus referencias, para evaluar la propuesta sin afirmaciones engañosas.

#### Criterios de aceptación

1. THE Landing_Interactiva SHALL incorporar un Collage_de_Confianza dentro de Our_Promise.
2. WHEN el Collage_de_Confianza menciona una organización, certificación, cliente o relación comercial, THE Landing_Interactiva SHALL mostrar únicamente una Afirmacion_Verificable respaldada por evidencia documental disponible.
3. IF no existe evidencia documental para una certificación, cliente o relación comercial, THEN THE Landing_Interactiva SHALL presentar señales genéricas de confianza o marcos aplicables sin atribuir certificación, aval, adopción ni relación comercial.
4. WHEN Our_Promise menciona un marco normativo o legal, THE Landing_Interactiva SHALL describir el marco como referencia aplicable o principio de diseño sin declarar cumplimiento certificado salvo que exista evidencia documental disponible.
5. WHEN Our_Promise comunica una práctica de privacidad, THE Landing_Interactiva SHALL formular la práctica mediante una descripción verificable del tratamiento, almacenamiento o transmisión de datos.
6. THE Landing_Interactiva SHALL proporcionar un nombre de texto accesible para cada elemento informativo del Collage_de_Confianza.
7. WHILE el Collage_de_Confianza se muestra en Vista_Estrecha, THE Landing_Interactiva SHALL ajustar la composición sin superponer señales, textos ni Contenido_Interactivo.

### Requisito 5: Separación visual de FAQ

**Historia de usuario:** Como visitante, quiero distinguir FAQ como un bloque de consulta, para localizar y revisar respuestas con facilidad.

#### Criterios de aceptación

1. THE Landing_Interactiva SHALL presentar FAQ sobre un fondo negro visualmente diferenciable de las secciones adyacentes.
2. WHILE FAQ está visible, THE Landing_Interactiva SHALL mostrar Particulas_Ambientales dentro de los límites visuales de FAQ.
3. WHILE las Particulas_Ambientales de FAQ están activas, THE Landing_Interactiva SHALL mantener operables mediante teclado y dispositivo apuntador todos los controles expandibles de FAQ.
4. WHEN un control expandible de FAQ cambia de estado, THE Landing_Interactiva SHALL exponer el estado expandido o contraído mediante un atributo accesible programáticamente determinable.
5. WHILE FAQ está visible, THE Landing_Interactiva SHALL mantener una relación de contraste mínima de 4.5:1 para texto normal y 3:1 para texto grande.

### Requisito 6: Accesibilidad y preferencia de movimiento

**Historia de usuario:** Como visitante con necesidades de accesibilidad, quiero navegar y comprender las mejoras sin depender del movimiento o del dispositivo apuntador, para usar la landing según mis preferencias.

#### Criterios de aceptación

1. WHILE Movimiento_Reducido está activo, THE Landing_Interactiva SHALL sustituir las Animaciones_de_Entrada, el movimiento decorativo de tarjetas y el movimiento de Particulas_Ambientales por estados estáticos sin pérdida de contenido.
2. WHILE Movimiento_Reducido está activo, THE Landing_Interactiva SHALL mantener visible el Companion_Kanny sin desplazamientos vinculados al scroll.
3. WHEN un visitante navega mediante teclado, THE Landing_Interactiva SHALL mostrar un indicador de foco visible en cada elemento de Contenido_Interactivo.
4. THE Landing_Interactiva SHALL conservar una estructura de encabezados con orden jerárquico programáticamente determinable en las secciones modificadas.
5. THE Landing_Interactiva SHALL proporcionar alternativas textuales para las imágenes informativas.
6. THE Landing_Interactiva SHALL ocultar de la accesibilidad las Particulas_Ambientales y decoraciones sin significado.
7. WHILE las Particulas_Ambientales están activas, THE Landing_Interactiva SHALL mantener las Particulas_Ambientales fuera del orden de foco.

### Requisito 7: Adaptabilidad y continuidad visual

**Historia de usuario:** Como visitante, quiero una experiencia coherente en distintos tamaños de pantalla, para acceder al contenido sin pérdida funcional.

#### Criterios de aceptación

1. WHILE el ancho del área de visualización está entre 320 y 767 píxeles, THE Landing_Interactiva SHALL presentar las secciones modificadas sin desplazamiento horizontal de la página.
2. WHILE el ancho del área de visualización es igual o superior a 768 píxeles, THE Landing_Interactiva SHALL conservar la composición alternada definida para la Seccion_Dos_Perspectivas.
3. THE Landing_Interactiva SHALL conservar la paleta oscura, los acentos cian, las superficies translúcidas y la jerarquía tipográfica asociadas con Calm_Tech.
4. THE Landing_Interactiva SHALL conservar el Companion_Kanny como elemento de acompañamiento del recorrido.
5. THE Landing_Interactiva SHALL conservar las transiciones existentes coordinadas mediante GSAP en los puntos del recorrido que no entren en conflicto con Movimiento_Reducido.
6. THE Landing_Interactiva SHALL conservar las Particulas_Ambientales existentes fuera de Methodology y FAQ sin duplicar controles ni contenido semántico.

### Requisito 8: Rendimiento y estabilidad

**Historia de usuario:** Como visitante, quiero que las mejoras mantengan una carga y un desplazamiento fluidos, para recorrer la landing sin degradación perceptible.

#### Criterios de aceptación

1. WHEN una sección con Particulas_Ambientales queda fuera del área visible, THE Landing_Interactiva SHALL pausar la animación de partículas de la sección.
2. WHILE la pestaña del navegador permanece oculta, THE Landing_Interactiva SHALL pausar el movimiento de Particulas_Ambientales.
3. WHEN la Landing_Interactiva se evalúa con Lighthouse en modo móvil y una compilación de producción, THE Landing_Interactiva SHALL obtener una puntuación de rendimiento mínima de 80.
4. WHEN la Landing_Interactiva se evalúa con Lighthouse en modo móvil y una compilación de producción, THE Landing_Interactiva SHALL registrar un LCP máximo de 2.5 segundos.
5. WHEN la Landing_Interactiva se evalúa con Lighthouse en modo móvil y una compilación de producción, THE Landing_Interactiva SHALL registrar un CLS máximo de 0.1.
6. WHILE la Animacion_de_Entrada está activa, THE Landing_Interactiva SHALL conservar las dimensiones reservadas para tarjetas, representaciones de Kanny y Collage_de_Confianza.
7. IF una capacidad de animación o partículas no está disponible en el navegador, THEN THE Landing_Interactiva SHALL mostrar todo el contenido mediante una presentación estática funcional.

### Requisito 9: Despertar inicial y continuidad hacia el companion

**Historia de usuario:** Como visitante que inicia la página, quiero conocer a Kanny mediante un despertar claro y continuo, para comprender su rol de companion sin saltos visuales, estímulos innecesarios ni barreras de acceso.

#### Criterios de aceptación

1. WHEN la Landing_Interactiva inicia, THE Landing_Interactiva SHALL presentar el Overlay_de_Despertar fijo, cubriendo el ancho y alto completos del viewport, con el centro geométrico del Kanny_Inicial alineado con el centro geométrico del viewport.
2. WHILE el Overlay_de_Despertar está visible, THE Landing_Interactiva SHALL mostrar el Kanny_Inicial a una escala grande responsive, mayor que la escala final del Companion_Kanny, completamente contenido y sin recorte para viewports desde 320 píxeles de ancho y 568 píxeles de alto.
3. WHEN el Overlay_de_Despertar aparece por primera vez, THE Landing_Interactiva SHALL presentar el Kanny_Inicial en Estado_Dormido.
4. WHEN el visitante activa el control de despertar mediante clic, Enter o Espacio antes de que transcurran 2 segundos, THE Landing_Interactiva SHALL cambiar una sola vez el Kanny_Inicial a Estado_Despierto y cancelar el despertar automático pendiente.
5. IF el visitante no ha activado el control de despertar, THEN THE Landing_Interactiva SHALL cambiar automáticamente el Kanny_Inicial a Estado_Despierto al cumplirse 2 segundos desde el montaje del Overlay_de_Despertar.
6. WHEN el Kanny_Inicial cambia a Estado_Despierto, THE Landing_Interactiva SHALL mostrar sus ojos abiertos y un halo cian perceptible antes de iniciar la Transicion_de_Acoplamiento.
7. WHEN inicia la Transicion_de_Acoplamiento, THE Landing_Interactiva SHALL transformar y reducir visualmente el Kanny_Inicial desde su centro hasta la posición y escala reservadas para el Companion_Kanny mientras desvanece el Overlay_de_Despertar, sin salto brusco y sin mostrar dos representaciones perceptiblemente simultáneas de Kanny.
8. WHEN finaliza la Transicion_de_Acoplamiento, THE Landing_Interactiva SHALL retirar el Overlay_de_Despertar de la interacción y del árbol accesible, y SHALL mostrar el Companion_Kanny exactamente en el estado visual final alcanzado por el Kanny_Inicial.
9. WHILE Movimiento_Reducido está activo, THE Landing_Interactiva SHALL conservar Estado_Dormido, los disparadores por activación y por 2 segundos y Estado_Despierto, pero SHALL reemplazar la trayectoria, reducción, pulso y animación continua por un traspaso inmediato o un fundido breve sin desplazamiento.
10. WHILE el Overlay_de_Despertar está activo, THE Landing_Interactiva SHALL exponer un único control de despertar con nombre accesible, operable mediante clic, Enter y Espacio, SHALL mantener el contenido de fondo fuera del orden de interacción y SHALL transferir el foco a una ubicación lógica de la Landing_Interactiva al finalizar.
11. WHILE el Overlay_de_Despertar y la Transicion_de_Acoplamiento se ejecutan, THE Landing_Interactiva SHALL mantener el Overlay_de_Despertar fuera del flujo del documento, reservar las dimensiones y posición final del Companion_Kanny y no provocar desplazamientos de layout del contenido principal ni exceder el objetivo global de CLS de 0.1.