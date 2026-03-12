export const runNormalization = (_db) => {
    // SQLite views update automatically. Keep this hook for future derived tables.
    return { refreshed: true };
};
