import type { AppDatabase } from '../db/connection.js'

const getMoodLabel = (score: number) => {
  if (score >= 8) {
    return 'High'
  }

  if (score >= 7) {
    return 'Elevated'
  }

  if (score >= 5) {
    return 'Stable'
  }

  return 'Low'
}

export const createMoodService = (db: AppDatabase) => {
  const getMoodOverview = (days = 7) => {
    const latest = db
      .prepare(`
        SELECT
          entry_at,
          mood_score,
          energy_score,
          stress_score
        FROM core_mood_entry
        ORDER BY entry_at DESC
        LIMIT 1
      `)
      .get() as
      | {
          entry_at: string
          mood_score: number
          energy_score: number | null
          stress_score: number | null
        }
      | undefined

    const averageRow = db
      .prepare(`
        SELECT COALESCE(AVG(mood_score), 0) AS average_score
        FROM core_mood_entry
        WHERE day >= date('now', 'localtime', ?)
      `)
      .get(`-${days - 1} days`) as { average_score: number }

    const recentRows = db
      .prepare(`
        SELECT day, AVG(mood_score) AS mood_score
        FROM core_mood_entry
        WHERE day >= date('now', 'localtime', ?)
        GROUP BY day
        ORDER BY day
      `)
      .all(`-${days - 1} days`) as Array<{ day: string; mood_score: number }>

    const currentScore = latest?.mood_score ?? 0

    return {
      currentScore: Number(currentScore.toFixed(1)),
      averageScore: Number((averageRow.average_score ?? 0).toFixed(1)),
      label: getMoodLabel(currentScore),
      filledSegments: Math.min(5, Math.max(1, Math.round(currentScore / 2))),
      latestEnergy: latest?.energy_score ?? 0,
      latestStress: latest?.stress_score ?? 0,
      recent: recentRows.map((row) => ({
        day: new Date(`${row.day}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short' }),
        mood: Number(row.mood_score.toFixed(1)),
      })),
    }
  }

  return {
    getMoodOverview,
  }
}
