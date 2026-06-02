# Cómo funciona la programación de tarjetas

## Cuatro calificaciones, cuatro comportamientos

Cuando estudias una tarjeta eliges una de estas cuatro opciones:

| Botón | Lo que significa | Próxima revisión |
|---|---|---|
| **Olvidada** | No la recuerdas en absoluto | En pocas horas (mismo día) |
| **Difícil** | La recuerdas con esfuerzo | Más tarde ese mismo día |
| **Buena** | La recuerdas con normalidad | Al día siguiente (SM2) |
| **Perfecta** | La sabes sin dudarlo | Al día siguiente, con intervalo mayor a futuro |

---

## Sin fecha límite configurada

Los intervalos para Olvidada y Difícil son fijos:

| Calificación | Intervalo |
|---|---|
| Olvidada | **4 horas** |
| Difícil | **8 horas** |
| Buena | **1 día** (mañana a las 00:00) |
| Perfecta | **1 día** (mañana a las 00:00) |

### Ejemplo — estudias a las 10:00

```
10:00  Estudias → marcan Olvidada  →  siguiente revisión: 14:00 (mismo día)
10:00  Estudias → marcan Difícil   →  siguiente revisión: 18:00 (mismo día)
10:00  Estudias → marcan Buena     →  siguiente revisión: 00:00 mañana
10:00  Estudias → marcan Perfecta  →  siguiente revisión: 00:00 mañana
```

---

## Con fecha límite configurada

El intervalo de Olvidada y Difícil se **adapta automáticamente** al tiempo que queda,
pero con un **techo máximo** para que nunca sean absurdamente largas.

### Fórmula

```
horas_disponibles = fecha_límite - ahora  (en horas)

Olvidada: min(4h,  horas_disponibles / 20)
Difícil:  min(12h, horas_disponibles / 10)
```

El divisor hace que quepan varias oportunidades de repaso antes del examen.
El techo garantiza que aunque el plazo sea lejano, no pase de horas razonables.

### Tabla de ejemplos

| Tiempo hasta el límite | Olvidada | Difícil |
|---|---|---|
| 30 días (720h) | min(4, 36) = **4 h** | min(12, 72) = **12 h** |
| 14 días (336h) | min(4, 16.8) = **4 h** | min(12, 33.6) = **12 h** |
| 7 días (168h)  | min(4, 8.4) = **4 h** | min(12, 16.8) = **12 h** |
| 3 días (72h)   | min(4, 3.6) = **3.6 h** | min(12, 7.2) = **7.2 h** |
| 1 día (24h)    | min(4, 1.2) = **1.2 h** | min(12, 2.4) = **2.4 h** |
| 6 horas        | min(4, 0.3) → mín **0.5 h** | min(12, 0.6) = **0.6 h** |

> Con plazos lejanos (7+ días) los intervalos de Olvidada y Difícil
> tocan el techo y son idénticos a los valores sin fecha límite.
> El plazo solo marca la diferencia cuando queda poco tiempo.

---

## Cómo crecen los intervalos (SM2) para Buena y Perfecta

Cada vez que contestas bien, el intervalo para la **próxima** revisión crece:

| Respuesta | Repetición | Intervalo siguiente |
|---|---|---|
| Buena o Perfecta | 1ª vez | 1 día |
| Buena o Perfecta | 2ª vez | 6 días |
| Buena o Perfecta | 3ª vez | 6 × easiness ≈ **15 días** |
| Buena o Perfecta | 4ª vez | 15 × easiness ≈ **38 días** |

**Easiness** empieza en 2.5 y varía según cómo respondas:

- Perfecta → easiness sube ligeramente (+0.10)
- Buena → easiness sube muy poco (+0.02)
- Difícil → easiness baja (−0.14)
- Olvidada → easiness baja más (−0.30), pero nunca por debajo de 1.2

### Ejemplo — tarjeta que siempre contestas perfecta

```
Día 1   → Perfecta → próxima: día 2
Día 2   → Perfecta → próxima: día 8
Día 8   → Perfecta → próxima: día 23   (6 × 2.6)
Día 23  → Perfecta → próxima: día 91   (15 × 2.7)
```

### Ejemplo — misma tarjeta, siempre buena (no perfecta)

```
Día 1   → Buena    → próxima: día 2
Día 2   → Buena    → próxima: día 8
Día 8   → Buena    → próxima: día 22   (6 × 2.52)
Día 22  → Buena    → próxima: día 77   (14 × 2.54)
```

La diferencia es pequeña al principio pero se acumula.

---

## Qué pasa si olvidas una tarjeta de forma repetida

```
10:00  Estudias → Olvidada  →  próxima: 14:00 (4h)
14:00  Estudias → Olvidada  →  próxima: 18:00 (4h)
18:00  Estudias → Buena     →  próxima: 00:00 mañana ← SM2 toma el control
```

Cada vez que olvidas, también baja el **easiness** de esa tarjeta.
Esto hace que cuando finalmente la aprendas, sus revisiones futuras sean
más frecuentes (intervalos más cortos) que las de una tarjeta que siempre
contestaste bien.

---

## Dentro de una sesión

Durante la sesión de estudio (10 tarjetas), si olvidas o pones difícil a
una tarjeta, se **re-encola** en la misma sesión hasta 2 veces para darte
otra oportunidad inmediata. Solo después de 3 fallos en la misma sesión
se programa para horas más tarde.
