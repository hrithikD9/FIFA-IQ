// Match-aware telemetry + engine log engine for the Prediction page.
//
// Everything here is derived from the live prediction probabilities and the
// per-team telemetry metadata, so switching teams (France vs Argentina vs
// Brazil...) produces different, realistic values and log lines.

const MONTE_CARLO_RUNS = 10000

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Deterministic pseudo-random generator seeded by the matchup so the same
// fixture always yields the same "hardware-like" numbers, while different
// fixtures produce different values. Avoids flicker between renders.
const seededRandom = (seed) => {
    let hash = 2166136261
    for (let i = 0; i < seed.length; i += 1) {
        hash ^= seed.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
    }
    return () => {
        hash += hash << 13
        hash ^= hash >>> 7
        hash += hash << 3
        hash ^= hash >>> 17
        hash += hash << 5
        return ((hash >>> 0) % 1000) / 1000
    }
}

const getTeamMeta = (team) => ({
    xg: Number(team?.xg) || 1.5,
    possession: Number(team?.possession) || 50,
    defense: Number(team?.defense) || 75,
    press: Number(team?.press) || 70,
})

/**
 * Compute the four dynamic telemetry metrics for a fixture.
 * @param {object} homeTeam catalog entry (with xg/possession/defense/press)
 * @param {object} awayTeam catalog entry
 * @param {object|null} prediction { homeWin, awayWin, draw } 0..1 probabilities
 * @param {number|null} latencyMs measured engine round-trip latency
 */
export const computeTelemetry = (homeTeam, awayTeam, prediction, latencyMs = null) => {
    const seed = `${homeTeam?.code ?? 'HOME'}-${awayTeam?.code ?? 'AWAY'}`
    const rand = seededRandom(seed)
    const home = getTeamMeta(homeTeam)
    const away = getTeamMeta(awayTeam)

    // xG spread is the raw difference in attacking output (home - away).
    const xgSpread = home.xg - away.xg

    // Model confidence: driven by how decisive the probability split is.
    // A dominant favorite yields higher confidence; a coin-flip yields lower.
    let confidence = 72 + rand() * 6 // idle baseline
    if (prediction) {
        const top = Math.max(prediction.homeWin, prediction.awayWin, prediction.draw)
        const second = [prediction.homeWin, prediction.awayWin, prediction.draw]
            .sort((a, b) => b - a)[1]
        const margin = top - second // 0..~0.7
        confidence = clamp(62 + margin * 70 + (rand() * 3 - 1.5), 55, 97.5)
    }

    // Engine latency: use the measured value when we have one, otherwise a
    // stable per-fixture estimate so the card is populated on match load.
    const latency = latencyMs != null ? Math.round(latencyMs) : Math.round(96 + rand() * 88)

    return {
        modelConfidence: confidence, // percent
        xgSpread, // signed goals
        monteCarloRuns: MONTE_CARLO_RUNS,
        engineLatency: latency, // ms
    }
}

/**
 * Build the sequenced, team-aware engine log script for a fixture.
 * Each entry has a level tag and the message text. Timestamps are added at
 * render time so the stream feels live.
 */
export const buildEngineLogs = (homeTeam, awayTeam, prediction, telemetry) => {
    const home = getTeamMeta(homeTeam)
    const away = getTeamMeta(awayTeam)
    const homeName = homeTeam?.name ?? 'Home'
    const awayName = awayTeam?.name ?? 'Away'
    const confidence = telemetry ? telemetry.modelConfidence.toFixed(1) : '0.0'

    const underdog = prediction
        ? prediction.homeWin < prediction.awayWin
            ? homeName
            : awayName
        : awayName

    return [
        { level: 'INIT', text: `Fetching FIFA international metrics for ${homeName} vs ${awayName}...` },
        { level: 'DATA', text: `Loading xG (${home.xg.toFixed(2)} vs ${away.xg.toFixed(2)}) and defensive rating factors...` },
        { level: 'SIM', text: `Running Monte Carlo match engine (${(telemetry?.monteCarloRuns ?? MONTE_CARLO_RUNS).toLocaleString()} iterations)...` },
        { level: 'INSIGHT', text: `Calculating underdog variance (${underdog}) & high-press threshold...` },
        { level: 'COMPLETE', text: `Outcome matrix generated with ${confidence}% confidence.` },
    ]
}

export const formatTelemetry = {
    confidence: (v) => `${v.toFixed(1)}%`,
    xgSpread: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
    runs: (v) => v.toLocaleString(),
    latency: (v) => `${Math.round(v)}ms`,
}
