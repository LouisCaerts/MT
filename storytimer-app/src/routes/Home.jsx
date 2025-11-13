import '../stylesheets/Home.css';

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { PreferencesAPI } from '../main/api';

import WeeklyProgress from '../components/WeeklyProgress';
import DailyProgress from '../components/DailyProgress';

export const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
export const getTodayKey = (d = new Date()) => `${DAY_KEYS[d.getDay()]}Goal`;

// helper functions
const nextMidnight = () => {
	const now = new Date();
	const m = new Date(now);
	m.setHours(24, 0, 0, 0);
	return m;
};
const startOfLocalDayMs = (d = new Date()) => {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x.getTime();
};
const startOfNextLocalDayMs = (d = new Date()) => {
	return startOfLocalDayMs(d) + 24 * 60 * 60 * 1000;
};


export default function Home() {
	const [goal, setGoal] = useState(120);
	const [todayKey, setTodayKey] = useState(getTodayKey());
  	const [todayFocusMin, setTodayFocusMin] = useState(0);
	const timerRef = useRef(null);

	// midnight remount
	useEffect(() => {
		let abort = false;

		// loads daily goal from preferences (existing)
		const loadToday = async () => {
			const prefs = await PreferencesAPI.getAll();
			if (abort) return;
			const k = getTodayKey();
			setTodayKey(k);
			setGoal(prefs?.[k] ?? 120);
		};

		// load today's focus sum from SQLite via preload
		const loadTodayFocus = async () => {
			try {
				const fromMs = startOfLocalDayMs();
				const toMs   = startOfNextLocalDayMs();
				const totalSec = await window.sessions.sumByRange({ fromMs, toMs });
				if (abort) return;
				setTodayFocusMin(Math.floor((totalSec || 0) / 60));
			} catch (e) {
				console.error('Failed to load today focus minutes', e);
				if (abort) return;
				setTodayFocusMin(0);
			}
		};

		const arm = () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			const ms = Math.max(0, nextMidnight() - new Date());
			timerRef.current = setTimeout(async () => {
				await loadToday();
				await loadTodayFocus();   // refresh at midnight rollover
				arm();
			}, ms);
		};

		// initial loads
		loadToday();
		loadTodayFocus();
		arm();

		const onFocus = () => { loadToday(); loadTodayFocus(); arm(); };
		window.addEventListener('focus', onFocus);

		return () => {
			abort = true;
			window.removeEventListener('focus', onFocus);
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	// saved preferences notification
	const location = useLocation();
	const navigate = useNavigate();
	const [toast, setToast] = useState(null);

	useEffect(() => {
		if (location.state?.toast) {
			setToast(location.state.toast);
			navigate(location.pathname, { replace: true, state: {} });
			setTimeout(() => setToast(null), 4000);
		}
	}, [location, navigate]);

	return (
		<div id="homeContainer">
			<WeeklyProgress day={todayKey} />
			<DailyProgress key={todayKey} goal={goal} progress={todayFocusMin} />

			{toast && <div className="toast">{toast}</div>}
		</div>
	);
}
