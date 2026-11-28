import { authenticatedFetch } from './api'

// Match prediction endpoints. Errors propagate as ApiError (with .status) so
// pages can show retry states and validation messages.

/** Active model ({ model, teams }). */
export const fetchModel = (signal) => authenticatedFetch('/predictions/model', { signal })

/** Probabilities for two teams; writes nothing. */
export const computePrediction = ({ homeTeam, awayTeam, neutral = false }, signal) =>
    authenticatedFetch('/predictions/compute', {
        method: 'POST',
        body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam, neutral }),
        signal,
    })

/**
 * Save for the current user. The server recomputes the probabilities with the
 * current model; `externalMatchId` links it to a real fixture for grading.
 */
export const savePrediction = ({ homeTeam, awayTeam, neutral = false, externalMatchId = null }) =>
    authenticatedFetch('/predictions/save', {
        method: 'POST',
        body: JSON.stringify({
            home_team: homeTeam,
            away_team: awayTeam,
            neutral,
            external_match_id: externalMatchId,
        }),
    })

/** The model graded against the latest World Cup's real results. */
export const fetchModelCheck = (signal) => authenticatedFetch('/predictions/model-check', { signal })
