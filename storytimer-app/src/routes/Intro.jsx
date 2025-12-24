import '../stylesheets/Intro.css';
import birb_sad from '../images/avatars/birb_sad.png';
import birb_neutral from '../images/avatars/birb_neutral.png';
import birb_happy from '../images/avatars/birb_happy.png';
import { TRIGGERS, getBirbReaction } from "../main/reactions.js";
import cheep_1 from "../sounds/effects/cheep_1.mp3";

import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { PreferencesAPI, DaysAPI } from "../main/api";


function todayISO() {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function yesterdayISO() {
	let d = new Date();;
    d.setDate(d.getDate() - 1);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

export default function Intro({ }) {
    const [username, setUsername] = useState("Buddy");
    const [group, setGroup] = useState("A");
    const [lastGoal, setLastGoal] = useState(0);
    const [lastFocus, setLastFocus] = useState(0);
    const [isFirstDay, setIsFirstDay] = useState(true);
    const [isNarrativeMode, setIsNarrativeMode] = useState(false);
    const [pastDaysUsedCount, setPastDaysUsedCount] = useState(0);
    const [birbReaction, setBirbReaction] = useState("Let's work hard today!")
    const [birbMood, setBirbMood] = useState("neutral");
    const birbByMood = {
            sad: birb_sad,
            neutral: birb_neutral,
            happy: birb_happy,
    };

    const navigate = useNavigate();

    useEffect(() => {
        let abort = false;

        // load username
        const loadUsername = async () => {
            try {
                const prefs = await PreferencesAPI.get();
                if (abort) return;
                setUsername(prefs?.username ?? "Buddy");
                return (prefs?.username ?? "Buddy");
            } catch (err) {
                console.error("Failed to load username:", err);
            }
        };

        // load group
        const loadGroup = async () => {
            try {
                const prefs = await PreferencesAPI.get();
                if (abort) return;
                setGroup(prefs?.group ?? "A");
                return (prefs?.group ?? "A");
            } catch (err) {
                console.error("Failed to load username:", err);
            }
        };

        // load last day (if it exists)
        const loadLastDay = async () => {
            try {
                const days = await DaysAPI.list();
                const arr = Array.isArray(days) ? days : Object.values(days || {});
                const today = todayISO();
                const usedDays = arr.filter(d => (Number(d.focused_min ?? d.focus_min ?? d.focusMin ?? 0) > 0)).filter(d => d.date && d.date !== today);

                usedDays.sort((a, b) => String(b.date).localeCompare(String(a.date)));
                const last = usedDays[0];

                if (last) {
                    console.log(last.focused_min >= 30);
                    setLastGoal(last.goal_min);
                    setLastFocus(last.focused_min);
                    if (last.focused < 30) {
                        setBirbMood("sad");
                        setBirbReaction(`${last.focused_min} minutes was your last focus time... I believe you can do better! 🐤🌱`);
                    }
                    if (last.focused_min >= 30 && last.focused_min < 120) {
                        setBirbMood("neutral");
                        setBirbReaction(`Last time you focused for ${last.focused_min} minutes. Let's do our best to beat that! 🐣☀️`);
                    }
                    if (last.focused_min >= 120) {
                        setBirbMood("happy");
                        setBirbReaction(`Last time you were amazing! You worked ${last.focused_min} whole minutes! Let's work hard again! 💪🤩`);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch last used day", err);
            }
        };

        // check if first day using app
        const isFirstDay = async () => {
            try {
                const days = await DaysAPI.list();
                if (abort) return;
                
                const daysArray = Array.isArray(days) ? days : Object.values(days || {});
                const today = todayISO();
                const pastDaysCount = (daysArray.filter(d => (d.focused_min ?? 0) > 0)).filter(d => d.date !== today).length;

                if (days.length == 0 || pastDaysCount == 4) { setIsFirstDay(true); return true; }
                else { setIsFirstDay(false); return false; }
            } catch (err) {
                console.error("Failed to load days list");
            }
        }

        // check if narrative mode is currently active (aka showBirb == true)
        const isNarrativeMode = async () => {
            const days = await DaysAPI.list();
            if (abort) return;

            const daysArray = Array.isArray(days) ? days : Object.values(days || {});
            const today = todayISO();

            const pastDaysCount = (daysArray.filter(d => (d.focused_min ?? 0) > 0)).filter(d => d.date !== today).length;
            setPastDaysUsedCount(pastDaysCount);

            const grp = await loadGroup();
            const narMode = (grp === "A" && pastDaysCount >= 4) || (grp === "B" && pastDaysCount < 4);
            setIsNarrativeMode(narMode);
            return narMode;
        }


        // call all needed functions on render
        loadUsername();
        loadGroup();
        loadLastDay();
        isFirstDay();
        isNarrativeMode();

        return () => { abort = true; };
    }, []);

    useEffect(() => {
        if (isNarrativeMode) {
            const audio = new Audio(cheep_1);
            audio.volume = 0.4;
            audio.play().catch(() => { });
        }
    }, [isFirstDay, isNarrativeMode])

    function handleContinue() {
        navigate("/goal", { replace: true });
    }

	return (
		<div id="introContainer" className='fader'>

            {isFirstDay && !isNarrativeMode && 
            <div id="introInnerContainer">
                <p id="introTitle">Welcome, {username}</p>
                <p id="introSubTitle">This is your new focus timer.</p>
                <div id="buttonWrapper">
                    <button id="introButton" onClick={handleContinue}>CONTINUE</button>
                </div>
            </div>}

            {!isFirstDay && !isNarrativeMode && 
            <div id="introInnerContainer">
                <p id="introTitle">Welcome back, {username}</p>
                <p id="introSubTitle">Last time you focused for {lastFocus} min.</p>
                <div id="buttonWrapper">
                    <button id="introButton" onClick={handleContinue}>CONTINUE</button>
                </div>
            </div>}

            {isFirstDay && isNarrativeMode && 
            <div id="introInnerContainer">
                <p id="introTitle">Cheep! Hello, {username}</p>
                <p id="introSubTitle">I am Birb and we are now friends!</p>
                <div id="birbPortraitContainer">
                    <img className="birbPortrait" src={birb_happy} alt="Birb mood portrait"/>
                </div>
                <div id="buttonWrapper">
                    <button id="introButton" onClick={handleContinue}>CONTINUE</button>
                </div>
            </div>}

            {!isFirstDay && isNarrativeMode && 
            <div id="introInnerContainer">
                <p id="introTitle">Cheep! Hello again, {username}</p>
                <p id="introSubTitle">{birbReaction}</p>
                <div id="birbPortraitContainer">
                    <img className="birbPortrait" src={birbByMood[birbMood]} alt="Birb mood portrait"/>
                </div>
                <div id="buttonWrapper">
                    <button id="introButton" onClick={handleContinue}>CONTINUE</button>
                </div>
            </div>}

		</div>
	)
}