import './style.css'
import { decrementLevel, incrementLevel, type GameRecord, type Level } from './domain'
import { GameRepository, preferencesStorage } from './storage'

type Team = 'red' | 'blue'
type Route = { name: 'home' } | { name: 'scoring' } | { name: 'detail'; id: string }

const app = document.querySelector<HTMLDivElement>('#app')!

const repository = new GameRepository(preferencesStorage)
let route: Route = routeFromLocation()

function routeFromLocation(): Route {
  const hash = location.hash.slice(1)
  if (hash === '/scoring') return { name: 'scoring' }
  if (hash.startsWith('/detail/')) return { name: 'detail', id: decodeURIComponent(hash.slice(8)) }
  return { name: 'home' }
}

function navigate(next: Route, replace = false): void {
  const hash =
    next.name === 'home'
      ? '#/'
      : next.name === 'scoring'
        ? '#/scoring'
        : `#/detail/${encodeURIComponent(next.id)}`

  if (replace) history.replaceState(null, '', hash)
  else if (location.hash !== hash) history.pushState(null, '', hash)
  route = next
  render()
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ??
      character,
  )
}

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
}

function formatFullDateTime(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
}

function formatDuration(startedAt: number, endedAt: number): string {
  const totalSeconds = Math.max(0, Math.round((endedAt - startedAt) / 1000))
  if (totalSeconds < 60) return `${totalSeconds}秒`
  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours > 0 ? `${hours}小时${remainingMinutes}分` : `${minutes}分钟`
}

function backButton(): string {
  return '<button class="icon-button" id="back-button" type="button" aria-label="返回">‹</button>'
}

function renderHome(): void {
  const state = repository.snapshot()
  const records = state.history
    .map(
      (record) => `
        <button class="history-row" type="button" data-record-id="${escapeHtml(record.id)}">
          <span class="history-time">
            <strong>${formatDateTime(record.startedAt)}</strong>
            <small>${formatDuration(record.startedAt, record.endedAt)}</small>
          </span>
          <span class="history-scores">
            <span class="result result-red">红 ${record.redLevel}</span>
            <span class="result result-blue">蓝 ${record.blueLevel}</span>
          </span>
          <span class="chevron" aria-hidden="true">›</span>
        </button>`,
    )
    .join('')

  app.innerHTML = `
    <main class="screen home-screen">
      <header class="home-header">
        <h1>掼蛋计分</h1>
        <button class="primary-button" id="start-button" type="button">
          ${state.activeGame ? '继续当前一局' : '开始新的一局'}
        </button>
      </header>
      <section class="history-section" aria-labelledby="history-title">
        <h2 id="history-title">历史记录</h2>
        <div class="history-list">
          ${records || '<p class="empty-state">暂无记录</p>'}
        </div>
      </section>
    </main>`

  document.querySelector('#start-button')?.addEventListener('click', () => {
    repository.start()
    navigate({ name: 'scoring' })
  })
  document.querySelectorAll<HTMLElement>('[data-record-id]').forEach((element) => {
    element.addEventListener('click', () => {
      const id = element.dataset.recordId
      if (id) navigate({ name: 'detail', id })
    })
  })
}

function scorePanel(team: Team, level: Level): string {
  const label = team === 'red' ? '红组' : '蓝组'
  return `
    <section class="score-panel score-panel-${team}" data-score-panel="${team}">
      <h2>${label}</h2>
      <button class="score-step" type="button" data-score-action="increment" data-team="${team}" aria-label="${label}加一级">+</button>
      <output class="score-value" id="${team}-score" aria-live="polite">${level}</output>
      <button class="score-step" type="button" data-score-action="decrement" data-team="${team}" aria-label="${label}减一级">−</button>
    </section>`
}

function renderScoring(): void {
  const state = repository.snapshot()
  const game = state.activeGame
  if (!game) {
    navigate({ name: 'home' }, true)
    return
  }

  app.innerHTML = `
    <main class="screen scoring-screen">
      <header class="top-bar">
        ${backButton()}
        <h1>第 ${state.history.length + 1} 局</h1>
        <span class="top-bar-spacer"></span>
      </header>
      <div class="score-board">
        ${scorePanel('red', game.redLevel)}
        ${scorePanel('blue', game.blueLevel)}
      </div>
      <footer class="finish-bar">
        <button class="primary-button" id="finish-button" type="button">完成并保存本局</button>
      </footer>
      <dialog id="finish-dialog">
        <form method="dialog">
          <h2>完成本局？</h2>
          <div class="dialog-scores">
            <span class="result result-red">红 <b id="dialog-red">${game.redLevel}</b></span>
            <span class="result result-blue">蓝 <b id="dialog-blue">${game.blueLevel}</b></span>
          </div>
          <div class="dialog-actions">
            <button class="secondary-button" value="cancel">取消</button>
            <button class="primary-button compact" value="confirm">完成</button>
          </div>
        </form>
      </dialog>
    </main>`

  document.querySelector('#back-button')?.addEventListener('click', () => navigate({ name: 'home' }))
  bindScoringControls()

  const dialog = document.querySelector<HTMLDialogElement>('#finish-dialog')
  document.querySelector('#finish-button')?.addEventListener('click', () => dialog?.showModal())
  dialog?.addEventListener('close', () => {
    if (dialog.returnValue !== 'confirm') return
    repository.complete()
    navigate({ name: 'home' })
  })
}

function updateScore(team: Team, direction: 'increment' | 'decrement'): void {
  const game = repository.snapshot().activeGame
  if (!game) return
  const current = team === 'red' ? game.redLevel : game.blueLevel
  const next = direction === 'increment' ? incrementLevel(current) : decrementLevel(current)
  repository.setScore(team, next)

  const output = document.querySelector<HTMLOutputElement>(`#${team}-score`)
  if (output) {
    output.textContent = next
    output.animate(
      [
        { transform: 'scale(.88)', opacity: 0.65 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 150, easing: 'ease-out' },
    )
  }
  const dialogValue = document.querySelector(`#dialog-${team}`)
  if (dialogValue) dialogValue.textContent = next
}

function bindScoringControls(): void {
  document.querySelectorAll<HTMLElement>('[data-score-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const team = button.dataset.team as Team
      const action = button.dataset.scoreAction as 'increment' | 'decrement'
      updateScore(team, action)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-score-panel]').forEach((panel) => {
    let startY: number | null = null
    panel.addEventListener('pointerdown', (event) => {
      startY = event.clientY
      panel.setPointerCapture(event.pointerId)
    })
    panel.addEventListener('pointerup', (event) => {
      if (startY === null) return
      const delta = event.clientY - startY
      startY = null
      if (Math.abs(delta) < 34) return
      const team = panel.dataset.scorePanel as Team
      updateScore(team, delta < 0 ? 'increment' : 'decrement')
    })
    panel.addEventListener('pointercancel', () => {
      startY = null
    })
  })
}

function renderDetail(id: string): void {
  const record = repository.snapshot().history.find((item) => item.id === id)
  if (!record) {
    navigate({ name: 'home' }, true)
    return
  }

  app.innerHTML = `
    <main class="screen detail-screen">
      <header class="top-bar">
        ${backButton()}
        <h1>单局详情</h1>
        <span class="top-bar-spacer"></span>
      </header>
      <section class="detail-meta">
        <strong>${formatFullDateTime(record.startedAt)}</strong>
        <span>${formatDuration(record.startedAt, record.endedAt)}</span>
      </section>
      <div class="detail-scores">
        ${detailScore('red', record)}
        ${detailScore('blue', record)}
      </div>
      <footer class="detail-footer">
        <button class="delete-button" id="delete-button" type="button">删除这条记录</button>
      </footer>
      <dialog id="delete-dialog">
        <form method="dialog">
          <h2>删除这条记录？</h2>
          <div class="dialog-actions">
            <button class="secondary-button" value="cancel">取消</button>
            <button class="delete-button compact" value="confirm">删除</button>
          </div>
        </form>
      </dialog>
    </main>`

  document.querySelector('#back-button')?.addEventListener('click', () => navigate({ name: 'home' }))
  const dialog = document.querySelector<HTMLDialogElement>('#delete-dialog')
  document.querySelector('#delete-button')?.addEventListener('click', () => dialog?.showModal())
  dialog?.addEventListener('close', () => {
    if (dialog.returnValue !== 'confirm') return
    repository.deleteRecord(record.id)
    navigate({ name: 'home' }, true)
  })
}

function detailScore(team: Team, record: GameRecord): string {
  const label = team === 'red' ? '红组' : '蓝组'
  const level = team === 'red' ? record.redLevel : record.blueLevel
  return `
    <section class="detail-score detail-score-${team}">
      <h2>${label}</h2>
      <strong>${level}</strong>
    </section>`
}

function render(): void {
  if (route.name === 'home') renderHome()
  else if (route.name === 'scoring') renderScoring()
  else renderDetail(route.id)
}

window.addEventListener('hashchange', () => {
  route = routeFromLocation()
  render()
})

window.addEventListener('pagehide', () => {
  void repository.flush()
})

async function bootstrap(): Promise<void> {
  try {
    await repository.load()
    if (!location.hash) history.replaceState(null, '', '#/')
    route = routeFromLocation()
    render()
  } catch {
    app.innerHTML = '<main class="fatal-error"><h1>掼蛋计分</h1><p>数据加载失败</p></main>'
  }
}

void bootstrap()
