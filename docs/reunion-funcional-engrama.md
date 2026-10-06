# Transcripción simulada de reunión funcional - Engrama

## Contexto de la reunión

**Proyecto:** Engrama  
**Tipo de producto:** aplicación web de estudio con flashcards, repetición espaciada, progresión por ELO y soporte offline.  
**Objetivo de esta reunión:** explicar al equipo de desarrollo qué se quiere construir, qué comportamientos son importantes, qué ya se considera valioso del producto actual y qué criterios deberían guiar una reconstrucción, mejora o corrección del proyecto.

## Participantes simulados

- **Funcional / Producto:** responsable de explicar necesidades, intención de uso y prioridades.
- **Desarrollador 1:** enfocado en arquitectura frontend y experiencia de usuario.
- **Desarrollador 2:** enfocado en dominio, persistencia y algoritmos.
- **QA / Validación:** enfocado en casos de prueba, regresiones y comportamiento en móvil.

---

## Transcripción

### 1. Visión general

**Funcional:**  
Quiero que Engrama sea una aplicación sencilla para estudiar a diario, pero que tenga más intención que una lista de tarjetas. El usuario no debería tener que organizar manualmente qué estudiar cada día. La aplicación debe decidir qué toca repasar, cuándo volver a mostrarlo y qué contenido nuevo se puede desbloquear según el nivel del estudiante.

La idea central es que el aprendizaje deje una huella. Cada "Engrama" es un contexto independiente de aprendizaje: Go, astrofísica, sesgos cognitivos, Spring Boot, crianza, idiomas o cualquier otro tema. Cada Engrama tiene sus propias tarjetas, su propio progreso, su propio ELO y su propio historial.

**Desarrollador 1:**  
¿Entonces la pantalla inicial no debería ser una landing, sino una app directa?

**Funcional:**  
Exacto. Al abrir la app quiero ver si tengo algo pendiente y poder empezar. Si es la primera vez, quiero elegir o importar un Engrama. No quiero marketing dentro de la app. La prioridad es estudiar.

**QA:**  
¿Cuál sería el uso típico?

**Funcional:**  
Sesiones cortas, unas 10 tarjetas. Lo usaría a diario, probablemente en móvil, y me interesa que también lo puedan usar mis hijas. Debe funcionar sin cuenta, sin fricción y sin depender de conexión a internet.

---

### 2. Principios de producto

**Funcional:**  
Hay varios principios que no quiero perder:

1. **Local-first:** estudiar debe funcionar completamente en el navegador, sin backend obligatorio.
2. **Sesiones pequeñas:** la app no debe abrumar; una sesión normal tiene hasta 10 tarjetas.
3. **Progresión visible:** el usuario tiene ELO, rango y tarjetas que se desbloquean.
4. **Contenido importable:** quiero traer mazos desde Markdown, JSON, SGF y Anki `.apkg`.
5. **Móvil como caso principal:** muchas sesiones se harán en el teléfono.
6. **Sin perder progreso:** actualizar un mazo no debería borrar el historial si las tarjetas siguen siendo las mismas.
7. **Extensible por tipos de tarjeta:** básica, cloze, ocultación de imagen y tsumego no deben ser casos pegados con cinta, sino estrategias de renderizado.

**Desarrollador 2:**  
¿La aplicación tiene backend?

**Funcional:**  
Para estudiar, no. La app debe vivir en el navegador. Existe una línea de sincronización para clases, donde un profesor puede dar un código y recibir sesiones aprobadas, pero eso debe ser opcional. Si el backend no está disponible, el estudiante sigue estudiando offline.

---

### 3. Engramas y selección inicial

**Funcional:**  
Un Engrama es como un mazo o entorno de aprendizaje, pero quiero darle entidad propia. Cada Engrama tiene:

- nombre;
- descripción;
- base de datos aislada;
- progreso de estudio;
- ELO del usuario;
- historial de sesiones;
- ajustes propios, como margen ELO y fecha límite.

La primera vez que abres la app debe aparecer una pantalla para elegir Engrama. Puede haber mazos incluidos, demos e importación manual.

**Desarrollador 1:**  
¿Qué opciones debe tener esa pantalla?

**Funcional:**  
Debe permitir:

- instalar un mazo incluido;
- subir un archivo propio `.apkg`, `.md`, `.json` o `.sgf`;
- cargar demos para probar tipos de tarjeta;
- unirse a una clase mediante código;
- volver a un Engrama ya instalado;
- marcar visualmente cuál está activo y cuáles ya están instalados.

**QA:**  
¿Cambiar de Engrama mezcla tarjetas?

**Funcional:**  
No. Cada Engrama debe estar totalmente aislado. Cambiar de Engrama equivale a cambiar de contexto. El usuario puede tener Go, Spring Boot y Astrofísica instalados sin que se mezclen.

---

### 4. Pantalla de inicio

**Funcional:**  
La pantalla principal debe responder a una pregunta: "¿Qué tengo que estudiar ahora?".

Debe mostrar:

- selector del Engrama activo;
- rango actual del usuario;
- progreso visual dentro del rango;
- contador de tarjetas pendientes para hoy;
- contador de tarjetas nuevas;
- racha de días, si es suficientemente significativa;
- botón principal de estudio;
- pista de próxima revisión si no hay nada pendiente;
- fecha límite si hay una configurada;
- acceso a ajustes/estadísticas;
- cambio de tema claro/oscuro;
- filtro por tags cuando existan tags;
- botón para buscar actualización de PWA.

**Desarrollador 1:**  
¿Cómo debe cambiar el texto del botón de estudio?

**Funcional:**  
Debe tener un tono útil:

- si hay muchas pendientes, "Ponerse al día";
- si hay una sesión completa, "Estudiar";
- si quedan pocas y son nuevas, "Explorar";
- si son repasos, "Repasar";
- si no hay nada, "Al día por hoy".

**QA:**  
¿Qué pasa si no hay tarjetas?

**Funcional:**  
La app debe decirlo con claridad y llevar al usuario a importar o elegir contenido. No debe parecer rota.

---

### 5. Sesión de estudio

**Funcional:**  
La sesión es el corazón de la app. Quiero que sea limpia y centrada. Arriba debe haber salida y progreso. En el centro, la tarjeta. Abajo, los controles.

Para tarjetas normales:

1. se muestra la pregunta;
2. el usuario pulsa "Mostrar respuesta";
3. aparece la respuesta;
4. el usuario califica con cuatro botones:
   - Olvidada;
   - Difícil;
   - Buena;
   - Perfecta.

**Desarrollador 2:**  
¿Qué significan esas calificaciones?

**Funcional:**  
"Olvidada" significa que no la recuerda. "Difícil" significa que la recuerda con mucho esfuerzo. "Buena" significa que la recuerda razonablemente. "Perfecta" significa que la sabe sin dudar.

**Funcional:**  
También quiero atajos: espacio o enter para revelar, y teclas 1 a 4 para puntuar. Pero en móvil lo principal son botones grandes y cómodos.

**QA:**  
¿Hay que prevenir doble click?

**Funcional:**  
Sí. Es importante. Si el usuario toca dos veces rápido "Siguiente" o una calificación, no se deben procesar dos respuestas ni alterar dos veces el ELO. Tras el primer toque, los botones deben quedar bloqueados u ocultos durante la transición.

---

### 6. Repetición dentro de sesión

**Funcional:**  
Si una tarjeta se marca como Olvidada o Difícil, quiero que pueda volver a aparecer dentro de la misma sesión, no solo dentro de horas. La idea es darle al estudiante una segunda oportunidad inmediata.

**Desarrollador 2:**  
¿Cuántas veces puede reencolarse?

**Funcional:**  
Hasta dos veces dentro de la sesión. Si vuelve a fallar después de eso, ya se programa para más tarde. Y si una tarjeta olvidada era la última de la sesión, no quiero que se pierda el efecto de reintento: hay que validar ese caso con cuidado.

**QA:**  
¿El progreso de sesión se cuenta por respuestas o por tarjetas terminadas?

**Funcional:**  
Por tarjetas que ya no van a salir más en la sesión. Si una tarjeta se reencola, no debería dar sensación de progreso falso.

---

### 7. Algoritmo de scheduling

**Funcional:**  
La base debe ser SM2, pero adaptada a cuatro botones y al uso real.

Sin fecha límite:

- Olvidada: próxima revisión en unas 4 horas.
- Difícil: próxima revisión en unas 8 horas.
- Buena: próxima revisión mañana.
- Perfecta: próxima revisión mañana, pero con mejor crecimiento futuro.

Con fecha límite:

- Olvidada y Difícil deben programarse en función del tiempo restante.
- No quiero intervalos absurdamente largos cuando queda poco para un examen.
- Tampoco quiero intervalos ridículos de segundos; debe haber un mínimo razonable, por ejemplo 30 minutos.

**Desarrollador 2:**  
¿Buena y Perfecta siguen SM2 clásico?

**Funcional:**  
Sí. Primera repetición, 1 día; segunda, 6 días; a partir de ahí crece con easiness. Perfecta sube más el easiness, Buena lo sube poco, Difícil y Olvidada lo bajan.

---

### 8. Sistema ELO

**Funcional:**  
El ELO es una parte importante de la motivación. Cada usuario tiene un ELO dentro de cada Engrama y cada tarjeta tiene una dificultad ELO.

Cuando el usuario responde:

- si acierta una tarjeta difícil, sube más;
- si falla una tarjeta fácil, baja más;
- la tarjeta también cambia de dificultad en dirección opuesta;
- el ELO nunca debe caer por debajo de un mínimo técnico.

**Desarrollador 1:**  
¿Para qué se usa el ELO además de mostrarlo?

**Funcional:**  
Para desbloquear contenido. El usuario solo accede a tarjetas cuya dificultad esté dentro de una ventana: ELO del usuario más un margen configurable.

**QA:**  
¿El bloqueo es manual?

**Funcional:**  
No debería depender de desbloqueos manuales. Es dinámico: si tu ELO sube, ves tarjetas más difíciles. El margen por defecto puede ser 200, pero debe poder cambiarse desde ajustes si la configuración lo permite.

---

### 9. Rangos y motivación

**Funcional:**  
Quiero rangos visibles, tipo:

- Curioso;
- Aprendiz;
- Estudiante;
- Practicante;
- Conocedor;
- Experto;
- Maestro;
- Gran Maestro.

No hace falta que sea una gamificación pesada, pero sí una señal clara de avance. En la pantalla principal debe verse el rango y una barra de progreso hacia el siguiente.

**Desarrollador 1:**  
¿Debe haber una explicación de rangos?

**Funcional:**  
Sí, pero discreta. Por ejemplo, tooltip o desplegable al tocar el rango. No quiero una pantalla enorme solo para eso.

---

### 10. Tipos de tarjeta

**Funcional:**  
La arquitectura debe admitir varios tipos de tarjeta. Cada tipo sabe cómo mostrar pregunta, respuesta y controles.

Tipos mínimos:

1. **Básica:** pregunta y respuesta, con soporte de HTML sencillo e imágenes importadas.
2. **Cloze:** texto con huecos `{{c1::respuesta}}`, cada hueco como tarjeta separada.
3. **Ocultación de imagen:** una imagen con máscaras; en pregunta se oculta una zona y en respuesta se revela.
4. **Tsumego:** problema interactivo de Go con tablero jugable.

**Desarrollador 2:**  
¿El DOM debe tener frente y reverso separados?

**Funcional:**  
No necesariamente. En la implementación actual se reemplaza el contenido de pregunta por la respuesta al revelar. Lo importante es que el usuario lo perciba como una tarjeta clara.

**QA:**  
¿Si añadimos otro tipo en el futuro?

**Funcional:**  
Debe ser una estrategia nueva, no una cascada de `if` repartida por toda la UI.

---

### 11. Tarjetas básicas y cloze

**Funcional:**  
Las básicas son directas: pregunta visible, respuesta al revelar. Deben soportar texto con saltos de línea, algo de HTML procedente de Anki e imágenes.

Las cloze deben ocultar solo el hueco correspondiente. Si una nota tiene `c1`, `c2`, etc., deben generarse tarjetas separadas para cada índice. En pregunta se ve el hueco; en respuesta se ve el texto completo o el valor oculto destacado.

**QA:**  
¿Qué pasa si el campo está vacío?

**Funcional:**  
No debe romper la app. Puede mostrarse algo como "(sin texto)" al importar si no hay contenido útil.

---

### 12. Ocultación de imagen

**Funcional:**  
Quiero importar tarjetas de Image Occlusion desde Anki. Deben soportarse rectángulos, elipses y polígonos.

Puntos importantes:

- Las imágenes no deben guardarse en SQLite/localStorage si eso puede romper límites de tamaño.
- Las imágenes deben ir a IndexedDB.
- Las máscaras deben usar coordenadas normalizadas de 0 a 1.
- La superposición debe hacerse con SVG inline sobre la imagen.
- No se debe calcular posición con `getBoundingClientRect()` para las máscaras, porque animaciones o escalados pueden falsear medidas.

**Desarrollador 1:**  
¿Qué se muestra en la respuesta?

**Funcional:**  
La zona activa debe revelarse y puede mostrarse una etiqueta o texto extra si existe. El usuario debe entender qué estaba oculto.

---

### 13. Tsumego / Go interactivo

**Funcional:**  
Este es uno de los tipos más importantes. Quiero problemas de Go jugables, no una imagen estática.

En pregunta:

- se ve el tablero;
- se ve quién juega, negras o blancas;
- se puede tocar una intersección;
- la app responde automáticamente con la jugada del oponente si el SGF la define;
- no se muestran pistas, marcas ni comentarios que revelen la solución mientras se resuelve.

Cuando termina:

- se indica si fue correcto o incorrecto;
- se calcula una calificación automática;
- aparece modo revisión;
- se pueden navegar movimientos hacia atrás y adelante;
- se muestran comentarios, marcas y variantes.

**Desarrollador 2:**  
¿Cómo se decide la calificación automática?

**Funcional:**  
Si el movimiento es incorrecto, Olvidada. Si es correcto, depende del tiempo medio por movimiento: muy rápido Perfecta, razonable Buena, lento Difícil. Los umbrales actuales pueden ser 5 y 10 segundos.

**QA:**  
¿La primera variación es siempre correcta?

**Funcional:**  
Sí, esa es la convención de importación. La primera variación del SGF representa la solución correcta. El resto son alternativas incorrectas o ramas de revisión.

**Funcional:**  
El tablero debe aprovechar bien el espacio, sobre todo en móvil. Si el problema está en una esquina, se debe hacer zoom/crop a la zona relevante. Ese recorte debe considerar piedras iniciales, jugadas de todas las variaciones y marcas SGF, no solo la posición inicial.

**Desarrollador 1:**  
¿Qué marcas SGF debemos soportar?

**Funcional:**  
Al menos etiquetas `LB`, círculos `CR`, cuadrados `SQ`, triángulos `TR` y cruces `MA`. Deben verse en revisión y ocultarse durante resolución si pueden dar pistas.

---

### 14. Importación de contenido

**Funcional:**  
La importación es clave. Quiero que el usuario pueda empezar con contenido propio sin escribir código.

Formatos:

- Markdown propio;
- JSON;
- SGF para tsumegos;
- Anki `.apkg`.

**Desarrollador 2:**  
¿Qué debe soportar Markdown?

**Funcional:**  
Debe tener frontmatter con nombre, descripción y scheduler. Cada tarjeta se define con un `##` como pregunta y el contenido posterior como respuesta. Los metadatos pueden ir en comentarios HTML:

```markdown
<!-- tags:go,tsumego elo:1700 locked:true cardType:tsumego -->
```

También debe permitir bloques SGF para tarjetas de tsumego.

**Desarrollador 2:**  
¿Y Anki?

**Funcional:**  
Debe soportar Anki antiguo y moderno:

- `collection.anki2`;
- `collection.anki21`;
- `collection.anki21b`;
- compresión zstd en Anki 24.x;
- índice `media` en JSON antiguo y formato nuevo;
- medios comprimidos individualmente;
- `col.models`/`col.decks` y también tablas `notetypes`/`decks`.

Tipos a convertir:

- Basic;
- Basic and reversed;
- Cloze;
- Image Occlusion;
- Tsumego personalizado.

**QA:**  
¿Qué etiquetas especiales lee Anki?

**Funcional:**  
`elo:1600`, `locked`, `locked:true` y tags normales. Por defecto, ELO 1500 y desbloqueada.

---

### 15. Actualización de mazos sin perder progreso

**Funcional:**  
Este punto es importante. Si importo un archivo del mismo Engrama o misma colección, quiero sincronización inteligente:

- añadir tarjetas nuevas;
- eliminar tarjetas que ya no vienen en el archivo;
- conservar progreso, scheduler, ELO y estado de tarjetas existentes.

Si importo un Engrama diferente, entonces sí puede reemplazar todo el contenido activo.

**Desarrollador 2:**  
¿Cómo identificamos tarjetas existentes?

**Funcional:**  
La solución técnica puede variar, pero el requisito es no perder progreso al corregir un mazo. Si cambiamos una explicación o añadimos comentarios, el estudiante no debe volver a empezar de cero.

---

### 16. Tags y filtros

**Funcional:**  
Los tags sirven para estudiar subconjuntos del Engrama. En inicio debe haber un botón de tags si existen.

La interfaz que más me gusta es con pastillas:

- una pastilla "Todos";
- una pastilla por tag disponible;
- selección múltiple;
- modo OR si quiero tarjetas con cualquiera de los tags;
- modo AND si quiero tarjetas que tengan todos los tags.

**Desarrollador 1:**  
¿Dónde vive el filtro?

**Funcional:**  
En el Engrama activo. Si filtro Go por "esquina", no quiero que eso afecte a Astrofísica. Además, al re-renderizar la pantalla tras seleccionar tags, el panel puede quedarse abierto para que la interacción sea fluida.

---

### 17. Silenciar tarjetas

**Funcional:**  
Durante una sesión quiero poder silenciar una tarjeta. Me pasa con mazos importados: una tarjeta puede estar mal, no interesarme o estar fuera de nivel.

Comportamiento esperado:

- botón discreto de silenciar en la tarjeta;
- modal de confirmación;
- si confirmo, la tarjeta sale de la sesión actual;
- no vuelve a aparecer en futuras sesiones;
- no se registra como respuesta ni modifica ELO.

**QA:**  
¿Debe poder reactivarse?

**Funcional:**  
Sería interesante en el futuro, pero no es obligatorio para la primera versión. Lo importante ahora es poder apartarla.

---

### 18. Estadísticas y ajustes

**Funcional:**  
La pantalla de estadísticas debe servir para entender progreso y ajustar el Engrama.

Debe incluir:

- ELO actual;
- pendientes hoy;
- nuevas sin ver;
- total de tarjetas;
- tarjetas accesibles frente al total;
- hitos de desbloqueo por ELO;
- cuánto ELO falta para el siguiente grupo;
- margen de acceso ELO;
- fecha límite del temario;
- historial de sesiones;
- gráfico de evolución del ELO;
- resumen de sesiones recientes;
- resumen semanal cuando haya muchas sesiones;
- importación de archivos;
- exportación/restauración de base de datos si está habilitada;
- eliminación del Engrama activo;
- borrado total con confirmación clara.

**Desarrollador 1:**  
¿Debe poder ocultarse parte de la pantalla?

**Funcional:**  
Sí. Quiero un archivo `public/app-config.json` que permita cambiar comportamiento sin recompilar:

- título de la app;
- mostrar/ocultar descarga de base de datos;
- mostrar/ocultar ajuste de margen ELO;
- mostrar/ocultar tarjetas concretas de estadísticas.

Si falta el archivo o está mal, la app debe arrancar con valores por defecto.

---

### 19. Fecha límite

**Funcional:**  
La fecha límite representa un examen, entrega o día objetivo. Puede configurarse después de importar un mazo y también desde Estadísticas.

Efectos:

- se muestra una pista en inicio;
- afecta a intervalos cortos de Olvidada y Difícil;
- puede quitarse;
- no debe depender de que el ajuste de margen ELO esté visible.

**QA:**  
¿Debe obligarse a poner fecha?

**Funcional:**  
No. Debe sugerirse tras importar, pero el usuario puede omitirla.

---

### 20. Persistencia y datos

**Funcional:**  
Quiero que todo funcione en el navegador.

Requisitos:

- SQLite en cliente mediante sql.js;
- persistencia preferente en OPFS si está disponible;
- fallback a localStorage;
- una base por Engrama;
- imágenes fuera de SQLite, en IndexedDB;
- migraciones aditivas e idempotentes;
- botón para descargar `.db`;
- restaurar `.db` validando que sea SQLite;
- reset por Engrama;
- eliminar Engrama de registro local.

**Desarrollador 2:**  
¿Por qué una base por Engrama?

**Funcional:**  
Porque simplifica aislamiento, backup y borrado. Si una hija estudia un mazo y yo otro, no quiero mezclar avances.

---

### 21. PWA y actualizaciones

**Funcional:**  
La app debe poder instalarse como PWA, especialmente en móvil. Tiene que funcionar offline una vez cargada.

Problemas a cuidar:

- iOS a veces mantiene versiones antiguas;
- debe haber un botón de "buscar actualización";
- si hay una versión nueva, la app debe intentar recargar;
- si no hay service worker en desarrollo, debe decirlo de forma discreta;
- no debe dejar al usuario bloqueado por un fallo de actualización.

**QA:**  
¿Notificaciones?

**Funcional:**  
Pueden ser una evolución interesante, por ejemplo avisar de tarjetas pendientes, pero no lo considero imprescindible ahora.

---

### 22. Sincronización para clases

**Funcional:**  
Hay una idea de uso educativo: profesor crea un Engrama, da un código, el alumno se une, estudia offline y se sincronizan sesiones cuando esté aprobado.

Flujo:

1. alumno introduce código;
2. la app busca información del Engrama;
3. alumno introduce nombre y email opcional;
4. se registra un token de dispositivo;
5. el estado queda como pendiente, aprobado o rechazado;
6. se importa el mazo localmente;
7. al completar sesiones, se intentan sincronizar.

**Desarrollador 2:**  
¿Qué se envía al backend?

**Funcional:**  
Resumen de sesión: identificador, Engrama, inicio, fin, duración, ELO antes/después, tarjetas estudiadas y conteo de botones equivalentes a again/hard/good/easy.

**QA:**  
¿Y si no hay red?

**Funcional:**  
Se estudia igual. Las sesiones quedan sin sincronizar y se reintenta después. Si el profesor rechaza el acceso, se debe mostrar el estado, pero el estudio offline sigue disponible.

---

### 23. Diseño visual y UX

**Funcional:**  
La interfaz debe ser sobria, rápida y agradable. No quiero una app infantilizada, pero sí accesible para niñas y adultos. Tiene que sentirse limpia.

Puntos importantes:

- tema claro y oscuro;
- diseño responsive real;
- controles grandes en móvil;
- evitar scroll raro durante estudio;
- respetar safe area/notch en iOS;
- evitar saltos de layout cuando aparece ELO, comentarios o controles;
- en tsumego, maximizar tablero en móvil;
- no meter demasiada decoración;
- usar iconos claros para acciones;
- confirmar acciones destructivas.

**Desarrollador 1:**  
¿Hay algo especialmente sensible?

**Funcional:**  
Sí: la sesión de estudio. Los botones no deben moverse bruscamente, el tablero no debe cambiar de tamaño de forma molesta y el contenido no debe quedar tapado por barras inferiores en móvil.

---

### 24. Calidad y pruebas

**QA:**  
¿Qué flujos mínimos deben estar cubiertos?

**Funcional:**  
Unitarios:

- cálculo ELO;
- rangos;
- entidad FlashCard;
- StudySession y reencolado;
- SM2 y fechas de próxima revisión;
- parser Markdown;
- parser/importador Anki;
- dominio SGF;
- estrategias de renderizado.

E2E:

- primera pantalla y selección de Engrama;
- sesión de estudio completa;
- tsumego interactivo;
- filtro por tags;
- PWA y ajustes;
- programación SM2;
- intervalos cortos;
- multi-Engrama;
- fecha límite;
- tipos de tarjeta;
- importar `.apkg`.

**Funcional:**  
Además, cualquier cambio en StudyView, scheduling, importación Anki o tsumego debe tener validación cuidadosa. Son zonas con mucha interacción y riesgo de regresión.

---

### 25. Prioridades para reconstrucción o evolución

**Funcional:**  
Si tuviéramos que reconstruir el proyecto desde esta reunión, el orden sería:

1. Modelo local de Engramas, colecciones y tarjetas.
2. Persistencia local por Engrama.
3. Pantalla inicial y selección/importación básica.
4. Sesión de estudio con tarjetas básicas.
5. SM2, cuatro ratings y resumen de sesión.
6. ELO de usuario y tarjeta.
7. Desbloqueo por ELO y margen configurable.
8. Estadísticas e historial.
9. Tags OR/AND.
10. Importación Markdown.
11. Importación Anki.
12. Cloze e imagen occlusion.
13. Tsumego interactivo con SGF.
14. PWA/offline/actualizaciones.
15. Sincronización opcional para clases.

**Desarrollador 1:**  
¿Qué no debemos priorizar al principio?

**Funcional:**  
No empezaría por dashboards complejos, backend obligatorio, cuentas de usuario ni editor visual de mazos. Primero debe estudiar bien.

---

## Requisitos funcionales resumidos

### RF-01. Gestión de Engramas

La app debe permitir crear, instalar, seleccionar, cambiar y eliminar Engramas. Cada Engrama debe tener almacenamiento y progreso aislados.

### RF-02. Selección inicial

Si no hay Engrama activo, la app debe mostrar una pantalla para instalar mazos incluidos, cargar demos, importar archivos o unirse a una clase.

### RF-03. Sesiones de estudio

La app debe crear sesiones de hasta 10 tarjetas pendientes, priorizando repasos y después tarjetas nuevas, con orden aleatorio.

### RF-04. Ratings

Las tarjetas manuales deben calificarse con Olvidada, Difícil, Buena y Perfecta. Las tarjetas tsumego pueden generar calificación automática.

### RF-05. Reencolado

Las tarjetas con rating Olvidada o Difícil deben reencolarse dentro de la misma sesión hasta dos veces.

### RF-06. SM2

La app debe programar próximas revisiones mediante SM2 adaptado a cuatro ratings y soportar intervalos cortos para Olvidada/Difícil.

### RF-07. Fecha límite

La app debe permitir configurar una fecha límite por Engrama y usarla para ajustar intervalos cortos.

### RF-08. ELO

La app debe mantener ELO de usuario y dificultad ELO por tarjeta. Cada respuesta debe actualizar ambos.

### RF-09. Desbloqueo

La app solo debe seleccionar tarjetas con dificultad menor o igual que `ELO usuario + margen`. El margen debe ser configurable.

### RF-10. Rangos

La app debe mostrar rango actual y progreso hacia el siguiente rango.

### RF-11. Tipos de tarjeta

La app debe soportar tarjetas básicas, cloze, ocultación de imagen y tsumego mediante una arquitectura extensible por estrategia.

### RF-12. Tsumego

La app debe renderizar tableros de Go interactivos desde SGF, procesar movimientos, responder con variaciones, ocultar pistas durante resolución y permitir revisión posterior.

### RF-13. Tags

La app debe permitir filtrar sesiones por tags en modo OR y AND.

### RF-14. Silenciar tarjeta

La app debe permitir silenciar la tarjeta actual con confirmación, excluyéndola de futuras sesiones sin modificar ELO.

### RF-15. Estadísticas

La app debe mostrar métricas de progreso, historial de sesiones, evolución ELO, desbloqueos y ajustes del Engrama.

### RF-16. Importación

La app debe importar mazos desde Markdown, JSON, SGF y Anki `.apkg`, incluyendo Anki moderno con zstd y medios.

### RF-17. Actualización de mazos

La app debe preservar progreso al actualizar contenido del mismo Engrama cuando sea posible.

### RF-18. Backup y restauración

La app debe permitir descargar y restaurar la base de datos SQLite, validando el formato.

### RF-19. Configuración externa

La app debe cargar `public/app-config.json` y aplicar valores por defecto si falta o falla.

### RF-20. Sincronización opcional

La app debe permitir unirse a una clase con código y sincronizar resúmenes de sesiones si el alumno está aprobado.

---

## Requisitos no funcionales

- La app debe funcionar offline para estudiar.
- No debe requerir login para uso personal.
- Debe funcionar bien en móvil.
- Debe tener tema claro y oscuro.
- Debe evitar pérdida de datos entre sesiones.
- Debe tolerar fallos de configuración externa.
- Debe tolerar fallos de red en sincronización.
- Debe mantener migraciones idempotentes.
- Debe evitar doble procesamiento de respuestas por doble click/tap.
- Debe evitar layout shifts molestos durante sesiones.
- Debe proteger acciones destructivas con confirmación.
- Debe mantener imágenes fuera de SQLite/localStorage cuando sea necesario.

---

## Criterios de aceptación principales

1. Un usuario nuevo puede instalar un mazo incluido y completar una sesión sin conexión.
2. Un usuario puede importar un `.md` con tarjetas básicas y estudiar.
3. Un usuario puede importar un `.apkg` con tarjetas básicas, cloze e imágenes.
4. Una sesión manual muestra pregunta, revela respuesta y permite puntuar con cuatro botones.
5. Un doble click en rating o siguiente no procesa dos tarjetas.
6. Una tarjeta olvidada se reencola dentro de la sesión hasta el límite definido.
7. El ELO del usuario cambia tras responder y se refleja en la pantalla principal.
8. Las tarjetas por encima de `ELO + margen` no aparecen en la sesión.
9. Cambiar el margen ELO cambia el conjunto de tarjetas accesibles.
10. El filtro de tags OR/AND altera las tarjetas pendientes.
11. Silenciar una tarjeta la excluye de futuras sesiones sin contar como respuesta.
12. Una tarjeta tsumego permite jugar en el tablero y entra en revisión al resolver.
13. Durante resolución de tsumego no se muestran comentarios, marcas ni pistas de solución.
14. La fecha límite modifica los intervalos cortos de Olvidada/Difícil.
15. El historial muestra sesiones completadas y evolución de ELO.
16. Exportar y restaurar la base funciona con un fichero SQLite válido.
17. Un fallo de red no impide estudiar ni completar sesiones.
18. La app arranca aunque `app-config.json` no exista.

---

## Riesgos y zonas delicadas

- **Importación Anki:** muchos formatos y versiones; riesgo alto de incompatibilidad.
- **Tsumego:** SGF tiene variantes, comentarios, marcas y secuencias; riesgo alto de casos raros.
- **Persistencia local:** localStorage tiene límites; OPFS no siempre estará disponible.
- **PWA en iOS:** actualizaciones y cache pueden comportarse de forma inesperada.
- **ELO + SM2:** cambios pequeños pueden alterar mucho la sensación de progreso.
- **Móvil:** barras inferiores, notch, teclado y viewport pueden romper la sesión de estudio.
- **Actualización de mazos:** preservar progreso requiere identificación estable de tarjetas.

---

## Glosario funcional

- **Engrama:** contexto independiente de aprendizaje.
- **Tarjeta pendiente:** tarjeta cuya fecha de próxima revisión ya ha llegado.
- **Tarjeta nueva:** tarjeta sin repeticiones.
- **ELO usuario:** nivel actual del estudiante dentro de un Engrama.
- **ELO tarjeta:** dificultad estimada de una tarjeta.
- **Margen ELO:** cantidad añadida al ELO del usuario para decidir qué tarjetas son accesibles.
- **Tsumego:** problema de Go, normalmente de vida y muerte, resuelto jugando movimientos en un tablero.
- **SGF:** formato textual estándar para partidas y problemas de Go.
- **Cloze:** tarjeta de completar huecos.
- **Image Occlusion:** tarjeta basada en ocultar partes de una imagen.

---

## Cierre de la reunión

**Funcional:**  
Para mí, el éxito de Engrama no es tener muchas pantallas. Es que el estudiante pueda abrir la app, estudiar lo que toca, sentir que avanza y cerrar sin fricción. Todo lo técnico debe proteger eso: offline, sesiones cortas, progreso claro, importación fiable y móvil cuidado.

Si el framework tiene que reconstruir o mejorar el proyecto, que empiece por el ciclo de estudio y la persistencia local. Después, que añada ELO, filtros e importadores. Tsumego es diferencial, pero conviene construirlo sobre una base estable.
