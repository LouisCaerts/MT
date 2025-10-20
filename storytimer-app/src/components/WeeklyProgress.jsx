import '../stylesheets/WeeklyProgress.css';

import WeeklyProgressBadge from './WeeklyProgressBadge';
import { Flag } from "lucide-react";

export default function WeeklyProgress({ day="???" }) {

  return (
    <div id="progressContainer">

        <WeeklyProgressBadge id="badgeMon" showArrow={day === "monGoal"} showStar={false} label={"Mon"} />
        <WeeklyProgressBadge id="badgeTue" showArrow={day === "tueGoal"} showStar={true}  label={"Tue"} />
        <WeeklyProgressBadge id="badgeWed" showArrow={day === "wedGoal"} showStar={false} label={"Wed"} />
        <WeeklyProgressBadge id="badgeThu" showArrow={day === "thuGoal"} showStar={false} label={"Thu"} />
        <WeeklyProgressBadge id="badgeFri" showArrow={day === "friGoal"} showStar={true}  label={"Fri"} />
        <WeeklyProgressBadge id="badgeSat" showArrow={day === "satGoal"} showStar={true}  label={"Sat"} />
        <WeeklyProgressBadge id="badgeSun" showArrow={day === "sunGoal"} showStar={false} label={"Sun"} />

        <Flag id="finishFlag" size={50} strokeWidth={1} />

    </div>
  )
}