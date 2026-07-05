# TODO

## Pendiente

### UX - Deshacer última calificación

No hay forma de corregir un toque accidental en Olvidada/Difícil/etc. Un botón
"deshacer" (o unos segundos de margen tras calificar) evitaría penalizar el ELO
y la programación por un fallo de dedo. Es de lo más echado en falta viniendo de Anki.

### UX - Mostrar atajos de teclado en los botones de calificación

Los atajos 1-4 y espacio/Enter funcionan, y el array RATINGS ya tiene `key`,
pero el template de StudyView no pinta el `<kbd>` (el CSS `.rating-btn kbd`
sigue existiendo — se perdió en algún refactor). En escritorio ayudaría a
descubrirlos. Ocultarlos en móvil.

### UX - Onboarding mínimo la primera vez

Al entrar por primera vez no se explica qué es el ELO, qué significan los 4
botones, ni que las tarjetas difíciles están bloqueadas hasta subir de nivel.
Un par de pantallas o tooltips la primera sesión (descartables) bastarían.

### UX - Feedback de progreso al importar mazos grandes

Importar un .apkg o markdown de miles de tarjetas (goproblems: 19k) deja la
pantalla congelada sin indicación. Mostrar spinner + "importando N/M tarjetas"
o al menos un estado indeterminado con mensaje.

### UX - El botón de estudiar no dice cuántas tarjetas tendrá la sesión

La sesión está limitada a 10 (MAX_SESSION_SIZE) pero "Para hoy: 47" sugiere
que vas a hacer 47. Indicar "Sesión de 10" en el botón o bajo él. Valorar
también sesión de tamaño configurable (corta/normal/larga).

### UX - Mostrar el ELO numérico en la Home

En la Home solo se ve el rango y la barra; el número exacto de ELO (el gancho
principal de la app) solo aparece en Estadísticas. Mostrarlo junto al rank-badge.

### UX - Racha visible desde el día 1

`streak > 3` hace que los primeros 3 días no aparezca nada — justo cuando más
motivación hace falta para consolidar el hábito. Mostrarla desde el día 2, o
desde el 1 con estilo discreto.

### UX - Reorganizar la "danger zone" de Estadísticas

Descargar BD, importar archivo y fecha límite no son acciones peligrosas pero
viven junto a "Eliminar Engrama" y "Borrar toda la base de datos". Separar en
"Datos" (exportar/importar/fecha límite) y "Zona peligrosa" (borrados), con
más fricción visual en la segunda.

### UX - Renombrar Engrama

Una vez instalado no se puede cambiar el nombre. Útil tras importar mazos
con nombres largos autogenerados.

### UX - Cambio de Engrama sin recarga completa

Cambiar de Engrama (y también al terminar de importar) hace `location.reload()`,
con flash en blanco. Re-inicializar el contenedor y re-renderizar quedaría
mucho más fluido, sensación de app nativa.

### UX - Tsumego: ofrecer "reintentar" antes de calificar

Al fallar un tsumego pasa directo a revisión con rating automático. Un botón
"Reintentar" (que mantenga el rating de fallo para el scheduler, o lo marque
como repetición) permitiría volver a leer la posición — es como se entrena
tsumego en la vida real.

### No mostrar pistas en tsumegos hasta finalizar secuencia

A veces una respuesta correcta es una secuencia de movimientos, no mostrar correcto/incorreto ni pistas(puntos verdes/grises) hasta que se haya completado los movimientos de la serie totalmente 

## Terminado

### Doble click en botones — zoom no deseado en móvil

`touch-action: manipulation` en `button, a, input, select, [role="button"]`
y en `.go-target` (targets SVG del tablero de Go).



### Tsumegos - añadir titulo

Me permite corregirlo o añadir comentarios, ¿despues se actualizaria el contenido sin modificar el estado de estudio, no?

Creo que el titulo ahora que hemos dejado todo mas organizado puede quedar bien, quizas mostrarlo en el footer, o encima del goban centrado, o como lo tienen las otras tarjetas, lo que creas oportuno.

TRas implementarlo lo probaré en movil

### PWA - Consderaciones

Como voy a motivar a la gente a instalarlo como PWA y no conozco mucho el tema.

- Proponme cosas interesante que puede tener por estar así
- Problemas que pueden surgir, como ese que no actulizac version
- Otras cosas curiosas (notificaciones, ...)

### Tags - Ahora es un OR, poder cambiar a AND

Quiero tarjetas que tengan variaas tags ¿crees que es interesante? se podría hacer visualmente entendible, tal y como estan ahora las tags me encanta como se usa



### Ahora las tarjetas que no son tsumegos han perdido los 4 botones de rating

Devolverlos


### Filtro por tags
Listar todos los tags disponibles en las tarjetas del engrama activo
y permitir al usuario seleccionar uno o varios para estudiar solo
las tarjetas que tengan esos tags.

Quizas poner un icono de tag/s en la zona de tema/ajustes, que al hacer click muestre los tags y se puedan seleccionar deseleccionar, en vez de lista que sea pastillas y sea como una nueva mas que uno debajo de otro

### En version movil iconos a la derecha
En la version movil hay como dos lineas
[Icono] Titulo [tema] [ajustes]
[SElector de engrama]

Tras añadir el icono de [tags]
que los tres iconos se vaya a la derecha

### Posibilidad de que tsumegos no tenga envoltorio

Con la idea de aprovechar todo lo posible el espacio, ¿eliminar lo que rodea a la tarjeta en la version movil? En escritorio o se deja o se limita

### Revisar mazo existente de Anki

Quizas podamos rescatar de aqui mucho tsumegos, los que hace claude alguno no tienen sentido, aunque como ejemplo han valido mucho la pena

https://ankiweb.net/shared/info/988623857

SGF 	( ;GM[1]SZ[19] GN[GZP3] AB[bj][cj][di][eg][fg][fe][gd][dd][ce][be][cc][gb] AW[bd][ae][bf][cf][df][ch][bi] ;W[bc] ;B[cb] ;W[bb] ;B[ba] ;W[cd] ;B[de] ;W[dc] ;B[da] )
Crop 	aahk
showDead 	True
enablePlay 	False

SGF 	( ;FF[4] CA[UTF-8] AP[puzzle2sgf:0.1] GM[1] GN[636 / 861] SZ[19] AB[bb][cc][db][eb][ed][fc][gc][hb][ib] AW[bc][ca][cb][dc][dd][de][ec][ee][ge][hc][ic][jb][jd] PL[B] C[no puzzle description] ( ;B[da] ;W[cd] ;B[fa] C[CORRECT CORRECT!] ) ( ;B[fa] ;W[da] ( ;B[gb] C[CORRECT CORRECT!] ) ( ;B[ia] C[WRONG!] ;W[ga] C[WRONG!] ;B[gb] C[WRONG!] ;W[cd] C[WRONG WRONG!] ) ) ( ;B[fb] ;W[ga] ;B[da] ;W[cd] ;B[fa] C[CORRECT CORRECT!] ) ( ;B[ia] ;W[ga] ( ;B[da] ;W[cd] ;B[fa] C[CORRECT CORRECT!] ) ( ;B[fa] C[WRONG!] ;W[da] C[WRONG!] ;B[gb] C[WRONG!] ;W[cd] C[WRONG WRONG!] ) ) ( ;B[ga] C[WRONG!] ;W[fb] C[WRONG!] ( ;B[fa] C[WRONG!] ;W[ia] C[WRONG WRONG!] ) ( ;B[gb] C[WRONG!] ;W[da] C[WRONG WRONG!] ) ) ( ;B[gb] C[WRONG!] ;W[fa] C[WRONG WRONG!] ) ( ;B[ha] C[WRONG!] ;W[fa] C[WRONG WRONG!] ) )
Crop 	aakf
showDead 	True
enablePlay 	False

---

## Notas de diseño

### Sistema de acceso (ya implementado)
El usuario solo accede a tarjetas con `eloDifficulty ≤ userElo + 200`.
No hay tarjetas "bloqueadas" manualmente — el acceso es dinámico.
Si un mazo tiene pocas tarjetas de nivel bajo y muchas de nivel alto,
el usuario subirá de ELO despacio. Eso es un problema del diseño del
mazo, no de la aplicación.
