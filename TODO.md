# TODO

## Pendiente

### Filtro por tags
Listar todos los tags disponibles en las tarjetas del engrama activo
y permitir al usuario seleccionar uno o varios para estudiar solo
las tarjetas que tengan esos tags.

Quizas poner un icono de tag/s en la zona de tema/ajustes, que al hacer click muestre los tags y se puedan seleccionar deseleccionar, en vez de lista que sea pastillas y sea como una nueva mas que uno debajo de otro

---

## Notas de diseño

### Sistema de acceso (ya implementado)
El usuario solo accede a tarjetas con `eloDifficulty ≤ userElo + 200`.
No hay tarjetas "bloqueadas" manualmente — el acceso es dinámico.
Si un mazo tiene pocas tarjetas de nivel bajo y muchas de nivel alto,
el usuario subirá de ELO despacio. Eso es un problema del diseño del
mazo, no de la aplicación.
