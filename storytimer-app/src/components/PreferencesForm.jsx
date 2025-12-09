import '../stylesheets/PreferencesForm.css';

import { useEffect, useState } from 'react';
import { PreferencesAPI, DaysAPI } from '../main/api';
import { Link, useNavigate } from "react-router-dom";


// helpers
function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getTodayGoalKey() {
    // 0 = Sunday, 1 = Monday, ...
    const weekday = new Date().getDay();
    const keys = ['sunGoal', 'monGoal', 'tueGoal', 'wedGoal', 'thuGoal', 'friGoal', 'satGoal'];
    return keys[weekday];
}

export default function PreferencesForm() {

    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState({
        monGoal: 120,
        tueGoal: 120,
        wedGoal: 120,
        thuGoal: 120,
        friGoal: 120,
        satGoal: 120,
        sunGoal: 120,
        sessionLength: 30
    });

	useEffect(() => {
		let mounted = true;
		PreferencesAPI.getAll().then((all) => {
			if (!mounted) return;
			setForm({
				monGoal: all.monGoal ?? 120,
				tueGoal: all.tueGoal ?? 120,
				wedGoal: all.wedGoal ?? 120,
				thuGoal: all.thuGoal ?? 120,
				friGoal: all.friGoal ?? 120,
				satGoal: all.satGoal ?? 120,
				sunGoal: all.sunGoal ?? 120,
				sessionLength: all.sessionLength ?? 30,
			});
		});
		return () => { mounted = false; };
	}, []);

    async function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setForm((f) => ({
			...f,
			[name]: type === 'checkbox' ? checked : value
		}));
    }

    async function handleSave(e) {
        e.preventDefault();
        console.log("Saving...");

        const patch = {
            monGoal: clamp(Number(form.monGoal), 0, 1440),
            tueGoal: clamp(Number(form.tueGoal), 0, 1440),
            wedGoal: clamp(Number(form.wedGoal), 0, 1440),
            thuGoal: clamp(Number(form.thuGoal), 0, 1440),
            friGoal: clamp(Number(form.friGoal), 0, 1440),
            satGoal: clamp(Number(form.satGoal), 0, 1440),
            sunGoal: clamp(Number(form.sunGoal), 0, 1440),
            sessionLength: clamp(Number(form.sessionLength), 0, 599),
        };

        // 1) Save preferences
        await PreferencesAPI.update(patch);

        // 2) Update today's day row goal if applicable
        try {
            const todayKey = getTodayGoalKey(); // e.g. "monGoal"
            const todaysGoal = patch[todayKey];

            if (typeof todaysGoal === 'number') {
                const date = todayISO();
                await DaysAPI.setGoal({ date, goal_min: todaysGoal });
            }
        } catch (err) {
            console.error('Failed to update today goal in days table', err);
        }

        // 3) Navigate back home
        navigate("/home", { state: { toast: "Preferences saved successfully!" } });
    }

    function handleBackClick(e) {
        e.preventDefault();
        setShowConfirm(true);
    }

    function confirmExit() {
        navigate("/home");
    }

    function cancelExit() {
        setShowConfirm(false);
    }

    return (
        <div id="preferencesFormContainer">
            <form id="preferencesForm" onSubmit={handleSave}>

                <p id="preferencesFormSubtitle">How many minutes do you plan to focus each day of the week?</p>
                <div id="preferencesFormLabelsContainer">

                    <label className="preferencesFormLabel">
                        <span>Monday:</span>
                        <span className="preferencesFormInputSpan"><input type="number" name="monGoal" min={0} max={1440} value={form.monGoal} onChange={handleChange}/> minutes</span>
                    </label>

                    <label className="preferencesFormLabel">
                        <span>Tuesday:</span>
                        <span className="preferencesFormInputSpan"><input type="number" name="tueGoal" min={0} max={1440} value={form.tueGoal} onChange={handleChange}/> minutes</span>
                    </label>

                    <label className="preferencesFormLabel">
                        <span>Wednesday:</span>
                        <span className="preferencesFormInputSpan"><input type="number" name="wedGoal" min={0} max={1440} value={form.wedGoal} onChange={handleChange}/> minutes</span>
                    </label>

                    <label className="preferencesFormLabel">
                        <span>Thursday:</span>
                        <span className="preferencesFormInputSpan"><input type="number" name="thuGoal" min={0} max={1440} value={form.thuGoal} onChange={handleChange}/> minutes</span>
                    </label>

                    <label className="preferencesFormLabel">
                        <span>Friday:</span>
                        <span className="preferencesFormInputSpan"><input type="number" name="friGoal" min={0} max={1440} value={form.friGoal} onChange={handleChange}/> minutes</span>
                    </label>

                    <label className="preferencesFormLabel">
                        <span>Saturday:</span>
                        <span className="preferencesFormInputSpan"><input type="number" name="satGoal" min={0} max={1440} value={form.satGoal} onChange={handleChange}/> minutes</span>
                    </label>

                    <label className="preferencesFormLabel">
                        <span>Sunday:</span>
                        <span className="preferencesFormInputSpan"><input type="number" name="sunGoal" min={0} max={1440} value={form.sunGoal} onChange={handleChange}/> minutes</span>
                    </label>

                </div>

                <p id="preferencesFormSubtitle">How long do you want individual focus sessions to be?</p>
                <div  id="preferencesFormLabelsContainer">
                    <label className="preferencesFormLabel">
                        <span>Session length:</span>
                        <span className="preferencesFormInputSpan"><input type="number" name="sessionLength" min={0} max={1440} value={form.sessionLength} onChange={handleChange}/> minutes</span>
                    </label>
                </div>

                <div id="preferencesFormButtonsContainer">

                    <button id="preferencesFormButtonBack" type="button" onClick={handleBackClick}>Back</button>

                    <button id="preferencesFormButtonSave" type="submit">Save</button>

                </div>

                {showConfirm && (
                    <div className="popupOverlay">
                        <div className="popupCard">
                            <p>Any changes will be lost. Are you sure?</p>
                            <div className="popupButtons">
                                <button type="button" onClick={cancelExit}>Cancel</button>
                                <button type="button" onClick={confirmExit}>Leave</button>
                            </div>
                        </div>
                    </div>
                )}

            </form>
        </div>
    )
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }