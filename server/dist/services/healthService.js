const toPercentDelta = (current, baseline) => {
    if (!baseline) {
        return 0;
    }
    return Math.round(((current - baseline) / baseline) * 100);
};
export const createHealthService = (db) => {
    const getHealthOverview = (days = 7) => {
        const rows = db
            .prepare(`
        SELECT
          day,
          steps,
          active_calories,
          resting_heart_rate,
          hrv_ms,
          oxygen_saturation_pct
        FROM core_daily_health
        ORDER BY day DESC
        LIMIT ?
      `)
            .all(days);
        const ordered = [...rows].reverse();
        const latest = rows[0];
        const priorStepsAverage = rows.slice(1).reduce((sum, row) => sum + row.steps, 0) / Math.max(1, rows.length - 1);
        const priorHrvAverage = rows.slice(1).reduce((sum, row) => sum + (row.hrv_ms ?? 0), 0) / Math.max(1, rows.length - 1);
        return {
            metrics: latest
                ? {
                    steps: latest.steps,
                    calories: latest.active_calories ?? 0,
                    hrv: latest.hrv_ms ?? 0,
                    oxygen: latest.oxygen_saturation_pct ?? 0,
                    stepsTrendPercent: toPercentDelta(latest.steps, priorStepsAverage),
                    hrvTrendDelta: Math.round((latest.hrv_ms ?? 0) - priorHrvAverage),
                }
                : {
                    steps: 0,
                    calories: 0,
                    hrv: 0,
                    oxygen: 0,
                    stepsTrendPercent: 0,
                    hrvTrendDelta: 0,
                },
            daily: ordered.map((row) => ({
                day: new Date(`${row.day}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short' }),
                steps: row.steps,
                calories: row.active_calories ?? 0,
                hr: row.resting_heart_rate ?? 0,
                hrv: row.hrv_ms ?? 0,
            })),
        };
    };
    return {
        getHealthOverview,
    };
};
