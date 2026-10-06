# ROADMAP

Ideas a futuro, sin compromiso de orden ni de plazos. Sirve como aparcadero
de propuestas más ambiciosas que las entradas de `TODO.md` (que es más para
arreglos puntuales y peticiones concretas).

## Tsumego / Go

- **Análisis de patrones de error**: detectar qué tipo de formas o lecturas
  fallan más a menudo (vida y muerte de esquina, semeai, tesuji...) a partir
  de las tags y mostrar un resumen tipo "tus puntos débiles".
- **Modo "deshacer último movimiento"** durante la resolución, para quien se
  equivoca al tocar la intersección equivocada por error de toque (sobre
  todo en móvil con tableros pequeños).
- **Ajuste de zoom/pan en el tablero** para problemas con recortes muy
  amplios o tableros completos de 19x19.
- **Mostrar el conteo de problemas resueltos por nivel kyu/dan** como
  progreso visible, en línea con el sistema de ELO existente.
- **Soporte de SGF con variantes de oponente múltiples** — ahora mismo el
  oponente siempre juega su primera variación; podría variar para dar
  más rejugabilidad a un mismo problema.

## Mazos y contenido

- **Editor de tarjetas in-app**: crear o editar tarjetas básicas/cloze sin
  pasar por Anki ni Markdown — ya está pedido para el título de tsumego en
  `TODO.md`, podría generalizarse.
- **Exportar un Engrama a `.apkg` o Markdown** para compartir mazos creados
  o editados localmente (actualmente solo se importa).
- **Mazos de ejemplo adicionales** más allá de Atmósfera/Go — por ejemplo,
  un mazo corto de cada tipo de tarjeta para enseñar las posibilidades a
  quien empieza.
- **Vista previa antes de importar** un `.apkg`/Markdown grande — número de
  tarjetas, tipos, tags y rango de ELO detectado, para decidir si merece
  la pena instalarlo.

## Estudio y repetición espaciada

- **Estadísticas de retención por etiqueta**: ver qué temas se olvidan más
  rápido y podrían necesitar más repaso.
- **Modo "repaso rápido"**: sesión corta (p.ej. 3-5 tarjetas) para huecos
  de tiempo, distinta de la sesión global de `MAX_SESSION_SIZE`.
- **Histórico de sesiones**: gráfico de tarjetas estudiadas/aciertos por
  día, más allá de la racha actual.
- **Recordatorios configurables** (vía notificaciones PWA) para no romper
  la racha — enlaza con la idea de "PWA - Consideraciones" del TODO.

## PWA / Multiplataforma

- **Backup/restauración manual**: exportar todos los Engramas (OPFS) a un
  fichero y poder restaurarlos en otro dispositivo o tras reinstalar.
- **Sincronización opcional entre dispositivos** (con almacenamiento propio
  del usuario, p.ej. un fichero en su nube personal) — añadiría complejidad
  importante, valorar si compensa frente a la filosofía "sin cuenta".
- **Modo de solo lectura / demo** para enseñar la app a alguien sin tocar
  sus datos.

## Accesibilidad y personalización

- **Tamaño de fuente / densidad ajustable** para mejorar legibilidad en
  pantallas pequeñas o para quien lo prefiera más compacto.
- **Más temas de color** además de claro/oscuro (p.ej. alto contraste).
- **Atajos de teclado** en escritorio para calificar tarjetas y navegar
  el tsumego sin ratón.

## Calidad / mantenimiento

- **Panel de "salud del mazo"**: detectar tarjetas sin tags, con ELO fuera
  de rango, o duplicadas — útil tras importaciones masivas como la de
  goproblems.
- **Modo de depuración de SGF**: previsualizar cómo se renderiza un
  problema concreto antes de incluirlo en un mazo, para detectar casos
  como el de tableros sin `SZ[]` o convenciones no estándar.
