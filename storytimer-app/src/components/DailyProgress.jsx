import '../stylesheets/DailyProgress.css';

import { Link } from "react-router-dom";
import { Flag, Play } from "lucide-react";

export default function DailyProgress({ progress = 90, goal = 120 }) {
    const progressPercentage = Math.min(100, Math.round((progress / goal) * 100));

  return (
    <div id="dailyContainer">

        <span id="dailyLabel">
            {progress} out of {goal} minutes focused today!
        </span>

        <div id="dailyBar">
            <div id="dailyBarFilled" style={{ '--pct': `${progressPercentage}%` }}>
                <div id="dailyBarColour" />
            </div>
        </div>

        <Link id="dailyStartLink" to="/session">
            <span id="dailyStartSpan">
                <Play size={20} strokeWidth={2} />
                Start Focus Session
            </span>
        </Link>

    </div>
  )
}