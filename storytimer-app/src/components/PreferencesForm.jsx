import '../stylesheets/PreferencesForm.css';

import { useEffect, useState } from 'react';
import { PreferencesAPI } from '../main/api';
import { Link, useNavigate } from "react-router-dom";

export default function PreferencesForm() {

    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState({
        sessionLength: 30,
        username: "Buddy",
        group: 'A'
    });

	useEffect(() => {
		let mounted = true;
		PreferencesAPI.getAll().then((all) => {
			if (!mounted) return;
			setForm({
				sessionLength: all.sessionLength ?? 30,
                username: all.username ?? "Buddy",
                group: all.group ?? 'A',
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
            sessionLength: clamp(Number(form.sessionLength), 0, 599),
            username: form.username?.trim() || "Buddy",
            group: form.group?.trim() || 'A'
        };

        // Save preferences
        await PreferencesAPI.update(patch);
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
        <div id="preferencesFormContainer" className='fader'>
            <form id="preferencesForm" onSubmit={handleSave}>

                <p id="preferencesFormSubtitle">
                    How long do you want individual focus sessions to be?
                </p>

                <div id="preferencesFormLabelsContainer">
                    <label className="preferencesFormLabel">
                        <span>Session length:</span>
                        <span className="preferencesFormInputSpan">
                            <input
                                type="number"
                                name="sessionLength"
                                min={0}
                                max={599}
                                value={form.sessionLength}
                                onChange={handleChange}
                            /> minutes
                        </span>
                    </label>
                </div>

                <p id="preferencesFormSubtitle">
                    What would you like to be called?
                </p>

                <div id="preferencesFormLabelsContainer">
                    <label className="preferencesFormLabel">
                        <span>My name is </span>
                        <span className="preferencesFormInputSpan">
                            <input
                                type="text"
                                name="username"
                                placeholder="Buddy"
                                value={form.username}
                                onChange={handleChange}
                            />
                        </span>

                        <span> | Assigned group: </span>

                        <span className="preferencesFormInputSpan">
                            <select
                                name="group"
                                value={form.group}
                                onChange={handleChange}
                            >
                                <option value="" disabled>Select group</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                            </select>
                        </span>
                    </label>
                </div>

                <div id="preferencesFormButtonsContainer">
                    <button
                        id="preferencesFormButtonBack"
                        type="button"
                        onClick={handleBackClick}
                    >
                        Back
                    </button>

                    <button
                        id="preferencesFormButtonSave"
                        type="submit"
                    >
                        Save
                    </button>
                </div>

                {showConfirm && (
                    <div className="popupOverlay">
                        <div className="popupCard">
                            <p>Any changes will be lost. Are you sure?</p>
                            <div className="popupButtons">
                                <button type="button" onClick={cancelExit}>
                                    Cancel
                                </button>
                                <button type="button" onClick={confirmExit}>
                                    Leave
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </form>
        </div>
    );
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
