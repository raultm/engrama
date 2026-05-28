export function UserEloBar(profile) {
  const el = document.createElement('div')
  el.className = 'elo-bar'

  const level = profile.getLevel()
  const progress = profile.getLevelProgress()
  const pct = Math.round(progress * 100)

  el.innerHTML = `
    <div class="elo-bar__info">
      <span class="elo-bar__name">${escapeHtml(profile.displayName)}</span>
      <span class="elo-bar__elo">${profile.eloRating} ELO · Nivel ${level}</span>
    </div>
    <div class="elo-bar__track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de nivel">
      <div class="elo-bar__fill" style="width: ${pct}%"></div>
    </div>
  `

  return el
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
