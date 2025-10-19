import '../stylesheets/WeeklyProgressBadge.css';

import { ArrowDown, Star } from "lucide-react";

export default function WeeklyProgressBadge({ showArrow = true, showStar = true, label = "Mon" }) {

  return (
    <div id="badgeContainer">

        <div id="badgeArrow" className={showArrow ? "" : "hidden"}>
            <ArrowDown size={20} strokeWidth={2} />
        </div>

        <div id="badgeCircle" className={showStar ? "filled" : ""}>
            {showStar && <Star id="badgeCircleStar" size={40} strokeWidth={1} />}
        </div>

        <span id="badgeLabel">
            {label}
        </span>

    </div>
  )
}