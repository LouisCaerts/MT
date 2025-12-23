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

    // days
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

    const setFirstSessionDone = db.prepare(`
        UPDATE days
        SET first_session_done = @done
        WHERE date = @date
    `);

    const setGoalReached = db.prepare(`
        UPDATE days
        SET goal_reached = @reached
        WHERE date = @date
    `);

    const setSurveyTaken = db.prepare(`
        UPDATE days
        SET survey_taken = @taken
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

    const getFocusedMinutesForDay = db.prepare(`
        SELECT COALESCE(focused_min, 0) 
        AS focused_min 
        FROM days 
        WHERE date = ?
    `);

    // sessions
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

    // dailies
    const insertDaily = db.prepare(`
        INSERT INTO dailies (date, focus, explanation, tasks, tool)
        VALUES (@date, @focus, @explanation, @tasks, @tool)
        ON CONFLICT(date) DO UPDATE SET
            focus       = excluded.focus,
            explanation = excluded.explanation,
            tasks       = excluded.tasks,
            tool        = excluded.tool
    `);

    const getDailyByDate = db.prepare(`
        SELECT *
        FROM dailies
        WHERE date = ?
    `);

    const listDailies = db.prepare(`
        SELECT *
        FROM dailies
        ORDER BY date ASC
    `);

    const patchDailyByDate = db.prepare(`
        UPDATE dailies
        SET
            focus      = COALESCE(@focus, focus),
            explanation = COALESCE(@explanation, explanation),
            tasks      = COALESCE(@tasks, tasks),
            tool       = COALESCE(@tool, tool)
        WHERE date = @date
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
        getDay(date) {
            if (!date) throw new Error('getDay: date is required');
            return getDayByDate.get(date);
        },
        setDayGoal({ date, goal_min }) {
            if (!date) throw new Error('setDayGoal: date is required');

            setDayGoalByDate.run({ date, goal_min: Math.round(goal_min ?? 0) });

            return getDayByDate.get(date);
        },
        getFocusedMinutes({ date }) {
            if (!date) throw new Error('getFocusedMinutes: date is required');
            const row = getFocusedMinutesForDay.get(date);

            return row?.focused_min ?? 0;
        },
        setFirstSessionDone({ date, first_session_done }) {
            if (!date) throw new Error('setFirstSessionDone: date is required');
            const done = first_session_done ? 1 : 0;
            setFirstSessionDone.run({ date, done });
            return getDayByDate.get(date);
        },
        setGoalReached({ date, goal_reached }) {
            if (!date) throw new Error('setGoalReached: date is required');
            const reached = goal_reached ? 1 : 0;
            setGoalReached.run({ date, reached });
            return getDayByDate.get(date);
        },
        setSurveyTaken({ date, survey_taken }) {
            if (!date) throw new Error('setSurveyTaken: date is required');
            const taken = survey_taken ? 1 : 0;
            setSurveyTaken.run({ date, taken });
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

        // dailies
        setDaily({ date, focus, explanation, tasks, tool }) {
            if (!date) throw new Error('setDaily: date is required');
            if (focus == null) throw new Error('setDaily: focus is required');

            insertDaily.run({
                date,
                focus: Math.round(focus),
                explanation: explanation ?? null,
                tasks: tasks ?? null,
                tool: tool ?? null,
            });

            return getDailyByDate.get(date);
        },
        updateDaily(patch = {}) {
            const { date } = patch;
            if (!date) throw new Error('updateDaily: date is required');

            patchDailyByDate.run({
                date,
                focus: patch.focus,
                explanation: patch.explanation,
                tasks: patch.tasks,
                tool: patch.tool,
            });

            return getDailyByDate.get(date);
        },
        getDaily(date) {
            if (!date) throw new Error('getDaily: date is required');
            return getDailyByDate.get(date);
        },
        getDailies() {
            return listDailies.all();
        },

    };
}
