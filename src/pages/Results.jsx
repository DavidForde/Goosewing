import { useState } from 'react'
import '../App.css'

const BOATS_STORAGE_KEY = 'goosewing-boats'
const RACES_STORAGE_KEY = 'goosewing-races'
const DISCARD_STORAGE_KEY = 'goosewing-discards'
const STORAGE_RESET_KEY = 'goosewing-storage-reset-v1'

const DEFAULT_BOATS = [
  { id: 'default-gbr702', sailNumber: 'GBR 702', boatName: 'Moonshine', helmName: 'Jamie Frame' },
  { id: 'default-irl159', sailNumber: 'IRL 159', boatName: 'Zu', helmName: 'Michelle Hayes' },
  { id: 'default-irl222', sailNumber: 'IRL 222', boatName: 'Supremacy', helmName: 'Lee Miles' },
  { id: 'default-irl520', sailNumber: 'IRL 520 ', boatName: 'Magic', helmName: 'Eamonn Timoney' },
  { id: 'default-irl15', sailNumber: 'IRL 15 ', boatName: 'Gypsy', helmName: 'Don Street' },
  { id: 'default-irl300', sailNumber: 'IRL 300 ', boatName: 'Pongo', helmName: 'Diarmuid O Donovan' },
]

const DEFAULT_FINISHES = {
  'default-gbr702': 1,
  'default-irl159': 2,
  'default-irl222': 3,
}

const PENALTY_CODES = ['DNF', 'DNS', 'DSQ']

// Default discard schedule: {racesCompleted: discardsAllowed}
const DEFAULT_DISCARD_SCHEDULE = [
  { after: 5, discards: 1 },
  { after: 10, discards: 2 },
]

function isPenaltyCode(value) {
  return PENALTY_CODES.includes(value)
}

function finishPoints(finish, fleetSize) {
  if (finish === null || finish === undefined) return null
  if (isPenaltyCode(finish)) return fleetSize + 1
  return Number(finish)
}

function formatFinish(finish) {
  if (finish === null || finish === undefined) return '—'
  return String(finish)
}

function isValidFinish(finish, fleetSize) {
  if (finish === null || finish === undefined) return false
  if (isPenaltyCode(finish)) return true
  const position = Number(finish)
  return Number.isInteger(position) && position >= 1 && position <= fleetSize
}

function getDiscardCount(racesCompleted, schedule = DEFAULT_DISCARD_SCHEDULE) {
  let discards = 0
  for (const rule of schedule) {
    if (racesCompleted >= rule.after) discards = rule.discards
  }
  return discards
}

function applyDiscards(racePoints, discardCount) {
  if (discardCount === 0) return { net: racePoints.reduce((s, p) => s + (p ?? 0), 0), discardedIndices: new Set() }
  const scored = racePoints
    .map((pts, i) => ({ pts, i }))
    .filter(({ pts }) => pts !== null)
    .sort((a, b) => b.pts - a.pts)
  const discardedIndices = new Set(scored.slice(0, discardCount).map(({ i }) => i))
  const net = racePoints.reduce((sum, pts, i) => {
    if (pts === null || discardedIndices.has(i)) return sum
    return sum + pts
  }, 0)
  return { net, discardedIndices }
}

function loadBoats() {
  try {
    const raw = localStorage.getItem(BOATS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (boat) =>
        boat &&
        typeof boat.id === 'string' &&
        typeof boat.sailNumber === 'string' &&
        typeof boat.helmName === 'string' &&
        typeof boat.boatName === 'string',
    )
  } catch {
    return []
  }
}

function loadRaces() {
  try {
    const raw = localStorage.getItem(RACES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.races)) return null
    const races = parsed.races.filter(
      (race) => race && typeof race.id === 'string' && race.finishes && typeof race.finishes === 'object',
    )
    if (races.length === 0) return null
    const activeRaceIndex =
      typeof parsed.activeRaceIndex === 'number' &&
      parsed.activeRaceIndex >= 0 &&
      parsed.activeRaceIndex < races.length
        ? parsed.activeRaceIndex
        : races.length - 1
    return { races, activeRaceIndex }
  } catch {
    return null
  }
}

function loadDiscardThreshold() {
  try {
    const raw = localStorage.getItem(DISCARD_STORAGE_KEY)
    if (!raw) return 5
    return JSON.parse(raw)
  } catch {
    return 5
  }
}

function defaultFinishesForBoats(boats) {
  const finishes = {}
  for (const boat of boats) {
    const match = DEFAULT_BOATS.find((d) => d.sailNumber === boat.sailNumber)
    if (match) finishes[boat.id] = DEFAULT_FINISHES[match.id]
  }
  const hasAllDefaults =
    DEFAULT_BOATS.every((d) => boats.some((b) => b.sailNumber === d.sailNumber)) &&
    boats.length === DEFAULT_BOATS.length
  return hasAllDefaults ? finishes : {}
}

function saveBoats(boats) {
  try { localStorage.setItem(BOATS_STORAGE_KEY, JSON.stringify(boats)) } catch {}
}

function saveRaces(races, activeRaceIndex) {
  try { localStorage.setItem(RACES_STORAGE_KEY, JSON.stringify({ races, activeRaceIndex })) } catch {}
}

function saveDiscardThreshold(val) {
  try { localStorage.setItem(DISCARD_STORAGE_KEY, JSON.stringify(val)) } catch {}
}

function createRace(finishes = {}) {
  return { id: crypto.randomUUID(), finishes }
}

function rankForIndex(sortedResults, index, scoreKey = 'points') {
  const score = sortedResults[index][scoreKey]
  if (index > 0 && sortedResults[index - 1][scoreKey] === score) {
    return sortedResults.findIndex((r) => r[scoreKey] === score) + 1
  }
  return index + 1
}

const INITIAL_STATE = (() => {
  try {
    if (!localStorage.getItem(STORAGE_RESET_KEY)) {
      localStorage.removeItem(BOATS_STORAGE_KEY)
      localStorage.removeItem(RACES_STORAGE_KEY)
      localStorage.setItem(STORAGE_RESET_KEY, '1')
    }
  } catch {}

  let boats = loadBoats()
  if (boats.length === 0) {
    boats = DEFAULT_BOATS
    saveBoats(boats)
  }

  const savedRaces = loadRaces()
  const discardThreshold = loadDiscardThreshold()

  if (savedRaces) {
    return { boats, ...savedRaces, discardThreshold }
  }

  const races = [createRace(defaultFinishesForBoats(boats))]
  saveRaces(races, 0)
  return { boats, races, activeRaceIndex: 0, discardThreshold }
})()

export default function Results() {
  const [boats, setBoats] = useState(INITIAL_STATE.boats)
  const [races, setRaces] = useState(INITIAL_STATE.races)
  const [activeRaceIndex, setActiveRaceIndex] = useState(INITIAL_STATE.activeRaceIndex)
  const [discardThreshold, setDiscardThreshold] = useState(INITIAL_STATE.discardThreshold)
  const [form, setForm] = useState({ sailNumber: '', helmName: '', boatName: '' })

  const activeRace = races[activeRaceIndex]
  const finishes = activeRace?.finishes ?? {}
  const fleetSize = boats.length
  const racesCompleted = races.length
  const discardCount = getDiscardCount(racesCompleted, [{ after: discardThreshold, discards: 1 }, { after: discardThreshold * 2, discards: 2 }])

  function updateRaces(nextRaces, nextActiveIndex = activeRaceIndex) {
    setRaces(nextRaces)
    setActiveRaceIndex(nextActiveIndex)
    saveRaces(nextRaces, nextActiveIndex)
  }

  function addBoat(e) {
    e.preventDefault()
    const sailNumber = form.sailNumber.trim()
    const helmName = form.helmName.trim()
    const boatName = form.boatName.trim()
    if (!sailNumber || !helmName || !boatName) return
    setBoats((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), sailNumber, helmName, boatName }]
      saveBoats(next)
      return next
    })
    setForm({ sailNumber: '', helmName: '', boatName: '' })
  }

  function removeBoat(id) {
    setBoats((prev) => {
      const next = prev.filter((b) => b.id !== id)
      saveBoats(next)
      return next
    })
    updateRaces(races.map((race) => {
      const nextFinishes = { ...race.finishes }
      delete nextFinishes[id]
      return { ...race, finishes: nextFinishes }
    }))
  }

  function setFinish(boatId, value) {
    const nextRaces = races.map((race, index) => {
      if (index !== activeRaceIndex) return race
      const nextFinishes = { ...race.finishes }
      if (value === '') {
        delete nextFinishes[boatId]
      } else if (isPenaltyCode(value)) {
        nextFinishes[boatId] = value
      } else {
        const position = Number(value)
        for (const [id, finish] of Object.entries(nextFinishes)) {
          if (id !== boatId && finish === position) delete nextFinishes[id]
        }
        nextFinishes[boatId] = position
      }
      return { ...race, finishes: nextFinishes }
    })
    updateRaces(nextRaces)
  }

  function startNewRace() {
    const nextRaces = [...races, createRace()]
    updateRaces(nextRaces, nextRaces.length - 1)
  }

  function selectRace(index) {
    setActiveRaceIndex(index)
    saveRaces(races, index)
  }

  function updateDiscardThreshold(val) {
    setDiscardThreshold(val)
    saveDiscardThreshold(val)
  }

  const raceResults = boats
    .filter((b) => finishes[b.id] != null)
    .map((b) => ({ ...b, finish: finishes[b.id], points: finishPoints(finishes[b.id], fleetSize) }))
    .sort((a, b) => a.points - b.points)

  const seriesResults = boats
    .map((boat) => {
      const racePoints = races.map((race) => finishPoints(race.finishes[boat.id] ?? null, fleetSize))
      const { net, discardedIndices } = applyDiscards(racePoints, discardCount)
      const racesScored = racePoints.filter((p) => p !== null).length
      return { ...boat, racePoints, net, discardedIndices, racesScored }
    })
    .filter((b) => b.racesScored > 0)
    .sort((a, b) => a.net - b.net || a.racesScored - b.racesScored)

  return (
    <div className="app">
      <header className="header">
        <h1>Goosewing</h1>
        <p className="subtitle">Race Management Software v0.1</p>
      </header>

      <section className="panel">
        <h2>Add boat</h2>
        <form className="form" onSubmit={addBoat}>
          <label>Sail number<input type="text" value={form.sailNumber} onChange={(e) => setForm({ ...form, sailNumber: e.target.value })} placeholder="e.g. 42" /></label>
          <label>Helm<input type="text" value={form.helmName} onChange={(e) => setForm({ ...form, helmName: e.target.value })} placeholder="Skipper name" /></label>
          <label>Boat name<input type="text" value={form.boatName} onChange={(e) => setForm({ ...form, boatName: e.target.value })} placeholder="Boat name" /></label>
          <button type="submit">Add boat</button>
        </form>
      </section>

      {boats.length > 0 && (
        <section className="panel">
          <h2>Boats ({boats.length})</h2>
          <ul className="boat-list">
            {boats.map((boat) => (
              <li key={boat.id} className="boat-item">
                <span className="boat-sail sail-number">{boat.sailNumber}</span>
                <span className="boat-details">{boat.boatName} — {boat.helmName}</span>
                <button type="button" className="btn-remove" onClick={() => removeBoat(boat.id)} aria-label={`Remove ${boat.sailNumber}`}>×</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {boats.length > 0 && (
        <section className="panel">
          <div className="race-header">
            <h2>Race {activeRaceIndex + 1}</h2>
            <button type="button" className="btn-new-race" onClick={startNewRace}>New Race</button>
          </div>
          {races.length > 1 && (
            <div className="race-tabs">
              {races.map((race, index) => (
                <button key={race.id} type="button" className={index === activeRaceIndex ? 'active' : ''} onClick={() => selectRace(index)}>Race {index + 1}</button>
              ))}
            </div>
          )}
          <p className="hint">Assign a finish position, or DNF / DNS / DSQ for boats that did not finish.</p>
          <div className="finish-grid">
            {boats.map((boat) => (
              <label key={boat.id} className="finish-row">
                <span className="finish-label"><strong className="sail-number">{boat.sailNumber}</strong> {boat.boatName}</span>
                <select className={isValidFinish(finishes[boat.id], fleetSize) ? '' : 'finish-invalid'} value={finishes[boat.id] ?? ''} onChange={(e) => setFinish(boat.id, e.target.value)}>
                  <option value="">—</option>
                  {boats.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  {PENALTY_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                </select>
              </label>
            ))}
          </div>
        </section>
      )}

      {raceResults.length > 0 && (
        <section className="panel">
          <h2>Race {activeRaceIndex + 1} results</h2>
          <table className="results">
            <thead><tr><th>Rank</th><th>Sail #</th><th>Boat</th><th>Helm</th><th>Finish</th><th>Points</th></tr></thead>
            <tbody>
              {raceResults.map((boat, index) => (
               <tr key={boat.id} className={[
                rankForIndex(raceResults, index) === 1 ? 'rank-1' : '',
                rankForIndex(raceResults, index) === 2 ? 'rank-2' : '',
                rankForIndex(raceResults, index) === 3 ? 'rank-3' : '',
                isPenaltyCode(boat.finish) ? 'penalty' : '',
              ].filter(Boolean).join(' ')}>
                  <td>{rankForIndex(raceResults, index)}</td>
                  <td className="sail-number">{boat.sailNumber}</td>
                  <td>{boat.boatName}</td>
                  <td>{boat.helmName}</td>
                  <td>{formatFinish(boat.finish)}</td>
                  <td>{boat.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {seriesResults.length > 0 && (
        <section className="panel">
          <h2>Series standings</h2>
          <div className="discard-setting">
            <label>
              First discard after
              <select value={discardThreshold} onChange={(e) => updateDiscardThreshold(Number(e.target.value))}>
                {[3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} races</option>)}
              </select>
            </label>
            {discardCount > 0 && <span className="discard-badge">{discardCount} discard{discardCount > 1 ? 's' : ''} active</span>}
          </div>
          <div className="table-scroll">
            <table className="results series">
              <thead>
                <tr>
                  <th>Rank</th><th>Sail #</th><th>Boat</th><th>Helm</th>
                  {races.map((race, index) => <th key={race.id}>R{index + 1}</th>)}
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {seriesResults.map((boat, index) => (
                  <tr key={boat.id}>
                    <td>{rankForIndex(seriesResults, index, 'net')}</td>
                    <td className="sail-number">{boat.sailNumber}</td>
                    <td>{boat.boatName}</td>
                    <td>{boat.helmName}</td>
                    {boat.racePoints.map((pts, i) => (
                      <td key={races[i].id} className={boat.discardedIndices.has(i) ? 'discarded' : ''}>
                        {pts === null ? '—' : boat.discardedIndices.has(i) ? `(${pts})` : pts}
                      </td>
                    ))}
                    <td className="total">{boat.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {boats.length === 0 && <p className="empty">Add boats to start scoring a race.</p>}
    </div>
  )
}
