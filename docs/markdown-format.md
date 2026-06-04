# Formato Markdown para mazos

Los archivos `.md` permiten crear mazos sin pasar por Anki.

## Estructura básica

```markdown
---
name: Nombre del mazo
description: Descripción breve
schedulerType: sm2
---

## Pregunta de la tarjeta

Respuesta de la tarjeta.

<!-- tags:tag1,tag2 elo:1500 locked:false -->
```

---

## Tarjetas básicas

```markdown
## ¿Cuál es la capital de Francia?

París.

<!-- elo:1400 tags:geografía -->
```

---

## Tarjetas cloze

```markdown
## La capital de {{c1::Francia}} es {{c2::París}}.

<!-- elo:1500 tags:geografía -->
```

---

## Tarjetas de tsumego (problemas de Go)

Añade un bloque de código con lenguaje `sgf` y `cardType:tsumego` en el comentario:

```markdown
## Punto vital en esquina

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. ¿Cuál es el punto vital?]
AB[ca][ac]AW[aa][ba][ab]
(;B[bb]C[Correct! Este es el punto vital. Las blancas mueren.])
(;B[cb]C[Wrong. Las blancas pueden vivir.])
(;B[ac]C[Wrong. No ataca el punto vital.]))
```

<!-- cardType:tsumego elo:1700 tags:go,tsumego -->
```

El SGF sigue el formato estándar:
- `SZ[9]` — tamaño del tablero
- `PL[B]` o `PL[W]` — quién juega primero
- `C[...]` en la raíz — enunciado del problema
- `AB[xy]` / `AW[xy]` — piedras iniciales
- Primera variación `(;B[xy]C[Correct!...])` — jugada correcta
- Resto de variaciones — jugadas incorrectas (el texto de C[...] aparece en el modo revisión)

---

## Metadatos disponibles

| Clave | Valores | Ejemplo |
|---|---|---|
| `elo` | Número | `elo:1700` |
| `locked` | `true` / `false` | `locked:true` |
| `tags` | Lista separada por comas | `tags:go,tsumego,esquina` |
| `cardType` | `tsumego` (básica por defecto) | `cardType:tsumego` |

---

## Ejemplo completo de mazo de tsumegos

```markdown
---
name: Tsumegos básicos - Esquinas
description: Problemas de vida y muerte en la esquina
---

## L-group en esquina

```sgf
(;FF[4]GM[1]SZ[9]PL[B]
C[Negras juegan. Mata el grupo blanco en L.]
AB[ca][ac]AW[aa][ba][ab]
(;B[bb]C[Correct! B2 es el punto vital. El grupo blanco muere.]
  ;W[cc]C[Las blancas intentan escapar, pero están atrapadas.])
(;B[cb]C[Wrong. Las blancas pueden hacer ojo en B2.])
(;B[bc]C[Wrong. Las blancas hacen ojo en B2.]))
```

<!-- cardType:tsumego elo:1600 tags:go,tsumego,l-group -->

## Captura directa

```sgf
(;FF[4]GM[1]SZ[9]PL[B]
C[Negras juegan. Captura la piedra blanca rellenando su última libertad.]
AB[bc][dc][cb]AW[cc]
(;B[cd]C[Correct! C4 es la única libertad. La piedra blanca queda capturada.])
(;B[bb]C[Wrong. La blanca aún tiene libertad en C4.]))
```

<!-- cardType:tsumego elo:1400 tags:go,tsumego,captura -->
```
