export function buildDataApi(db) {
    const insertNote = db.prepare(`
        INSERT INTO notes (created_at, text) VALUES (@created_at, @text)
    `);

    const listNotes = db.prepare(`
        SELECT id, created_at, text
        FROM notes
        ORDER BY created_at DESC
        LIMIT @limit OFFSET @offset
    `);

    const insertDay = db.prepare(`
        INSERT INTO days (
            date, goal_min, focused_min
        ) VALUES (
            @date, @goal_min, @focused_min
        )
    `);

    const getDayByDate = db.prepare(`
        SELECT *
        FROM days
        WHERE date = ?
    `);

    const addFocusToDay = db.prepare(`
        UPDATE days
        SET focused_min = focused_min + @delta_min
        WHERE date = @date
    `);

    const setDayGoalByDate = db.prepare(`
        UPDATE days
        SET goal_min = @goal_min
        WHERE date = @date
    `);

    const listDays = db.prepare(`
        SELECT *
        FROM days
        ORDER BY date ASC
    `);

    const insertSession = db.prepare(`
        INSERT INTO sessions (
            started_at, duration_target_sec, outcome, tz_offset_min
        ) VALUES (
            @started_at, @duration_target_sec, @outcome, @tz_offset_min
        )
    `);

    const updateSession = db.prepare(`
        UPDATE sessions
        SET ended_at = @ended_at,
            duration_actual_sec = @duration_actual_sec,
            outcome = @outcome
        WHERE id = @id
    `);

    const listSessions = db.prepare(`
        SELECT *
        FROM sessions
        ORDER BY started_at DESC
        LIMIT @limit OFFSET @offset
    `);

    const sumFocusedByStartRange = db.prepare(`
        SELECT COALESCE(SUM(duration_actual_sec), 0) AS total_sec
        FROM sessions
        WHERE started_at >= @from_ms
            AND started_at <  @to_ms
            AND outcome = 'completed'
    `);
    
    const selectSessionStart = db.prepare(`
        SELECT started_at, ended_at
        FROM sessions
        WHERE id = ?
    `);

    return {

        // test notes
        addNote(text) {
            const created_at = Date.now();
            const info = insertNote.run({ created_at, text });
            return { id: Number(info.lastInsertRowid), created_at, text };
        },
        getNotes(limit = 20, offset = 0) {
            return listNotes.all({ limit, offset });
        },

        // days
        ensureDay({ date, goal_min }) {
            if (!date) throw new Error('ensureDay: date is required');

            const existing = getDayByDate.get(date);
            if (existing) return existing;

            const info = insertDay.run({
                date,
                goal_min: Math.round(goal_min ?? 0),
                focused_min: 0,
            });

            return getDayByDate.get(date);
        },
        addFocusMinutes({ date, minutes }) {
            if (!date) throw new Error('addFocusMinutes: date is required');
            const delta_min = Math.round(minutes ?? 0);

            addFocusToDay.run({ date, delta_min });

            return getDayByDate.get(date);
        },
        getDays() {
            return listDays.all();
        },
        setDayGoal({ date, goal_min }) {
            if (!date) throw new Error('setDayGoal: date is required');

            setDayGoalByDate.run({ date, goal_min: Math.round(goal_min ?? 0) });

            return getDayByDate.get(date);
        },

        // sessions
        startSession({ duration_target_sec }) {
            const started_at = Date.now();
            const tz_offset_min = -new Date().getTimezoneOffset();

            const info = insertSession.run({
                started_at,
                duration_target_sec: Math.round(duration_target_sec),
                outcome: 'running',
                tz_offset_min
            });

            return { id: Number(info.lastInsertRowid), started_at };
        },
        finishSession({ id, outcome, duration_actual_sec }) {
            const allowed = new Set(['completed', 'cancelled', 'timeout', 'crash']);
            const finalOutcome = allowed.has(outcome) ? outcome : 'completed';

            const row = selectSessionStart.get(id);
            if (!row) return { id, ended_at: null, duration_actual_sec: null, outcome: finalOutcome, missing: true };
            if (row.ended_at != null) {
                return { id, ended_at: row.ended_at, duration_actual_sec: null, outcome: finalOutcome, alreadyEnded: true };
            }

            const ended_at = Date.now();

            let actualSec;
            if (typeof duration_actual_sec === 'number' && Number.isFinite(duration_actual_sec)) {
                actualSec = Math.max(0, Math.round(duration_actual_sec));
            } else {
                actualSec = Math.max(0, Math.round((ended_at - row.started_at) / 1000));
            }

            updateSession.run({ id, ended_at, duration_actual_sec: actualSec, outcome: finalOutcome });
            return { id, ended_at, duration_actual_sec: actualSec, outcome: finalOutcome };
        },
        getSessions(limit = 20, offset = 0) {
            return listSessions.all({ limit, offset });
        },
        getFocusedSecondsInRange(fromMs, toMs) {
            const row = sumFocusedByStartRange.get({ from_ms: fromMs, to_ms: toMs });
            return row?.total_sec ?? 0;
        },
    };
}
