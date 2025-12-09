const path = require('node:path');
const fs = require('node:fs');
const { app } = require('electron');
const Database = require('better-sqlite3');

export function initDb() {
    const dir = path.join(app.getPath('userData'), 'data');
    fs.mkdirSync(dir, { recursive: true });
    const dbPath = path.join(dir, 'focus.sqlite');

    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    // test table
    db.exec(`
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY,
            created_at INTEGER NOT NULL,
            text TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);
    `);

    // sessions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY,
            started_at INTEGER NOT NULL,
            ended_at INTEGER,
            duration_target_sec INTEGER NOT NULL,
            duration_actual_sec INTEGER,
            outcome TEXT NOT NULL,
            tz_offset_min INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_outcome ON sessions(outcome);
    `);

    // days table
    db.exec(`
        CREATE TABLE IF NOT EXISTS days (
            id INTEGER PRIMARY KEY,
            date DATE NOT NULL UNIQUE,
            goal_min INTEGER NOT NULL,
            focused_min INTEGER NOT NULL
        );
    `);

    return db;
}
