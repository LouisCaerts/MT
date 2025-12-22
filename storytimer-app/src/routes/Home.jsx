import '../stylesheets/Home.css';

import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { PreferencesAPI, DaysAPI, DailyAPI } from '../main/api';
import { TRIGGERS, getBirbReaction } from "../main/reactions";

import WeeklyProgress from '../components/WeeklyProgress';
import DailyProgress from '../components/DailyProgress';
import HomeBirb from '../components/HomeBirb';

import birb_sad from '../images/avatars/birb_sad.png';
import birb_neutral from '../images/avatars/birb_neutral.png';
import birb_happy from '../images/avatars/birb_happy.png';
import cheep_1 from "../sounds/effects/cheep_1.mp3";
import cheep_2 from "../sounds/effects/cheep_2.mp3";
import cheep_3 from "../sounds/effects/cheep_3.mp3";
const CHEEPS = [cheep_1, cheep_2, cheep_3];

export const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
export const getTodayKey = (d = new Date()) => `${DAY_KEYS[d.getDay()]}Goal`;

function playRandomCheep(volume = 0.4) {
	const src = CHEEPS[Math.floor(Math.random() * CHEEPS.length)];
	const audio = new Audio(src);
	audio.volume = volume;
	audio.play().catch(() => { });
}

const nextMidnight = () => {
  const now = new Date();
  const m = new Date(now);
  m.setHours(24, 0, 0, 0);
  return m;
};

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Home() {
	const [goal, setGoal] = useState(120);
	const [todayKey, setTodayKey] = useState(getTodayKey());
	const [todayFocusMin, setTodayFocusMin] = useState(0);

	const [group, setGroup] = useState('');
	const [dayCountAll, setDayCountAll] = useState(0);
	const [dayCountExclToday, setDayCountExclToday] = useState(0);

	const [didFocusToday, setDidFocusToday] = useState(false);
	const [doneDaily, setDoneDaily] = useState(false);
	const [doneGoal, setDoneGoal] = useState(false);

	const [toast, setToast] = useState(null);
	const [birbReaction, setBirbReaction] = useState(null);
	const [birbMood, setBirbMood] = useState(null);
  	const birbByMood = {
		sad: birb_sad,
		neutral: birb_neutral,
		happy: birb_happy,
	};
	const showBirb =
		(group === "A" && dayCountExclToday >= 4) ||
		(group === "B" && dayCountExclToday < 4);

	const timerRef = useRef(null);
	const prevFocusRef = useRef(0);
	const prevDoneDailyRef = useRef(false);
	const navigate = useNavigate();
	const location = useLocation();

	function fireBirb(trigger, emotion = null) {
		const reaction = getBirbReaction({
			trigger,
			goalMin: goal,
			focusedMin: todayFocusMin,
			now: new Date(),
		});
		if (reaction?.text) navigate(location.pathname, { replace: true, state: {reaction: reaction?.text, mood: reaction?.mood } });
	}

	useEffect(() => {
		const run = async () => {
		const prev = prevFocusRef.current;
		const firstSessionNow = (prev === 0 && todayFocusMin > 0);
		const goalCompletedNow = (goal > 0 && todayFocusMin >= goal);
		if (!firstSessionNow && !goalCompletedNow) {
			prevFocusRef.current = todayFocusMin;
			return;
		}

		const day = await DaysAPI.get(todayISO());
		if (!day) {
			prevFocusRef.current = todayFocusMin;
			return;
		}

		const alreadyFirst = !!day.first_session_done;
		const alreadyGoal = !!day.goal_reached;

		if (goalCompletedNow && !alreadyGoal) {
			fireBirb(TRIGGERS.GOAL_COMPLETED);
		} else if (firstSessionNow && !alreadyFirst) {
			fireBirb(TRIGGERS.FIRST_SESSION_DONE);
		}

		if (firstSessionNow && !alreadyFirst) {
			await DaysAPI.setFirst({ date: todayISO(), first_session_done: 1 });
		}

		if (goalCompletedNow && !alreadyGoal) {
			await DaysAPI.setGoalReached({ date: todayISO(), goal_reached: 1 });
		}

		prevFocusRef.current = todayFocusMin;
		};

		run();

	}, [todayFocusMin, goal]);

	useEffect(() => {
		const run = async () => {
			const prev = prevDoneDailyRef.current;

			if (!prev && doneDaily) {
				const day = await DaysAPI.get(todayISO());
				const alreadyTaken = !!day.survey_taken;
				if (day && !alreadyTaken) {
					fireBirb(TRIGGERS.REFLECTION_COMPLETED);
					await DaysAPI.setSurveyTaken({ date: todayISO(), survey_taken: 1 });
				}
			}

			prevDoneDailyRef.current = doneDaily;
		};
		run();
	}, [doneDaily]);
	

  useEffect(() => {
    let abort = false;

    const requireTodayRowOrRedirect = async () => {
      try {
        const day = await DaysAPI.get(todayISO());
        if (!day) throw new Error();
        return true;
      } catch {
        navigate("/intro", { replace: true });
        return false;
      }
    };

    const loadToday = async () => {
      setTodayKey(getTodayKey());

      const day = await DaysAPI.get(todayISO());
      if (!abort) setGoal(day?.goal_min ?? 120);

      const prefs = await PreferencesAPI.getAll();
      if (!abort) setGroup(prefs?.group ?? '');
    };

    const loadTodayFocus = async () => {
      const day = await DaysAPI.get(todayISO());
      if (!abort) setTodayFocusMin(day?.focused_min ?? 0);
    };

    const loadUsageCounts = async () => {
      const days = await DaysAPI.list();
      if (abort) return;

      const arr = Array.isArray(days) ? days : Object.values(days || {});
      const today = todayISO();

      const usedDaysAll = arr.filter(d => (d.focused_min ?? 0) > 0);
      setDayCountAll(usedDaysAll.length);
      setDayCountExclToday(usedDaysAll.filter(d => d.date !== today).length);
	};

    const loadChecklist = async () => {
      const daily = await DailyAPI.get(todayISO());
      if (!abort) setDoneDaily(!!daily);

      const day = await DaysAPI.get(todayISO());
      if (!abort) {
        const f = day?.focused_min ?? 0;
        const g = day?.goal_min ?? 0;
        setDoneGoal(g > 0 && f >= g);
      }
    };

    const armMidnight = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await loadToday();
        await loadTodayFocus();
        await loadUsageCounts();
        await loadChecklist();
        armMidnight();
      }, Math.max(0, nextMidnight() - new Date()));
    };

    (async () => {
      if (!(await requireTodayRowOrRedirect())) return;
      await loadToday();
      await loadTodayFocus();
      await loadUsageCounts();
      await loadChecklist();
      armMidnight();
    })();

    const onFocus = async () => {
      if (!(await requireTodayRowOrRedirect())) return;
      await loadToday();
      await loadTodayFocus();
      await loadUsageCounts();
      await loadChecklist();
    };

    window.addEventListener('focus', onFocus);
    return () => {
      abort = true;
      window.removeEventListener('focus', onFocus);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setDidFocusToday(todayFocusMin > 0);
  }, [todayFocusMin]);

  	useEffect( () => {
		// if (location.state?.toast) {
		//   setToast(location.state.toast);
		//   navigate(location.pathname, { replace: true, state: {} });
		//   setTimeout(() => setToast(null), 4000);
		// }
		const runrun = async () => {
			if (showBirb) {
				const days = await DaysAPI.list();
				if (!days) return;

				const arr = Array.isArray(days) ? days : Object.values(days || {});
				const today = todayISO();

				const usedDaysAll = arr.filter(d => (d.focused_min ?? 0) > 0);
				const daysall = usedDaysAll.length;
				const useddaysall = usedDaysAll.filter(d => d.date !== today).length;

				if (group === "A" && daysall < 4) return;
				if (group === "B" && useddaysall >= 4) return;

				if (!location.state?.reaction) return;

				setBirbReaction(location.state.reaction);
				if (location.state?.mood) setBirbMood(location.state.mood);

				navigate(location.pathname, { replace: true, state: {} });
				setTimeout(() => setBirbReaction(null), 10000);

				if (group === "A" && useddaysall >= 4) playRandomCheep();
				if (group === "B" && useddaysall < 4) playRandomCheep();
			}
		};
		runrun();

	}, [location.state?.reaction, location.state?.mood, showBirb, navigate, location.pathname]);

  return (
    <div id="sidebarsContainer" className='fader'>
      <div id="homeContainer">
        <WeeklyProgress day={todayKey} />
        <DailyProgress key={todayKey} goal={goal} progress={todayFocusMin} />

        {toast && <div className="toast">{toast}</div>}

        <div className="daily-checklist">
          <h2 className="daily-checklist__title">Daily study tasks:</h2>

          <p>
            <span className="daily-checklist__check">
              {didFocusToday ? '☑' : '☐'}
            </span>
            Complete at least one focus session
          </p>

          <p>
            <span className="daily-checklist__check">
              {doneDaily ? '☑' : '☐'}
            </span>
            <Link to="/daily">Fill in the daily reflection</Link>
          </p>

          <p>
            <span className="daily-checklist__check">
              {doneGoal ? '☑' : '☐'}
            </span>
            (Optional) Complete your focus goal of {goal} minutes
          </p>

          <p id="dayCountNumber">
            Days you have used the app: {dayCountAll} out of 8
          </p>
        </div>
      </div>

      <div id="rightbarContainer">
        <div id="rightbarLinksContainer">
			{showBirb && <HomeBirb />}
			{showBirb && birbReaction && (
				<div className="birbSpeech">
					<div id="birbSpeechInner">
						{birbMood && (<div className="birbMoodRow2">
							<img className="birbPortrait2" src={birbByMood[birbMood]} alt="Birb mood portrait"/>
							<p className="birbMoodText2"></p>
						</div>)}
						<p id="birbSpeechText">{birbReaction}</p>
					</div>
				</div>)}
        </div>
      </div>
    </div>
  );
}
