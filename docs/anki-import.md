# Preparar mazos en Anki

## Tipos de tarjeta compatibles

| Tipo en Anki | Resultado en la app |
|---|---|
| Basic | Pregunta / respuesta de texto o con imágenes |
| Basic (and reversed card) | Genera dos tarjetas: A→B y B→A |
| Cloze | Huecos `{{c1::respuesta}}` |
| Image Occlusion (nativo Anki 24.x) | Tablero de imágenes con máscaras interactivas |
| **Tsumego** (tipo personalizado) | Tablero de Go con el problema SGF |

---

## Etiquetas especiales

En el campo **Tags** de cada nota:

| Etiqueta | Efecto |
|---|---|
| `elo:1600` | Dificultad 1600 (más difícil que la media) |
| `elo:1200` | Más fácil que la media |
| `locked` | La tarjeta empieza bloqueada |
| `locked:true` | Igual que `locked` |

Sin etiquetas → ELO 1500, desbloqueada.

---

## Tarjetas de tsumego desde Anki

### 1. Crear el tipo de nota

`Herramientas → Administrar tipos de nota → Añadir`

- Nombre del tipo: **Tsumego** (exacto, la app lo detecta por este nombre)
- Campos:
  - `SGF` — texto del problema en formato SGF
  - `Nombre` — título opcional del problema

### 2. Rellenar los problemas

En el campo `SGF` pega el texto SGF completo del problema. Ejemplo mínimo:

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. ¿Cuál es el punto vital?]
AB[ca][ba][cb]AW[aa][bb][ab]
(;B[ac]C[¡Correcto!])
(;B[bc]C[Incorrecto.]))
```

Claves del formato:
- `SZ[9]` — tamaño del tablero (9, 13 o 19)
- `PL[B]` o `PL[W]` — quién mueve primero
- `C[...]` en la raíz — descripción del problema (aparece como enunciado)
- `AB[xy]` / `AW[xy]` — piedras negras / blancas iniciales
- **Primera variación** `(;B[xy]...)` — jugada correcta
- Resto de variaciones — jugadas incorrectas (opcionales)

### 3. Añadir dificultad

En el campo **Tags** de la nota:
```
elo:1800 go tsumego
```

### 4. Exportar

`Archivo → Exportar → Anki Deck Package (.apkg)`  
Asegúrate de que **Incluir archivos multimedia** esté marcado.

---

## Image Occlusion

1. Al añadir nota, elige el tipo **Image Occlusion**
2. Sube la imagen (mapa, diagrama, anatomía...)
3. Dibuja rectángulos, elipses o polígonos sobre las zonas a ocultar
4. Cada forma genera una tarjeta independiente
5. Campo **Encabezado** (opcional): aparece como enunciado de la pregunta

---

## Lo que no se importa

- Audio `[sound:...]` — se ignora silenciosamente
- Tipos de nota con plantillas HTML complejas — se tratan como Basic
  usando los dos primeros campos como pregunta y respuesta
