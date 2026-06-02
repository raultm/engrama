// Rangos ordenados de mayor a menor ELO mínimo.
// ELO por defecto: 1500 → entra en "Estudiante" (1400-1599).
// Bandas de 200 ELO para que la progresión se sienta ganada.
export const RANKS = [
  { min: 2400, name: 'Gran Maestro' },
  { min: 2200, name: 'Maestro'      },
  { min: 2000, name: 'Experto'      },
  { min: 1800, name: 'Conocedor'    },
  { min: 1600, name: 'Practicante'  },
  { min: 1400, name: 'Estudiante'   },
  { min: 1200, name: 'Aprendiz'     },
  { min: 1000, name: 'Novato'       },
  { min:    0, name: 'Curioso'      },
]

export function getRank(elo) {
  return (RANKS.find(r => elo >= r.min) ?? RANKS.at(-1)).name
}

export function getRankProgress(elo) {
  const idx = RANKS.findIndex(r => elo >= r.min)
  if (idx <= 0) return idx === 0 ? 1 : 0   // max rank → 100%
  const current = RANKS[idx]
  const next    = RANKS[idx - 1]
  return Math.min(1, (elo - current.min) / (next.min - current.min))
}
