import '../stylesheets/Goalsetter.css';
import birb_sad from '../images/avatars/birb_sad.png';
import birb_neutral from '../images/avatars/birb_neutral.png';
import birb_happy from '../images/avatars/birb_happy.png';
import { TRIGGERS, getBirbReaction } from "../main/reactions.js";

import { useNavigate, Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { DaysAPI, PreferencesAPI } from '../main/api';


function todayISO() {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

export default function Goalsetter({ }) {
	const [goalMinutes, setGoalMinutes] = useState(10);
	const [group, setGroup] = useState('');
	const [dayCountAll, setDayCountAll] = useState(0);
	const [dayCountExclToday, setDayCountExclToday] = useState(0);
	const [birbReaction, setBirbReaction] = useState(getBirbReaction({
														trigger: TRIGGERS.GOAL_SET,
														goalMinutes,
														focusedMin: 0,
													}).text);


	const MAX_GOAL = 120;
	const NEUTRAL_THRESHOLD = 30;
	const GOOD_THRESHOLD = 120;

	const clamped = Math.max(0, Math.min(goalMinutes, MAX_GOAL));
	const ratio = clamped / MAX_GOAL;
	const percent = ratio * 100;
	const birbByMood = {
		sad: birb_sad,
		neutral: birb_neutral,
		happy: birb_happy,
	};
	let birbMood = "sad";
	const navigate = useNavigate();


	if (goalMinutes >= GOOD_THRESHOLD) {
		birbMood = "happy";
	} else if (goalMinutes >= NEUTRAL_THRESHOLD) {
		birbMood = "neutral";
	}

	//////////////////////////////////////////////////////////////////////////////

	useEffect(() => {
		let abort = false;

		const loadGateData = async () => {
			try {
				// 1) group from preferences
				const prefs = await PreferencesAPI.getAll();
				if (abort) return;
				setGroup(prefs?.group ?? '');

				// 2) dayCount = number of USED days (focus > 0)
				const days = await DaysAPI.list();
				if (abort) return;

				const arr = Array.isArray(days) ? days : Object.values(days || {});
				const today = todayISO();

				// USED DAYS (focus > 0), ALL
				const usedDaysAll = arr.filter(day => {
				const focusMin = day.focused_min ?? day.focus_min ?? day.focusMin ?? 0;
				return focusMin > 0;
				});
				setDayCountAll(usedDaysAll.length);

				// USED DAYS (focus > 0), EXCLUDING TODAY
				const usedDaysExclToday = usedDaysAll.filter(day => day.date !== today);
				setDayCountExclToday(usedDaysExclToday.length);


			} catch (e) {
				console.error("Failed to load group/dayCount for gating", e);
			}
		};

		loadGateData();
		return () => { abort = true; };
	}, []);

	const showBirb = (group === "A" && dayCountExclToday >= 4) || (group === "B" && dayCountExclToday < 4);


	async function handleCommitGoal() {
		console.log("Commit button pressed", goalMinutes);

		try {
			const goalMin = Math.max(0, Math.min(Number(goalMinutes), 1440));
			const date = todayISO();

			await DaysAPI.ensure({ date, goal_min: goalMin });

			navigate("/home", { state: { toast: "Goal set for today!", reaction: birbReaction, mood:birbMood } });
		} catch (err) {
			console.error("Failed to save goal to days table", err);
		}
	}


	return (
		<div id="goalContainer" className='fader'>
			<h2 id="goalPrompt">How long do you aim to focus today?</h2>
			{showBirb && <p id="goalSubPrompt">Set a high enough goal to help Birb have a good day!</p>}

			{/* (1) Minutes input */}
			<div className="goalInputRow">
				<input
					id="goalMinutes"
					className="goalInput"
					type="number"
					min={0}
					step={5}
					value={goalMinutes}
					onChange={(e) => {
						const v = Number(e.target.value);
						const goalMin = Number.isFinite(v) ? v : 0;

						setGoalMinutes(goalMin);

						const reactionText = getBirbReaction({
							trigger: TRIGGERS.GOAL_SET,
							goalMin,
							focusedMin: 0,
						}).text;

						setBirbReaction(reactionText);

						console.log("Birb reaction:", reactionText);
					}}
				/>
				<span className="goalUnit">min</span>
			</div>

			{/* (2) Milestone bar */}
			{showBirb && (
				<div className="goalBarArea" aria-label="Goal progress preview">
					<div className="goalBarTrack">
						{/* Filled part */}
						<div className="goalBarFill" style={{ width: `${percent}%` }} />
					</div>

					<div id="goalTicksWrapper">
						<span id="tick_0" className="goalTickContainer">
							<span className="goalTick" data-label="0">|</span>
							<span className="goalTickLabel">0</span>
						</span>
						<span id="tick_30" className="goalTickContainer">
							<span className="goalTick" data-label="30">|</span>
							<span className="goalTickLabel">30</span>
						</span>
						<span id="tick_120" className="goalTickContainer">
							<span className="goalTick" data-label="120">|</span>
							<span className="goalTickLabel">120+</span>
						</span>
					</div>

				</div>
			)}

			{/* (3) Birb portrait (sad/neutral/happy) */}
			{showBirb && (
				<div className="birbMoodRow">
					<img className="birbPortrait" src={birbByMood[birbMood]} alt="Birb mood portrait"/>
					<p className="birbMoodText">
					</p>
				</div>
			)}

			{/* Optional action */}
			<button className="goalSaveBtn" type="button" onClick={handleCommitGoal}		>
				Commit to goal
			</button>

		</div>
	)
}