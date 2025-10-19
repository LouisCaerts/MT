import '../stylesheets/WeeklyProgress.css';

import WeeklyProgressBadge from './WeeklyProgressBadge';
import { Flag } from "lucide-react";

export default function WeeklyProgress() {

  return (
    <div id="progressContainer">

        <WeeklyProgressBadge id="badgeMon" showArrow={false} showStar={false} label={"Mon"} />
        <WeeklyProgressBadge id="badgeTue" showArrow={false} showStar={true}  label={"Tue"} />
        <WeeklyProgressBadge id="badgeWed" showArrow={false} showStar={false} label={"Wed"} />
        <WeeklyProgressBadge id="badgeThu" showArrow={false} showStar={false} label={"Thu"} />
        <WeeklyProgressBadge id="badgeFri" showArrow={false} showStar={true}  label={"Fri"} />
        <WeeklyProgressBadge id="badgeSat" showArrow={false} showStar={true}  label={"Sat"} />
        <WeeklyProgressBadge id="badgeSun" showArrow={true}  showStar={false} label={"Sun"} />

        <Flag id="finishFlag" size={50} strokeWidth={1} />

    </div>
  )
}