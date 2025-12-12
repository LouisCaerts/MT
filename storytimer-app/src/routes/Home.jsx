import '../stylesheets/Home.css';

import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { PreferencesAPI, DaysAPI, DailyAPI } from '../main/api';
import { Lock } from "lucide-react";

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
const todayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`; // e.g. "2025-12-02"
};


export default function Home() {
	const [goal, setGoal] = useState(120);
	const [todayKey, setTodayKey] = useState(getTodayKey());
  	const [todayFocusMin, setTodayFocusMin] = useState(0);
	const timerRef = useRef(null);
	const [dayCount, setDayCount] = useState(0);
	const [completedCount, setCompletedCount] = useState(0);
	const [completedCountTwo, setCompletedCountTwo] = useState(0);
	const [group, setGroup] = useState('');
	const [didFocusToday, setDidFocusToday] = useState(false);
	const [doneDaily, setDoneDaily] = useState(false);
	const [doneGoal, setDoneGoal] = useState(false);

	// midnight remount
	useEffect(() => {
		let abort = false;

		// loads daily goal from preferences (existing)
		const loadToday = async () => {
			const prefs = await PreferencesAPI.getAll();
			if (abort) return;

			const k = getTodayKey();
			setTodayKey(k);

			const newGoal = prefs?.[k] ?? 120;
			setGoal(newGoal);

			const newGroup = prefs?.group ?? '';
			setGroup(newGroup);

			try {
				const date = todayISO();
				await DaysAPI.ensure({ date, goal_min: newGoal });
			} catch (e) {
				console.error('Failed to ensure day row', e);
			}
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

		// load all days and compute how many goals were met
		const loadCompletedDays = async () => {
			try {
				const days = await DaysAPI.list();
				if (abort) return;

				const arr = Array.isArray(days) ? days : Object.values(days || {});

				// 1️⃣ USED DAYS (focus > 0)
				const usedDays = arr.filter(day => {
					const focusMin = day.focused_min ?? day.focus_min ?? day.focusMin ?? 0;
					return focusMin > 0;
				});
				setDayCount(usedDays.length);

				// 2️⃣ COMPLETED DAYS (all of them, global)
				const completedDays = arr.filter(day => {
					const goalMin  = day.goal_min ?? day.goalMin ?? day.goal ?? 0;
					const focusMin = day.focused_min ?? day.focus_min ?? day.focusMin ?? 0;
					return goalMin > 0 && focusMin >= goalMin;
				});
				setCompletedCount(completedDays.length);

				// 3️⃣ SORT USED DAYS BY DATE (oldest → newest)
				const usedDaysSorted = [...usedDays].sort((a, b) => {
					const da = new Date(a.date);
					const db = new Date(b.date);
					return da - db;
				});

				// 4️⃣ REMOVE THE FIRST FIVE USED DAYS
				const usedDaysAfterFive = usedDaysSorted.slice(5);

				// 5️⃣ COUNT HOW MANY OF *THESE* are completed
				const completedDaysTwo = usedDaysAfterFive.filter(day => {
					const goalMin  = day.goal_min ?? 0;
					const focusMin = day.focused_min ?? 0;
					return goalMin > 0 && focusMin >= goalMin;
				}).length;

				setCompletedCountTwo(completedDaysTwo);

			} catch (e) {
				console.error("Failed to load completed days", e);
			}
		};

		const useDidFillDailyReflection = async () => {
			try {
				const dateKey = todayISO();
				const daily = await DailyAPI.get(dateKey);
				if (abort) return;
				setDoneDaily(!!daily);
				console.log("Checked daily reflection:", doneDaily);
			} catch (e) {
				console.error("Failed to check daily reflection", e);
				return;
			}
		}

		const useDidFinishGoal = async () => {
			try {
				const dateKey = todayISO();
				console.log("Checking goal completion for", dateKey);
				const day = await DaysAPI.get(dateKey);
				if (abort) return;
				setDoneGoal(day.focused_min >= day.goal_min);
			} catch (e) {
				console.error("Failed to check goal completion", e);
				return;
			}
		}

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
		loadCompletedDays();
		useDidFillDailyReflection();
		useDidFinishGoal();
		arm();

		const onFocus = () => { loadToday(); loadTodayFocus(); loadCompletedDays(); useDidFillDailyReflection(); useDidFinishGoal(); arm(); };
		window.addEventListener('focus', onFocus);

		return () => {
			abort = true;
			window.removeEventListener('focus', onFocus);
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	useEffect(() => {
		if ( todayFocusMin > 0 ) {
			setDidFocusToday(true);
		}
		else {
			setDidFocusToday(false);
		}
	}, [todayFocusMin]);

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
		<div id="sidebarsContainer">


			<div id="homeContainer">
				<WeeklyProgress day={todayKey} />
				<DailyProgress key={todayKey} goal={goal} progress={todayFocusMin} />

				{toast && <div className="toast">{toast}</div>}

				<div class="daily-checklist">
					<h2 class="daily-checklist__title">Daily study tasks:</h2>
					<p>
						<span class="daily-checklist__check" role="checkbox" aria-checked="false" aria-label="Complete at least one focus session">
							{ didFocusToday ? '☑' : '☐' }
						</span>
						<span class="daily-checklist__text">
							Complete at least one focus session
						</span>
					</p>
					<p id="tasktwo">
						<span class="daily-checklist__check" role="checkbox" aria-checked="false" aria-label="Fill in the daily reflection">
							{ doneDaily ? '☑' : '☐' }
						</span>
						<span class="daily-checklist__text" >
							<Link to="/daily">Fill in the daily reflection</Link>
						</span>
					</p>
					<p id="tasktwo">
						<span class="daily-checklist__check" role="checkbox" aria-checked="false" aria-label="Reach your goal">
							{ doneGoal ? '☑' : '☐' }
						</span>
						<span class="daily-checklist__text" >
							(Optional) Complete your focus goal of {goal} minutes
						</span>
					</p>
				</div>

			</div>
			
			<div id="rightbarContainer">
				<div id="rightbarLinksContainer">

					{group === "A" && dayCount >= 5 && (
					<div id="groupAContainer">
						<button className={`rightbarLink ${completedCountTwo >= 1 ? '' : 'disabled'}`} disabled={completedCountTwo < 1}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_1">Day 1 story</Link>
						</button>

						<button className={`rightbarLink ${completedCountTwo >= 2 ? '' : 'disabled'}`} disabled={completedCountTwo < 2}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_2">Day 2 story</Link>
						</button>

						<button className={`rightbarLink ${completedCountTwo >= 3 ? '' : 'disabled'}`} disabled={completedCountTwo < 3}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_3">Day 3 story</Link>
						</button>

						<button className={`rightbarLink ${completedCountTwo >= 4 ? '' : 'disabled'}`} disabled={completedCountTwo < 4}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_4">Day 4 story</Link>
						</button>

						<button className={`rightbarLink ${completedCountTwo >= 5 ? '' : 'disabled'}`} disabled={completedCountTwo < 5}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_5">Day 5 story</Link>
						</button>
					</div>
					)}

					{group === "B" && dayCount < 6 && (
					<div id="groupBContainer">
						<button className={`rightbarLink ${completedCount >= 1 ? '' : 'disabled'}`} disabled={completedCount < 1}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_1">Day 1 story</Link>
						</button>

						<button className={`rightbarLink ${completedCount >= 2 ? '' : 'disabled'}`} disabled={completedCount < 2}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_2">Day 2 story</Link>
						</button>

						<button className={`rightbarLink ${completedCount >= 3 ? '' : 'disabled'}`} disabled={completedCount < 3}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_3">Day 3 story</Link>
						</button>

						<button className={`rightbarLink ${completedCount >= 4 ? '' : 'disabled'}`} disabled={completedCount < 4}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_4">Day 4 story</Link>
						</button>

						<button className={`rightbarLink ${completedCount >= 5 ? '' : 'disabled'}`} disabled={completedCount < 5}>
							<Lock className="lockIcon" size={16} />
							<Link to="/story_day_5">Day 5 story</Link>
						</button>
					</div>
					)}
					
					<div id="dayCountDisplay">
						<p id="dayCountNumber">Days you have used the app: {dayCount}</p>
					</div>

				</div>
			</div>
		</div>

	);
}


// <div className="hamburgerLinkWrapper"><Link className="hamburgerLink" to="/home" onClick={() => setOpen(false)}>Home</Link></div>