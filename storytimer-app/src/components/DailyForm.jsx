import '../stylesheets/DailyForm.css';

import { TRIGGERS, getBirbReaction } from "../main/reactions.js";

import { useEffect, useState } from 'react';
import { DailyAPI, DaysAPI } from '../main/api.js';
import { useNavigate, Link } from "react-router-dom";

export default function DailyForm() {
    const navigate = useNavigate();

    // use ISO date string as key, same as days table likely uses
    const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [focus, setFocus] = useState('');
    const [explanation, setExplanation] = useState('');
    const [tasks, setTasks] = useState('');
    const [tool, setTool] = useState('');

    const [allowed, setAllowed] = useState(false);
    const [blockedReason, setBlockedReason] = useState(null);
    
	const [birbReaction, setBirbReaction] = useState(getBirbReaction({
														trigger: TRIGGERS.REFLECTION_COMPLETED,
														goalMin: 0,
														focusedMin: 0,
													}).text);

    // Load existing survey for today (if any) so users can edit
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                // --- time gate ---
                const now = new Date();
                const hour = now.getHours();
                if (hour < 11 || hour > 23) {
                    setBlockedReason('Daily reflections are available between 11:00 and 23:59.');
                    return;
                }

                // --- DB gate: focused minutes ---
                const day = await DaysAPI.get(todayKey);
                const focusedMin = day?.focused_min ?? 0;

                if (focusedMin <= 0) {
                    setBlockedReason('You need to complete at least one focus session today before reflecting.');
                    return;
                }

                // --- load existing survey ---
                const existing = await DailyAPI.get(todayKey);
                if (!existing || cancelled) {
                    setAllowed(true);
                    return;
                }

                setFocus(existing.focus?.toString() ?? '');
                setExplanation(existing.explanation ?? '');
                setTasks(existing.tasks ?? '');
                setTool(existing.tool ?? '');

                setAllowed(true);
            } catch (err) {
                console.error(err);
                setBlockedReason('Unable to load daily reflection.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [todayKey]);

    async function handleSave(e) {
        e.preventDefault();
        setError(null);

        // simple guard: focus is required by form, but double-check
        if (!focus) {
            setError('Please select how the app affected your work today.');
            return;
        }

        const focusNumber = Number(focus);

        const payload = {
            focus: Number.isFinite(focusNumber) ? focusNumber : 0,
            explanation: explanation || null,
            tasks: tasks || null,
            tool: tool || null,
        };

        try {
            setSaving(true);
            await DailyAPI.set(todayKey, payload);
			//navigate("/home", { state: { reaction: birbReaction } });
			navigate("/home");
        } catch (err) {
            console.error('Failed to save daily survey', err);
            setError('Something went wrong while saving. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div id="dailyFormContainer" className='fader'>
                <h2>Daily Reflection</h2>
                <p>Loading...</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div id="dailyFormContainer" className='fader'>
                <h2>Daily Reflection</h2>
                <p class="errorreason">Loading...</p>
            </div>
        );
    }

    if (!allowed) {
        return (
            <div id="dailyFormContainer" className='fader'>
                <h2>Daily Reflection</h2>
                <p class="errorreason">{blockedReason}</p>
                <Link to="/home" className="daily-back-link">
                    ← Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div id="dailyFormContainer" className='fader'>
            <h2>Daily Reflection</h2>

            <form id="dailyForm" onSubmit={handleSave}>

                <label htmlFor="overallImpact" className="daily-label">
                    1. How well were you able to focus on your tasks today?
                </label>

                <select
                    id="overallImpact"
                    name="overallImpact"
                    className="daily-select"
                    required
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                >
                    <option value="">Select an option...</option>
                    <option value="-3">1 - Terrible focus</option>
                    <option value="-2">2</option>
                    <option value="-1">3</option>
                    <option value="0">4 - Average focus</option>
                    <option value="1">5</option>
                    <option value="2">6</option>
                    <option value="3">7 - Amazing focus</option>
                </select>

                <label htmlFor="whatDidYouDo" className="daily-label">
                    2. Can you briefly explain why you rated your focus this way?
                </label>
                <textarea
                    id="whatDidYouDo"
                    name="whatDidYouDo"
                    className="daily-textarea"
                    placeholder="Optional"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                />

                <label htmlFor="memorableMoment" className="daily-label">
                    3. What tasks did you work on during your focus session(s) today?
                </label>
                <textarea
                    id="memorableMoment"
                    name="memorableMoment"
                    className="daily-textarea"
                    placeholder="Optional"
                    value={tasks}
                    onChange={(e) => setTasks(e.target.value)}
                />

                <label htmlFor="motivationReflection" className="daily-label">
                    4. Did anything about the tool help or hinder your focus today?
                </label>
                <textarea
                    id="motivationReflection"
                    name="motivationReflection"
                    className="daily-textarea"
                    placeholder="Optional"
                    value={tool}
                    onChange={(e) => setTool(e.target.value)}
                />

                {error && (
                    <p className="daily-error">
                        {error}
                    </p>
                )}

                <button type="submit" id="dailySubmitButton" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </form>
        </div>
    );
}
