import '../stylesheets/Home.css';

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { PreferencesAPI } from '../main/api';

import WeeklyProgress from '../components/WeeklyProgress';
import DailyProgress from '../components/DailyProgress';

export const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
export const getTodayKey = (d = new Date()) => `${DAY_KEYS[d.getDay()]}Goal`;

const nextMidnight = () => {
	const now = new Date();
	const m = new Date(now);
	m.setHours(24, 0, 0, 0);
	return m;
};

export default function Home() {
	const [goal, setGoal] = useState(120);
	const [todayKey, setTodayKey] = useState(getTodayKey());
	const timerRef = useRef(null);

	useEffect(() => {
		let abort = false;

		const loadToday = async () => {
			const prefs = await PreferencesAPI.getAll();
			if (abort) return;
			const k = getTodayKey();
			setTodayKey(k);
			setGoal(prefs?.[k] ?? 120);
		};

		const arm = () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			const ms = Math.max(0, nextMidnight() - new Date());
			timerRef.current = setTimeout(async () => {
				await loadToday();
				arm();
			}, ms);
		};

		loadToday();
		arm();

		const onFocus = () => { loadToday(); arm(); };
		window.addEventListener('focus', onFocus);

		return () => {
			abort = true;
			window.removeEventListener('focus', onFocus);
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

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
			<DailyProgress key={todayKey} goal={goal} />

			{toast && <div className="toast">{toast}</div>}
		</div>
	);
}
