# TODO

## Pendiente

### No mostrar pistas en tsumegos hasta finalizar secuencia

A veces una respuesta correcta es una secuencia de movimientos, no mostrar correcto/incorreto ni pistas(puntos verdes/grises) hasta que se haya completado los movimientos de la serie totalmente 

## Teminado 

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
