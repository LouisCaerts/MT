import '../stylesheets/WeeklyProgress.css';

import WeeklyProgressBadge from './WeeklyProgressBadge';
import { Flag } from "lucide-react";
import { useEffect, useRef, useState } from "react";


// helpers
const startOfLocalDayMs = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const startOfWeekMonday = (d = new Date()) => {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = addDays(d, -diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};
const nextMidnight = () => {
  const now = new Date();
  const m = new Date(now);
  m.setHours(24, 0, 0, 0);
  return m;
};
const toISODate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ORDER = [
  { key: 'monGoal', label: 'Mon', id: 'badgeMon' },
  { key: 'tueGoal', label: 'Tue', id: 'badgeTue' },
  { key: 'wedGoal', label: 'Wed', id: 'badgeWed' },
  { key: 'thuGoal', label: 'Thu', id: 'badgeThu' },
  { key: 'friGoal', label: 'Fri', id: 'badgeFri' },
  { key: 'satGoal', label: 'Sat', id: 'badgeSat' },
  { key: 'sunGoal', label: 'Sun', id: 'badgeSun' },
];

export default function WeeklyProgress({ day = "???" }) {
  const [stars, setStars] = useState({
    monGoal: false, tueGoal: false, wedGoal: false, thuGoal: false,
    friGoal: false, satGoal: false, sunGoal: false,
  });

  const timerRef = useRef(null);

  useEffect(() => {
    let abort = false;

    const loadStars = async () => {
      try {
        const monday = startOfWeekMonday(new Date());

        const allDays = await window.days.list();

        const dayByDate = {};
        for (const row of allDays) {
          dayByDate[row.date] = row;
        }

        const results = {};

        for (let i = 0; i < ORDER.length; i++) {
          const { key } = ORDER[i];

          const dateObj = addDays(monday, i);
          const dateStr = toISODate(dateObj);

          const row = dayByDate[dateStr];

          const hit = row ? (row.focused_min >= row.goal_min) : false;

          results[key] = !!hit;
        }

        if (!abort) setStars(results);
      } catch (e) {
        console.error('WeeklyProgress: failed to compute stars', e);
        if (!abort) {
          setStars({
            monGoal: false, tueGoal: false, wedGoal: false, thuGoal: false,
            friGoal: false, satGoal: false, sunGoal: false,
          });
        }
      }
    };

    loadStars();

    const arm = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const ms = Math.max(0, nextMidnight() - new Date());
      timerRef.current = setTimeout(() => {
        loadStars();
        arm();
      }, ms);
    };
    arm();

    const onFocus = () => loadStars();
    window.addEventListener('focus', onFocus);

    return () => {
      abort = true;
      window.removeEventListener('focus', onFocus);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [day]);

  return (
    <div id="progressContainer">

      <WeeklyProgressBadge id="badgeMon" showArrow={day === "monGoal"} showStar={stars.monGoal} label="Mon" />
      <WeeklyProgressBadge id="badgeTue" showArrow={day === "tueGoal"} showStar={stars.tueGoal} label="Tue" />
      <WeeklyProgressBadge id="badgeWed" showArrow={day === "wedGoal"} showStar={stars.wedGoal} label="Wed" />
      <WeeklyProgressBadge id="badgeThu" showArrow={day === "thuGoal"} showStar={stars.thuGoal} label="Thu" />
      <WeeklyProgressBadge id="badgeFri" showArrow={day === "friGoal"} showStar={stars.friGoal} label="Fri" />
      <WeeklyProgressBadge id="badgeSat" showArrow={day === "satGoal"} showStar={stars.satGoal} label="Sat" />
      <WeeklyProgressBadge id="badgeSun" showArrow={day === "sunGoal"} showStar={stars.sunGoal} label="Sun" />
    </div>
  );
}
