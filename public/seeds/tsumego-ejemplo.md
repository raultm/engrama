---
name: Tsumego — Vida y Muerte básicos
description: 8 problemas clásicos de captura y vida — formato Markdown
schedulerType: sm2
---

## Captura la piedra solitaria

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. La piedra blanca tiene una sola libertad — rellénala y captúrala.]
AB[bc][dc][cb]AW[cc]
(;B[cd]C[Correct! C4 es la última libertad de la piedra blanca. Capturada.]
  ;W[aa]C[Las blancas juegan en otro lado — ya no pueden salvar la piedra.])
(;B[bb]C[Wrong. La blanca aún tiene libertad en C4 y puede escapar.])
(;B[bd]C[Wrong. No afecta a las libertades de la piedra blanca en C3.]))
```

<!-- cardType:tsumego elo:1300 tags:go,tsumego,captura -->

## Punto vital del grupo en L

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. El grupo blanco tiene forma de L en la esquina. ¿Cuál es el punto vital para matarlo?]
AB[ca][ac]AW[aa][ba][ab]
(;B[bb]C[Correct! B2 es el punto vital. El grupo blanco queda sin espacio para dos ojos y muere.]
  ;W[cb]C[Las blancas intentan extenderse — ya es demasiado tarde.]
  ;B[cc]C[Negras persiguen. El grupo blanco está condenado.])
(;B[cb]C[Wrong. Las blancas hacen ojo en B2 y viven con un ojo doble en la esquina.])
(;B[bc]C[Wrong. Igual — las blancas siguen pudiendo hacer ojo en B2.]))
```

<!-- cardType:tsumego elo:1500 tags:go,tsumego,esquina,l-group -->

## Dos libertades — rellena ambas

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. El grupo blanco tiene dos libertades. Rellena ambas para capturarlo.]
AB[ba][ca][eb][ec][cc][bc][bb]AW[cb][db]
(;B[da]C[Correct! D1 cierra la primera libertad.]
  ;B[dc]C[Correct! D3 cierra la segunda. El grupo blanco queda capturado.])
(;B[dc]C[Correct! También funciona empezar por D3.]
  ;B[da]C[Correct! Y cerrar D1. El grupo blanco capturado.])
(;B[aa]C[Wrong. El grupo blanco tiene dos libertades libres y escapa fácilmente.]))
```

<!-- cardType:tsumego elo:1600 tags:go,tsumego,secuencia -->

## Tres en línea — encuentra el punto vital

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. Las blancas tienen tres piedras en fila junto al borde superior. ¿Cuál es el punto vital?]
AB[aa][ea][bb][db]AW[ba][ca][da]
(;B[cb]C[Correct! C2 es el punto vital del "tres en línea". El grupo blanco queda sin libertades.])
(;B[aa]C[Wrong. A1 ya está ocupado por negras.])
(;B[cc]C[Wrong. No toca ninguna libertad del grupo blanco.])
(;B[ba]C[Wrong. B1 ya está ocupado por blancas.]))
```

<!-- cardType:tsumego elo:1500 tags:go,tsumego,captura,tres-en-linea -->

## Grupo en L largo — el punto vital exacto

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. Las blancas tienen un grupo en L con cuatro piedras. Una sola jugada lo mata.]
AB[da][cb][ac]AW[aa][ba][ca][ab]
(;B[bb]C[Correct! B2 es el punto vital del L-largo. El grupo blanco queda sin ninguna libertad.])
(;B[db]C[Wrong. Las blancas aún pueden hacer ojo cerca de la esquina.])
(;B[bc]C[Wrong. Las blancas mantienen libertad en B2 y sobreviven.]))
```

<!-- cardType:tsumego elo:1600 tags:go,tsumego,esquina,l-group -->

## Tumba de dos piedras

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. Las dos piedras blancas tienen una sola libertad. Captúralas.]
AB[ab][db][ac][bc][cc][ca]AW[bb][cb]
(;B[ba]C[Correct! B1 es la última libertad del grupo blanco. Ambas piedras capturadas.])
(;B[cd]C[Wrong. Las blancas aún tienen libertad en B1 y pueden extenderse.])
(;B[dc]C[Wrong. No afecta a las libertades del grupo blanco.]))
```

<!-- cardType:tsumego elo:1400 tags:go,tsumego,captura -->

## Hacer dos ojos en el borde

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. Tu grupo tiene dos huecos interiores. Divide el espacio para crear dos ojos y vivir.]
AB[ab][bb][cb][db][ac][dc][ad][bd][cd][dd]
AW[ba][ca][da][eb][ec][ed][ae][be][ce][de]
(;B[bc]C[Correct! B3 divide el interior en dos ojos: B3 y C3. El grupo negro vive.]
  ;W[ae]C[Las blancas no pueden hacer nada — el grupo negro tiene dos ojos reales.])
(;B[cc]C[Correct! C3 también funciona — crea dos ojos en B3 y C3. Ambos son jugadas ganadoras.]
  ;W[ae]C[Las blancas no pueden matar el grupo.])
(;B[ae]C[Wrong. Las blancas jugarán en el interior y matarán tu grupo con un solo ojo.])
(;B[eb]C[Wrong. Tu grupo sigue sin dos ojos reales y las blancas pueden matarlo.]))
```

<!-- cardType:tsumego elo:1700 tags:go,tsumego,vida,ojos -->

## Red para una piedra en fuga

```sgf
(;FF[4]GM[1]SZ[9]
PL[B]
C[Negras juegan. La piedra blanca intentará escapar. Coloca la red antes de que lo consiga.]
AB[de][fe][df][ff][ed]AW[ee][ef]
(;B[eg]C[Correct! E7 completa la red (geta). La piedra blanca no puede escapar en ninguna dirección.]
  ;W[dg]C[Las blancas intentan escapar por D7...]
  ;B[dh]C[Negras cortan. Las blancas están atrapadas definitivamente.])
(;B[ff]C[Wrong. F6 ya está ocupado por negras.])
(;B[dg]C[Wrong. Las blancas escapan por E7 y huyen hacia el centro.]))
```

<!-- cardType:tsumego elo:1700 tags:go,tsumego,geta,red -->
