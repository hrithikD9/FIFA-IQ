import { describe, expect, it } from 'vitest'
import {
    addDays,
    fromIsoDate,
    initials,
    ordinal,
    pct0,
    predictionState,
    prettyStage,
    resultFor,
    teamCode,
    timeAgo,
    toIsoDate,
} from './football'

const match = (status, winner, homeId = 81, awayId = 86) => ({
    status,
    home_team: { id: homeId },
    away_team: { id: awayId },
    score: { winner },
})

describe('resultFor', () => {
    it('returns W/D/L from the given team’s point of view', () => {
        expect(resultFor(match('finished', 'home'), 81)).toBe('W')
        expect(resultFor(match('finished', 'home'), 86)).toBe('L')
        expect(resultFor(match('finished', 'away'), 86)).toBe('W')
        expect(resultFor(match('finished', 'draw'), 81)).toBe('D')
    })

    it('ignores matches that are not finished', () => {
        // A live match can carry a provisional winner; it must not count as form.
        expect(resultFor(match('live', 'home'), 81)).toBeNull()
        expect(resultFor(match('scheduled', null), 81)).toBeNull()
    })
})

describe('teamCode', () => {
    it('prefers the official three-letter code', () => {
        expect(teamCode({ tla: 'FCB', name: 'FC Barcelona' })).toBe('FCB')
    })
    it('falls back to initials or the first letters of the name', () => {
        expect(teamCode({ name: 'Real Madrid CF' })).toBe('RMC')
        expect(teamCode({ name: 'Spain' })).toBe('SPA')
        expect(teamCode(null)).toBe('—')
    })
})

describe('formatting helpers', () => {
    it('ordinal', () => {
        expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual([
            '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st',
        ])
    })
    it('initials', () => {
        expect(initials('Erling Braut Haaland')).toBe('EB')
        expect(initials('')).toBe('?')
    })
    it('prettyStage', () => {
        expect(prettyStage('THIRD_PLACE')).toBe('Third Place')
        expect(prettyStage(null)).toBeNull()
    })
    it('pct0 rounds probabilities to whole percentages', () => {
        expect(pct0(0.3349)).toBe('33%')
        expect(pct0(undefined)).toBe('0%')
    })
})

describe('local dates', () => {
    it('round-trips YYYY-MM-DD in local time', () => {
        expect(toIsoDate(fromIsoDate('2026-11-28'))).toBe('2026-11-28')
    })
    it('adds days across month ends', () => {
        expect(toIsoDate(addDays(fromIsoDate('2026-11-30'), 1))).toBe('2026-12-01')
    })
})

describe('timeAgo', () => {
    const now = new Date('2026-11-28T12:00:00Z')
    it('describes recent times relatively', () => {
        expect(timeAgo('2026-11-28T11:59:40Z', now)).toBe('just now')
        expect(timeAgo('2026-11-28T11:30:00Z', now)).toBe('30 min ago')
        expect(timeAgo('2026-11-28T07:00:00Z', now)).toBe('5 h ago')
        expect(timeAgo('2026-11-27T12:00:00Z', now)).toBe('1 day ago')
    })
    it('handles missing values', () => {
        expect(timeAgo(null, now)).toBe('—')
    })
})

describe('predictionState', () => {
    it('carries the fixture link and treats internationals as neutral', () => {
        const m = {
            id: 537390,
            is_international: true,
            utc_date: '2026-07-19T19:00:00Z',
            competition: { name: 'FIFA World Cup' },
            home_team: { name: 'Spain' },
            away_team: { name: 'Argentina' },
        }
        expect(predictionState(m)).toEqual({
            home: 'Spain',
            away: 'Argentina',
            externalMatchId: 537390,
            neutral: true,
            competition: 'FIFA World Cup',
            utcDate: '2026-07-19T19:00:00Z',
            homeCrest: null,
            awayCrest: null,
        })
        expect(predictionState({ ...m, is_international: false }).neutral).toBe(false)
    })
})
