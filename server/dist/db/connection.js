import Database from 'better-sqlite3';
export const openDatabase = (databasePath) => {
    const db = new Database(databasePath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    return db;
};
