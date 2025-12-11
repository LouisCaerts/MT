import '../stylesheets/DailyForm.css';

import { useEffect, useState } from 'react';
import { DailyAPI } from '../main/api.js';
import { useNavigate } from "react-router-dom";

export default function DailyForm() {
    const navigate = useNavigate();

    // use ISO date string as key, same as days table likely uses
    const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const [workDone, setWorkDone] = useState('');
    const [impact, setImpact] = useState(''); // keep as string for the select
    const [memorable, setMemorable] = useState('');
    const [motivation, setMotivation] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Load existing survey for today (if any) so users can edit
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const existing = await DailyAPI.get(todayKey);
                if (!existing || cancelled) return;

                setWorkDone(existing.work_done ?? '');
                // impact is INTEGER in DB
                if (existing.impact !== null && existing.impact !== undefined) {
                    setImpact(String(existing.impact));
                }
                setMemorable(existing.memorable ?? '');
                setMotivation(existing.motivation ?? '');
            } catch (err) {
                console.error('Failed to load daily survey', err);
                // you can setError here if you want UI feedback
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

        // simple guard: impact is required by form, but double-check
        if (!impact) {
            setError('Please select how the app affected your work today.');
            return;
        }

        const impactNumber = Number(impact);

        const payload = {
            work_done: workDone || null,
            impact: Number.isFinite(impactNumber) ? impactNumber : 0,
            memorable: memorable || null,
            motivation: motivation || null,
        };

        try {
            setSaving(true);
            await DailyAPI.set(todayKey, payload);
            // after save, go back home or wherever is appropriate
            navigate('/home');
        } catch (err) {
            console.error('Failed to save daily survey', err);
            setError('Something went wrong while saving. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div id="dailyFormContainer">
                <h2>Daily Reflection</h2>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div id="dailyFormContainer">
            <h2>Daily Reflection</h2>

            <form id="dailyForm" onSubmit={handleSave}>

                <label htmlFor="whatDidYouDo" className="daily-label">
                    1. What did you do during your focus sessions?
                </label>
                <textarea
                    id="whatDidYouDo"
                    name="whatDidYouDo"
                    className="daily-textarea"
                    placeholder="Optional"
                    value={workDone}
                    onChange={(e) => setWorkDone(e.target.value)}
                />

                <label htmlFor="overallImpact" className="daily-label">
                    2. Overall, how did this application affect your work today?
                </label>

                <select
                    id="overallImpact"
                    name="overallImpact"
                    className="daily-select"
                    required
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                >
                    <option value="">Select an option...</option>
                    <option value="-3">Much worse</option>
                    <option value="-2">Worse</option>
                    <option value="-1">Slightly worse</option>
                    <option value="0">No change</option>
                    <option value="1">Slightly better</option>
                    <option value="2">Better</option>
                    <option value="3">Much better</option>
                </select>

                <label htmlFor="memorableMoment" className="daily-label">
                    3. Describe the most memorable moment today where you thought of or interacted with the app.
                </label>
                <textarea
                    id="memorableMoment"
                    name="memorableMoment"
                    className="daily-textarea"
                    placeholder="Optional"
                    value={memorable}
                    onChange={(e) => setMemorable(e.target.value)}
                />

                <label htmlFor="motivationReflection" className="daily-label">
                    4. What, if anything, about the app felt motivating or demotivating today?
                </label>
                <textarea
                    id="motivationReflection"
                    name="motivationReflection"
                    className="daily-textarea"
                    placeholder="Optional"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
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
