# TODO

## Pendiente

### Poner fecha límite de Temario en al zona de ajustes



## Teminado 

### Cuando este viendo una tarjeta poder marcarla para no volver a mostrar

A veces en mazos que se importan el usuario no quiere que le vuelva a salir una tarjeta, o marcarla de alguna manera para que no salga.

¿por qué? quizas la tarjeta esta simplemente mal, o porque cree que por ahora no tiene el nivel que requiere para responderla.

Durante la visualizacion de la tarjeta poder marcarla de alguna manera y que no vuelva a salir. Quizas en el futuro podamos mostrarle al usuario estar tarjetas "silenciadas" y que pueda reactivarlas, pero por ahora eso no.

Lo que si es importante es que al seleccionar para silenciar, aparezca un modal para confirmar la accion, en esa sesion de estudio ya nos olvidamos de ella.

### Gestion de cartas con respecto al ELO

Hasta ahora hemos definido que el usuario tiene un ELO y solo va a poder acceder a ciertas tarjetas del mazo que no superen su ELO mas un margen, ese margen ahora es fijo, pero quiero que ahora en la parte de ajustes ahora se pueda cambiar el valor de ese rango.

### Tarjetas marcada como Olvidada o Mal

Cuando se marca una tarjeta como olvidada se pone dos posiciones mas adelante, y en general el funcionamiento es correcto, pero alguna vez me ha pasado que la ultima tarjeta de la sesion es olvidada y la sesion se acaba. Este comportamiento no me gusta, no se exactamente la razon, pero al poner dos mas adelante parece que hay un mal funcionamiento.

### No mostrar pistas en tsumegos hasta finalizar secuencia

A veces una respuesta correcta es una secuencia de movimientos, no mostrar correcto/incorreto ni pistas(puntos verdes/grises) hasta que se haya completado los movimientos de la serie totalmente 

### TEmas de SGF (anotas/marcas)

En algunos tsumegos que me he descargado en los comentarios vienen comentarios sobre grupos de piedras u opciones para poner piedras, esas cosas no se visualizan, crees que podrías mejorar el editor sgf para añadirlo?

Se soportan las marcas estándar de SGF: `LB` (etiquetas de texto), `CR` (círculos),
`SQ` (cuadrados), `TR` (triángulos) y `MA` (cruces). Se muestran sobre el tablero
(con buen contraste tanto en piedras como en intersecciones vacías) y, como las
demás pistas, se ocultan durante la resolución y aparecen al entrar en modo revisión.

### Archivo de configuracion

Quiero tener la posibilidad de tener un archivo de configuracion que al cambiar modifique comportamiento de aplicacion

Por ejemplo
- Titulo de la aplicacion
- Poder ocultar boton de descargar bd
- Poder ocultar tarjetas de estadisticas en apartado de estadisticas
- Poder ocultar ajuste ELO
- En general poder ocultar ciertas cosas de la Zona de Estadísticas

`public/app-config.json` se carga al arrancar y permite personalizar `appTitle`,
`showDownloadDb`, `showEloMargin` y la visibilidad de cada tarjeta de
`statsCards` (elo/due/newCards/total). Si el fichero está vacío o falta alguna
clave, se usan los valores por defecto (todo visible, título "Engrama") —
`public/app-config.json.example` documenta todas las claves disponibles.

### Tsumegos zoom al problema

En los tsumegos habiamos hablado de mostrar la zona donde esta el problema, que se expanda hasta dos bordes del tablero, eso esta bien. Pero no cubre algunos casos. En alguna situacion hay piedras o marcas fuera de ese rango. Me gustaría que vieses todas las posiciones que se usan y se haga el zoom con respecto a esas marcas y no solo las iniciales

El recorte del tablero ahora se calcula también a partir de `extentPoints`:
todas las coordenadas usadas en cualquier punto del árbol SGF (piedras
iniciales, jugadas de cualquier variación y marcas LB/CR/SQ/TR/MA). Así el
recorte es estable y siempre incluye marcas o jugadas fuera de la posición
inicial.

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
El usuario solo accede a tarjetas con `eloDifficulty ≤ userElo + margen`.
El margen es configurable desde Estadísticas (por defecto 200).
No hay tarjetas "bloqueadas" manualmente — el acceso es dinámico.
Si un mazo tiene pocas tarjetas de nivel bajo y muchas de nivel alto,
el usuario subirá de ELO despacio. Eso es un problema del diseño del
mazo, no de la aplicación.
